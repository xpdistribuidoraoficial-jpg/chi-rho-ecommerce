create extension if not exists pg_cron;

-- Additive compatibility: legacy status/payment_status/total remain untouched.
alter table public.orders
  add column if not exists public_token uuid not null default gen_random_uuid() unique,
  add column if not exists operational_status text not null default 'novo'
    check (operational_status in ('novo','em_separacao','pronto_para_envio','enviado','entregue','cancelado')),
  add column if not exists financial_status text not null default 'aguardando_pagamento'
    check (financial_status in ('aguardando_pagamento','pago','recusado','cancelado','reembolsado')),
  add column if not exists customer_phone text check (customer_phone is null or customer_phone ~ '^[0-9]{10,11}$'),
  add column if not exists tax_id text check (tax_id is null or tax_id ~ '^[0-9]{11,14}$'),
  add column if not exists discount numeric(12,2) not null default 0 check (discount >= 0),
  add column if not exists payment_external_id text,
  add column if not exists payment_preference_id text,
  add column if not exists payment_method text,
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists shipping_quote_id text,
  add column if not exists tracking_code text,
  add column if not exists tracking_url text,
  add column if not exists label_url text,
  add column if not exists shipped_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists grand_total numeric(12,2)
    generated always as (subtotal + shipping_price - discount) stored;

alter table public.order_items
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists image_url text;
alter table public.order_status_history
  add column if not exists status_type text not null default 'legacy'
    check (status_type in ('legacy','operational'));

create table if not exists public.inventory (
  product_slug text primary key,
  sku text not null unique,
  product_name text not null,
  image_url text,
  stock_total integer not null check (stock_total >= 0),
  stock_reserved integer not null default 0 check (stock_reserved >= 0),
  stock_available integer generated always as (stock_total - stock_reserved) stored,
  updated_at timestamptz not null default now(),
  check (stock_reserved <= stock_total)
);

create table if not exists public.inventory_reservations (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text not null references public.inventory(product_slug),
  quantity integer not null check (quantity > 0),
  status text not null default 'reservado'
    check (status in ('reservado','confirmado','liberado','expirado')),
  expires_at timestamptz not null,
  committed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, product_slug)
);

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  provider_event_id text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  external_payment_id text,
  event_type text not null,
  raw_status text,
  mapped_status text check (mapped_status is null or mapped_status in
    ('aguardando_pagamento','pago','recusado','cancelado','reembolsado')),
  signature_valid boolean not null default false,
  processed boolean not null default false,
  error_code text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

insert into public.inventory (product_slug,sku,product_name,image_url,stock_total) values
 ('casa-balanca-digital-cozinha-10kg','CASA-BALANCA-10KG','Balança Digital de Cozinha 10 kg','assets/products/casa-balanca-digital-cozinha-10kg-frente.webp',5),
 ('casa-bomba-eletrica-garrafa-agua','CASA-BOMBA-AGUA-USB','Bomba Elétrica USB para Garrafão de Água','assets/products/casa-bomba-eletrica-garrafa-agua-frente.webp',5)
on conflict (product_slug) do update set sku=excluded.sku,product_name=excluded.product_name,image_url=excluded.image_url;

create index if not exists inventory_reservations_active_expiry_idx on public.inventory_reservations(expires_at,order_id) where status='reservado';
create index if not exists inventory_reservations_order_id_idx on public.inventory_reservations(order_id);
create index if not exists payment_events_order_created_at_idx on public.payment_events(order_id,created_at desc);
create index if not exists payment_events_external_payment_id_idx on public.payment_events(external_payment_id) where external_payment_id is not null;
create index if not exists orders_financial_created_at_idx on public.orders(financial_status,created_at desc);
create index if not exists orders_operational_created_at_idx on public.orders(operational_status,created_at desc);

create or replace function private.record_standard_operational_status()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' or new.operational_status is distinct from old.operational_status then
    insert into public.order_status_history(order_id,previous_status,status,status_type)
    values(new.id,case when tg_op='UPDATE' then old.operational_status else null end,new.operational_status,'operational');
  end if;
  return new;
end; $$;

-- Forward declarations; complete bodies are installed later in this migration.
create or replace function public.expire_inventory_reservations(batch_size integer default 200)
returns integer language sql security invoker set search_path='' as $$ select 0 $$;
create or replace function public.create_checkout_order_v2(payload jsonb)
returns table(order_id uuid,order_code text,order_public_token uuid,
  order_operational_status text,order_financial_status text,order_total numeric,
  order_reservation_expires_at timestamptz)
