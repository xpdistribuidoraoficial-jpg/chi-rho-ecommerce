alter table public.inventory
  add column if not exists unit_price numeric(12,2) check (unit_price is null or unit_price >= 0),
  add column if not exists weight_kg numeric(8,3) check (weight_kg is null or weight_kg > 0),
  add column if not exists length_cm numeric(8,2) check (length_cm is null or length_cm > 0),
  add column if not exists height_cm numeric(8,2) check (height_cm is null or height_cm > 0),
  add column if not exists width_cm numeric(8,2) check (width_cm is null or width_cm > 0),
  add column if not exists category text,
  add column if not exists is_fragile boolean not null default false;

update public.inventory set
  unit_price = case product_slug
    when 'casa-balanca-digital-cozinha-10kg' then 29.90
    when 'casa-bomba-eletrica-garrafa-agua' then 32.90
    else unit_price end,
  weight_kg = case product_slug
    when 'casa-balanca-digital-cozinha-10kg' then 0.360
    when 'casa-bomba-eletrica-garrafa-agua' then 0.400
    else weight_kg end,
  length_cm = case product_slug
    when 'casa-balanca-digital-cozinha-10kg' then 24.50
    when 'casa-bomba-eletrica-garrafa-agua' then 14.00
    else length_cm end,
  height_cm = case product_slug
    when 'casa-balanca-digital-cozinha-10kg' then 4.40
    when 'casa-bomba-eletrica-garrafa-agua' then 9.00
    else height_cm end,
  width_cm = case product_slug
    when 'casa-balanca-digital-cozinha-10kg' then 19.00
    when 'casa-bomba-eletrica-garrafa-agua' then 8.00
    else width_cm end,
  category = case product_slug
    when 'casa-balanca-digital-cozinha-10kg' then 'Cozinha'
    when 'casa-bomba-eletrica-garrafa-agua' then 'Utilidades Domésticas'
    else category end
where product_slug in ('casa-balanca-digital-cozinha-10kg','casa-bomba-eletrica-garrafa-agua');

alter table public.orders
  add column if not exists payment_preference_url text,
  add column if not exists payment_preference_created_at timestamptz,
  add column if not exists shipping_label_provider text
    check (shipping_label_provider is null or shipping_label_provider in ('frenet')),
  add column if not exists shipping_label_id text,
  add column if not exists label_status text not null default 'nao_solicitada'
    check (label_status in ('nao_solicitada','gerando','gerada','falhou')),
  add column if not exists label_request_key uuid,
  add column if not exists label_created_at timestamptz,
  add column if not exists label_valid_through timestamptz,
  add column if not exists declaration_url text,
  add column if not exists label_last_error text;

create unique index if not exists orders_shipping_label_provider_id_uidx
  on public.orders(shipping_label_provider,shipping_label_id)
  where shipping_label_id is not null;

create or replace function public.authorize_admin_session(target_user_id uuid,target_session_id uuid)
returns table(display_name text)
language sql
security definer
set search_path=''
stable
as $$
  select admin_user.display_name
  from public.admin_users admin_user
  join auth.sessions session on session.user_id=admin_user.user_id
    and session.id=target_session_id
  where admin_user.user_id=target_user_id
    and admin_user.active=true
    and (session.not_after is null or session.not_after>now())
  limit 1
$$;

