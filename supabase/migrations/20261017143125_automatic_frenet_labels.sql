-- Closed-package snapshot; no public grants or automatic purchases for pickup.
alter table public.orders add column if not exists shipping_package jsonb;

-- Do not unlock an inconclusive financial call, even after its timeout.
create or replace function public.fail_shipping_label(
  target_order_id uuid,request_key uuid,actor_user_id uuid,error_code text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true)
    then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  update public.orders set
    label_status=case when error_code='LABEL_RECONCILIATION_REQUIRED' then 'gerando' else 'falhou' end,
    label_request_key=case when error_code='LABEL_RECONCILIATION_REQUIRED' then label_request_key else null end,
    label_last_error=left(coalesce(error_code,'FRENET_ERROR'),120)
    where id=target_order_id and label_status='gerando' and label_request_key=request_key;
  if found then insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,target_order_id,'etiqueta:falhou',left(coalesce(error_code,'FRENET_ERROR'),120)); end if;
end $$;

create or replace function public.prepare_order_shipping(
  target_order_id uuid,actor_user_id uuid,package_details jsonb,action_note text default null)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype; v_key text; v_limit numeric;
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true)
    then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.financial_status<>'pago' then raise exception 'ORDER_NOT_PAID'; end if;
  if v_order.shipping_carrier_code='PICKUP_VENDOR' then raise exception 'PICKUP_ORDER'; end if;
  if v_order.cancelled_at is not null or v_order.operational_status not in ('em_separacao','pronto_para_envio')
    then raise exception 'INVALID_OPERATIONAL_TRANSITION'; end if;
  if v_order.label_status='gerada' or v_order.shipping_label_id is not null then raise exception 'LABEL_ALREADY_GENERATED'; end if;
  if v_order.label_status='gerando' or v_order.label_request_key is not null then raise exception 'LABEL_IN_PROGRESS'; end if;
  if jsonb_typeof(package_details) is distinct from 'object' then raise exception 'SHIPPING_PACKAGE_REQUIRED'; end if;
  foreach v_key in array array['weightKg','lengthCm','widthCm','heightCm'] loop
    if jsonb_typeof(package_details->v_key) is distinct from 'number' then raise exception 'SHIPPING_PACKAGE_REQUIRED'; end if;
    v_limit:=case when v_key='weightKg' then 30 else 200 end;
    if (package_details->>v_key)::numeric<=0 or (package_details->>v_key)::numeric>v_limit then raise exception 'SHIPPING_PACKAGE_REQUIRED'; end if;
  end loop;
  if v_order.operational_status='em_separacao' then
    perform public.update_order_operation(target_order_id,'pronto_para_envio',actor_user_id,null,null,action_note);
  end if;
  update public.orders set shipping_package=jsonb_build_object(
    'weightKg',(package_details->>'weightKg')::numeric,'lengthCm',(package_details->>'lengthCm')::numeric,
    'widthCm',(package_details->>'widthCm')::numeric,'heightCm',(package_details->>'heightCm')::numeric)
    where id=target_order_id returning * into v_order;
  insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,target_order_id,'etiqueta:embalagem_conferida','Pacote fechado conferido; emissão Frenet ao preparar envio.');
  return v_order;
end $$;

revoke all on function public.prepare_order_shipping(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.prepare_order_shipping(uuid,uuid,jsonb,text) to service_role;

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
  if v_order.shipping_carrier_code='PICKUP_VENDOR' then raise exception 'PICKUP_ORDER'; end if;
  if v_order.shipping_package is null then raise exception 'SHIPPING_PACKAGE_REQUIRED'; end if;
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
  if v_order.label_status='gerando' or v_order.label_request_key is not null then
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
      inventory.category is null or item.quantity<1 or item.unit_price<0 or item.line_total<>round(item.unit_price*item.quantity,2)
    )
  ) then raise exception 'PRODUCT_SHIPPING_DATA_INCOMPLETE'; end if;
  if v_order.subtotal<>(select coalesce(sum(line_total),0) from public.order_items where order_id=v_order.id)
    or v_order.grand_total<>round(v_order.subtotal-v_order.discount+v_order.shipping_price,2)
    then raise exception 'ORDER_TOTAL_MISMATCH'; end if;
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