language plpgsql security invoker set search_path='' as $$
begin raise exception 'NOT_INITIALIZED'; end; $$;

create or replace function public.apply_order_payment_status(
  target_order_id uuid,new_financial_status text,provider_event_key text,
  external_payment_id text default null,payment_method_name text default null,
  event_type_name text default 'payment.updated',raw_provider_status text default null,
  event_signature_valid boolean default false,event_reason text default null)
returns table(order_id uuid,order_code text,financial_status text,operational_status text,event_processed boolean)
language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype; v_event bigint;
begin
  if new_financial_status not in ('aguardando_pagamento','pago','recusado','cancelado','reembolsado')
    then raise exception 'INVALID_PAYMENT_STATUS'; end if;
  insert into public.payment_events(provider_event_id,order_id,external_payment_id,event_type,
    raw_status,mapped_status,signature_valid)
  values(provider_event_key,target_order_id,external_payment_id,event_type_name,
    raw_provider_status,new_financial_status,event_signature_valid)
  on conflict(provider_event_id) do nothing returning id into v_event;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_event is null then
    return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,false; return;
  end if;
  if v_order.financial_status='pago' and new_financial_status in ('recusado','cancelado') then
    update public.payment_events set error_code='INVALID_PAYMENT_TRANSITION',processed_at=now() where id=v_event;
    return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,false; return;
  end if;
  if new_financial_status='pago' and v_order.financial_status<>'pago' then
    if not exists(select 1 from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado') then
      update public.payment_events set error_code='RESERVATION_NOT_ACTIVE',processed_at=now() where id=v_event;
      raise exception 'RESERVATION_NOT_ACTIVE';
    end if;
    update public.inventory i set stock_total=i.stock_total-r.qty,stock_reserved=i.stock_reserved-r.qty from (
      select reservation.product_slug,sum(reservation.quantity)::integer qty
      from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado'
      group by reservation.product_slug
    ) r where i.product_slug=r.product_slug;
    update public.inventory_reservations reservation set status='confirmado',committed_at=now()
    where reservation.order_id=v_order.id and reservation.status='reservado';
  elsif new_financial_status in ('recusado','cancelado') and v_order.financial_status<>new_financial_status then
    update public.inventory i set stock_reserved=i.stock_reserved-r.qty from (
      select reservation.product_slug,sum(reservation.quantity)::integer qty
      from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado'
      group by reservation.product_slug
    ) r where i.product_slug=r.product_slug;
    update public.inventory_reservations reservation set status='liberado',released_at=now(),
      release_reason=coalesce(event_reason,new_financial_status)
    where reservation.order_id=v_order.id and reservation.status='reservado';
  end if;
  update public.orders set financial_status=new_financial_status,
    payment_external_id=coalesce(external_payment_id,payment_external_id),
    payment_reference=coalesce(external_payment_id,payment_reference),
    payment_method=coalesce(payment_method_name,payment_method),
    operational_status=case when new_financial_status in ('recusado','cancelado') then 'cancelado' else operational_status end,
    cancelled_at=case when new_financial_status in ('recusado','cancelado') then coalesce(cancelled_at,now()) else cancelled_at end,
    cancellation_reason=case when new_financial_status in ('recusado','cancelado')
      then coalesce(event_reason,cancellation_reason,new_financial_status) else cancellation_reason end
  where id=v_order.id returning * into v_order;
  update public.payment_events set processed=true,processed_at=now() where id=v_event;
  return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,true;
end; $$;

create or replace function public.update_order_operation(
  target_order_id uuid,new_operational_status text,actor_user_id uuid,
  tracking_code_value text default null,tracking_url_value text default null,action_note text default null)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype;
begin
  if new_operational_status not in ('em_separacao','pronto_para_envio','enviado','entregue','cancelado')
    then raise exception 'INVALID_OPERATIONAL_STATUS'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if new_operational_status='em_separacao' and not(v_order.operational_status='novo' and v_order.financial_status='pago')
    then raise exception 'INVALID_OPERATIONAL_TRANSITION';
  elsif new_operational_status='pronto_para_envio' and v_order.operational_status<>'em_separacao'
    then raise exception 'INVALID_OPERATIONAL_TRANSITION';
  elsif new_operational_status='enviado' and v_order.operational_status<>'pronto_para_envio'
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

alter table public.inventory enable row level security; alter table public.inventory force row level security;
alter table public.inventory_reservations enable row level security; alter table public.inventory_reservations force row level security;
alter table public.payment_events enable row level security; alter table public.payment_events force row level security;
alter table public.admin_users enable row level security; alter table public.admin_users force row level security;
alter table public.admin_audit_log enable row level security; alter table public.admin_audit_log force row level security;
revoke all on public.inventory,public.inventory_reservations,public.payment_events,public.admin_users,public.admin_audit_log from public,anon,authenticated;
revoke all on function public.expire_inventory_reservations(integer) from public,anon,authenticated;
revoke all on function public.create_checkout_order_v2(jsonb) from public,anon,authenticated;
revoke all on function public.apply_order_payment_status(uuid,text,text,text,text,text,text,boolean,text) from public,anon,authenticated;
revoke all on function public.update_order_operation(uuid,text,uuid,text,text,text) from public,anon,authenticated;
grant select,insert,update on public.inventory,public.inventory_reservations,public.payment_events,public.admin_users,public.admin_audit_log to service_role;
grant usage,select on all sequences in schema public to service_role;
grant execute on function public.expire_inventory_reservations(integer) to service_role;
grant execute on function public.create_checkout_order_v2(jsonb) to service_role;
grant execute on function public.apply_order_payment_status(uuid,text,text,text,text,text,text,boolean,text) to service_role;
grant execute on function public.update_order_operation(uuid,text,uuid,text,text,text) to service_role;

do $$ begin
  if not exists(select 1 from cron.job where jobname='chi-rho-expire-inventory-reservations') then
    perform cron.schedule('chi-rho-expire-inventory-reservations','* * * * *','select public.expire_inventory_reservations(200);');
  end if;
end $$;
comment on table public.inventory is 'Estoque físico, reservado e disponível dos produtos liberados para venda.';
comment on table public.inventory_reservations is 'Reservas temporárias e idempotentes vinculadas aos pedidos.';
comment on table public.payment_events is 'Eventos financeiros mínimos, sem payload sensível do provedor.';
comment on table public.admin_users is 'Usuários do Supabase Auth autorizados a operar o painel de pedidos.';
create trigger orders_record_standard_operational_status after insert or update of operational_status on public.orders
for each row execute function private.record_standard_operational_status();
create trigger inventory_set_updated_at before update on public.inventory for each row execute function private.set_order_updated_at();
create trigger inventory_reservations_set_updated_at before update on public.inventory_reservations for each row execute function private.set_order_updated_at();
create trigger admin_users_set_updated_at before update on public.admin_users for each row execute function private.set_order_updated_at();

create or replace function public.expire_inventory_reservations(batch_size integer default 200)
returns integer language plpgsql security invoker set search_path='' as $$
declare v_ids bigint[]; v_orders uuid[]; v_count integer;
begin
  select array_agg(x.id),array_agg(x.order_id) into v_ids,v_orders from (
    select id,order_id from public.inventory_reservations
    where status='reservado' and expires_at<=now()
    order by expires_at,id for update skip locked
    limit greatest(1,least(coalesce(batch_size,200),1000))
  ) x;
  v_count:=coalesce(cardinality(v_ids),0);
  if v_count=0 then return 0; end if;
  update public.inventory i set stock_reserved=i.stock_reserved-r.qty from (
    select product_slug,sum(quantity)::integer qty from public.inventory_reservations
    where id=any(v_ids) group by product_slug
  ) r where i.product_slug=r.product_slug;
  update public.inventory_reservations set status='expirado',released_at=now(),release_reason='reserva_vencida'
  where id=any(v_ids) and status='reservado';
  update public.orders set financial_status='cancelado',operational_status='cancelado',
    cancelled_at=coalesce(cancelled_at,now()),cancellation_reason=coalesce(cancellation_reason,'reserva_vencida')
  where id=any(v_orders) and financial_status='aguardando_pagamento';
  return v_count;
end; $$;

create or replace function public.create_checkout_order_v2(payload jsonb)
returns table(order_id uuid,order_code text,order_public_token uuid,
  order_operational_status text,order_financial_status text,order_total numeric,
  order_reservation_expires_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype; v_expiry timestamptz:=now()+interval '30 minutes'; v_count integer;
begin
  if payload is null or jsonb_typeof(payload->'items')<>'array' or jsonb_array_length(payload->'items')=0
    then raise exception 'INVALID_ITEMS'; end if;
  select * into v_order from public.orders where client_request_id=(payload->>'client_request_id')::uuid;
  if found then
    return query select v_order.id,v_order.code,v_order.public_token,v_order.operational_status,
      v_order.financial_status,v_order.grand_total,v_order.reservation_expires_at; return;
  end if;
  perform public.expire_inventory_reservations(200);
  select count(distinct item->>'slug') into v_count from jsonb_array_elements(payload->'items') item;
  if v_count<>jsonb_array_length(payload->'items') then raise exception 'INVALID_ITEMS'; end if;
  perform 1 from public.inventory i where i.product_slug in
    (select item->>'slug' from jsonb_array_elements(payload->'items') item)
    order by i.product_slug for update;
  if (select count(*) from public.inventory where product_slug in
    (select item->>'slug' from jsonb_array_elements(payload->'items') item))<>v_count
    then raise exception 'INVALID_ITEMS'; end if;
  if exists(select 1 from jsonb_array_elements(payload->'items') item
    join public.inventory i on i.product_slug=item->>'slug'
    where coalesce((item->>'quantity')::integer,0)<1 or (item->>'quantity')::integer>i.stock_available)
    then raise exception 'OUT_OF_STOCK'; end if;
  insert into public.orders(client_request_id,operational_status,financial_status,
    customer_name,customer_email,customer_whatsapp,customer_phone,tax_id,
    whatsapp_marketing_consent,marketing_consent_at,postal_code,street,address_number,
    complement,district,city,state,shipping_carrier,shipping_carrier_code,shipping_service,
    shipping_service_code,shipping_delivery_time,shipping_price,shipping_quoted_at,
    shipping_quote_id,subtotal,discount,reservation_expires_at)
  values((payload->>'client_request_id')::uuid,'novo','aguardando_pagamento',
    payload#>>'{customer,name}',lower(payload#>>'{customer,email}'),payload#>>'{customer,whatsapp}',
    nullif(payload#>>'{customer,phone}',''),nullif(payload#>>'{customer,tax_id}',''),
    coalesce((payload#>>'{customer,whatsapp_marketing_consent}')::boolean,false),
    case when coalesce((payload#>>'{customer,whatsapp_marketing_consent}')::boolean,false) then now() end,
    payload#>>'{address,postal_code}',payload#>>'{address,street}',payload#>>'{address,number}',
    nullif(payload#>>'{address,complement}',''),payload#>>'{address,district}',payload#>>'{address,city}',
    upper(payload#>>'{address,state}'),payload#>>'{shipping,carrier}',nullif(payload#>>'{shipping,carrier_code}',''),
    payload#>>'{shipping,service}',nullif(payload#>>'{shipping,service_code}',''),
    nullif(payload#>>'{shipping,delivery_time}',''),(payload#>>'{shipping,price}')::numeric(12,2),
    (payload#>>'{shipping,quoted_at}')::timestamptz,nullif(payload#>>'{shipping,quote_id}',''),
    (payload->>'subtotal')::numeric(12,2),coalesce((payload->>'discount')::numeric(12,2),0),v_expiry)
  returning * into v_order;
  insert into public.order_items(order_id,product_id,product_slug,sku,product_name,category,image_url,unit_price,quantity)
  select v_order.id,p.id,item->>'slug',item->>'sku',item->>'name',item->>'category',i.image_url,
    (item->>'unit_price')::numeric(12,2),(item->>'quantity')::smallint
  from jsonb_array_elements(payload->'items') item join public.inventory i on i.product_slug=item->>'slug'
  left join public.products p on p.slug=item->>'slug';
  if (select coalesce(sum(order_item.line_total),0) from public.order_items order_item
      where order_item.order_id=v_order.id)<>v_order.subtotal
    then raise exception 'ORDER_SUBTOTAL_MISMATCH'; end if;
  insert into public.inventory_reservations(order_id,product_slug,quantity,expires_at)
  select v_order.id,item->>'slug',(item->>'quantity')::integer,v_expiry
  from jsonb_array_elements(payload->'items') item;
  update public.inventory i set stock_reserved=i.stock_reserved+r.qty from (
    select item->>'slug' slug,(item->>'quantity')::integer qty
    from jsonb_array_elements(payload->'items') item
  ) r where i.product_slug=r.slug;
  return query select v_order.id,v_order.code,v_order.public_token,v_order.operational_status,
    v_order.financial_status,v_order.grand_total,v_order.reservation_expires_at;
end; $$;