create or replace function public.claim_shipping_label(target_order_id uuid,actor_user_id uuid)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_order public.orders%rowtype; v_request_key uuid:=gen_random_uuid();
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true)
    then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.financial_status<>'pago' then raise exception 'ORDER_NOT_PAID'; end if;
  if v_order.operational_status<>'pronto_para_envio' then raise exception 'ORDER_NOT_READY'; end if;
  if v_order.cancelled_at is not null then raise exception 'ORDER_CANCELLED'; end if;
  if coalesce(v_order.postal_code,'')='' or coalesce(v_order.street,'')='' or
    coalesce(v_order.address_number,'')='' or coalesce(v_order.district,'')='' or
    coalesce(v_order.city,'')='' or coalesce(v_order.state,'')='' then
    raise exception 'ADDRESS_INCOMPLETE';
  end if;
  if coalesce(v_order.shipping_carrier,'')='' or coalesce(v_order.shipping_service,'')='' or
    coalesce(v_order.shipping_service_code,'')='' or v_order.shipping_price is null then
    raise exception 'SHIPPING_INCOMPLETE';
  end if;
  if v_order.label_status='gerada' or v_order.shipping_label_id is not null then
    raise exception 'LABEL_ALREADY_GENERATED';
  end if;
  if v_order.label_status='gerando' and v_order.updated_at>now()-interval '5 minutes' then
    raise exception 'LABEL_IN_PROGRESS';
  end if;
  if not exists(select 1 from public.order_items where order_id=v_order.id) then
    raise exception 'ITEMS_MISSING';
  end if;
  if exists(
    select 1 from public.order_items item
    left join public.inventory inventory on inventory.product_slug=item.product_slug
    where item.order_id=v_order.id and (
      inventory.product_slug is null or inventory.unit_price is null or
      inventory.weight_kg is null or inventory.length_cm is null or
      inventory.height_cm is null or inventory.width_cm is null or
      inventory.category is null or item.quantity<1 or item.unit_price<>inventory.unit_price
    )
  ) then raise exception 'PRODUCT_SHIPPING_DATA_INCOMPLETE'; end if;
  if exists(
    select 1 from public.order_items item
    where item.order_id=v_order.id and not exists(
      select 1 from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.product_slug=item.product_slug
        and reservation.status='confirmado' and reservation.quantity=item.quantity
    )
  ) then raise exception 'STOCK_NOT_COMMITTED'; end if;
  update public.orders set label_status='gerando',label_request_key=v_request_key,
    label_last_error=null where id=v_order.id;
  insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,v_order.id,'etiqueta:solicitada','Frenet OneClick');
  return v_request_key;
end;
$$;

create or replace function public.complete_shipping_label(
  target_order_id uuid,request_key uuid,actor_user_id uuid,
  provider_name text,provider_label_id text,label_document_url text,
  declaration_document_url text,provider_tracking_url text,
  provider_tracking_code text,label_expiration timestamptz)
returns public.orders
language plpgsql
security invoker
set search_path=''
as $$
declare v_order public.orders%rowtype;
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true)
    then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.label_status='gerada' and v_order.shipping_label_id=provider_label_id then return v_order; end if;
  if v_order.label_status<>'gerando' or v_order.label_request_key<>request_key
    then raise exception 'LABEL_CLAIM_MISMATCH'; end if;
  if provider_name<>'frenet' or coalesce(provider_label_id,'')='' or coalesce(label_document_url,'')=''
    then raise exception 'INVALID_LABEL_RESULT'; end if;
  update public.orders set shipping_label_provider=provider_name,
    shipping_label_id=provider_label_id,label_url=label_document_url,
    declaration_url=nullif(declaration_document_url,''),
    tracking_url=coalesce(nullif(provider_tracking_url,''),tracking_url),
    tracking_code=coalesce(nullif(provider_tracking_code,''),tracking_code),
    label_status='gerada',label_created_at=now(),label_valid_through=label_expiration,
    label_request_key=null,label_last_error=null
  where id=v_order.id returning * into v_order;
  insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,v_order.id,'etiqueta:gerada','Frenet shipment '||provider_label_id);
  return v_order;
end;
$$;

create or replace function public.fail_shipping_label(
  target_order_id uuid,request_key uuid,actor_user_id uuid,error_code text)
returns void
language plpgsql
security invoker
set search_path=''
as $$
begin
  update public.orders set label_status='falhou',label_request_key=null,
    label_last_error=left(coalesce(error_code,'FRENET_ERROR'),120)
  where id=target_order_id and label_status='gerando' and label_request_key=request_key;
  if found then
    insert into public.admin_audit_log(admin_user_id,order_id,action,note)
      values(actor_user_id,target_order_id,'etiqueta:falhou',left(coalesce(error_code,'FRENET_ERROR'),120));
  end if;
end;
$$;

create or replace function public.prepare_payment_preference(target_order_code text,target_public_token uuid)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_order public.orders%rowtype; v_calculated_subtotal numeric(12,2);
begin
  select * into v_order from public.orders
  where code=target_order_code and public_token=target_public_token for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.financial_status<>'aguardando_pagamento' then raise exception 'ORDER_NOT_PAYABLE'; end if;
  if v_order.reservation_expires_at is null or v_order.reservation_expires_at<=now()
    then raise exception 'RESERVATION_EXPIRED'; end if;
  if not exists(select 1 from public.inventory_reservations where order_id=v_order.id and status='reservado')
    then raise exception 'RESERVATION_NOT_ACTIVE'; end if;
  select round(sum(item.quantity*inventory.unit_price),2) into v_calculated_subtotal
  from public.order_items item
  join public.inventory inventory on inventory.product_slug=item.product_slug
  where item.order_id=v_order.id;
  if v_calculated_subtotal is null or v_calculated_subtotal<>v_order.subtotal
    or v_order.grand_total<>v_calculated_subtotal+v_order.shipping_price-v_order.discount
    then raise exception 'ORDER_TOTAL_MISMATCH'; end if;
  return v_order.id;
end;
$$;

create or replace function public.update_order_operation(
  target_order_id uuid,new_operational_status text,actor_user_id uuid,
  tracking_code_value text default null,tracking_url_value text default null,action_note text default null)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype;
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true)
    then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  if new_operational_status not in ('em_separacao','pronto_para_envio','enviado','entregue','cancelado')
    then raise exception 'INVALID_OPERATIONAL_STATUS'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if new_operational_status='em_separacao' and not(v_order.operational_status='novo' and v_order.financial_status='pago')
    then raise exception 'INVALID_OPERATIONAL_TRANSITION';
  elsif new_operational_status='pronto_para_envio' and v_order.operational_status<>'em_separacao'
    then raise exception 'INVALID_OPERATIONAL_TRANSITION';
  elsif new_operational_status='enviado' and (v_order.operational_status<>'pronto_para_envio'
    or v_order.label_status<>'gerada' or (v_order.tracking_code is null and v_order.tracking_url is null))
    then raise exception 'INVALID_OPERATIONAL_TRANSITION';
  elsif new_operational_status='entregue' and v_order.operational_status<>'enviado'
    then raise exception 'INVALID_OPERATIONAL_TRANSITION'; end if;
  update public.orders set operational_status=new_operational_status,
    tracking_code=coalesce(nullif(tracking_code_value,''),tracking_code),
    tracking_url=coalesce(nullif(tracking_url_value,''),tracking_url),
    shipped_at=case when new_operational_status='enviado' then coalesce(shipped_at,now()) else shipped_at end,
    cancelled_at=case when new_operational_status='cancelado' then coalesce(cancelled_at,now()) else cancelled_at end,
    cancellation_reason=case when new_operational_status='cancelado' then coalesce(action_note,cancellation_reason) else cancellation_reason end
  where id=target_order_id returning * into v_order;
  insert into public.admin_audit_log(admin_user_id,order_id,action,note)
  values(actor_user_id,target_order_id,'status:'||new_operational_status,action_note);
  return v_order;
end; $$;

revoke all on function public.authorize_admin_session(uuid,uuid) from public,anon,authenticated;
revoke all on function public.claim_shipping_label(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_shipping_label(uuid,uuid,uuid,text,text,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.fail_shipping_label(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.prepare_payment_preference(text,uuid) from public,anon,authenticated;
grant execute on function public.authorize_admin_session(uuid,uuid) to service_role;
grant execute on function public.claim_shipping_label(uuid,uuid) to service_role;
grant execute on function public.complete_shipping_label(uuid,uuid,uuid,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.fail_shipping_label(uuid,uuid,uuid,text) to service_role;
grant execute on function public.prepare_payment_preference(text,uuid) to service_role;

comment on function public.authorize_admin_session(uuid,uuid) is 'Valida simultaneamente usuário, sessão ativa e autorização administrativa; executável somente pelo backend service_role.';
comment on function public.claim_shipping_label(uuid,uuid) is 'Reserva idempotente da emissão de etiqueta após validações financeiras, logísticas e de estoque.';
