create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default (
    'CHR-' || to_char(statement_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  client_request_id uuid not null unique,
  status text not null default 'awaiting_payment'
    check (status in (
      'awaiting_payment', 'payment_pending', 'paid', 'preparing',
      'shipped', 'delivered', 'cancelled'
    )),
  payment_status text not null default 'not_started'
    check (payment_status in ('not_started', 'pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  payment_provider text not null default 'mercado_pago',
  payment_reference text,
  customer_name text not null check (char_length(customer_name) between 3 and 160),
  customer_email text not null check (char_length(customer_email) between 5 and 320),
  customer_whatsapp text not null check (customer_whatsapp ~ '^[0-9]{10,11}$'),
  whatsapp_marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  postal_code text not null check (postal_code ~ '^[0-9]{8}$'),
  street text not null check (char_length(street) between 2 and 180),
  address_number text not null check (char_length(address_number) between 1 and 30),
  complement text check (complement is null or char_length(complement) <= 120),
  district text not null check (char_length(district) between 2 and 120),
  city text not null check (char_length(city) between 2 and 120),
  state text not null check (state ~ '^[A-Z]{2}$'),
  shipping_carrier text not null check (char_length(shipping_carrier) between 2 and 120),
  shipping_carrier_code text,
  shipping_service text not null check (char_length(shipping_service) between 2 and 160),
  shipping_service_code text,
  shipping_delivery_time text,
  shipping_price numeric(12,2) not null check (shipping_price >= 0),
  shipping_quoted_at timestamptz not null,
  subtotal numeric(12,2) not null check (subtotal > 0),
  total numeric(12,2) generated always as (subtotal + shipping_price) stored,
  currency text not null default 'BRL' check (currency = 'BRL'),
  source text not null default 'checkout-casa' check (source = 'checkout-casa'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text not null,
  sku text not null,
  product_name text not null,
  category text not null,
  unit_price numeric(12,2) not null check (unit_price > 0),
  quantity smallint not null check (quantity between 1 and 99),
  line_total numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now(),
  unique (order_id, product_slug)
);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index orders_customer_email_created_at_idx on public.orders (lower(customer_email), created_at desc);
create index orders_open_created_at_idx on public.orders (created_at desc)
  where status in ('awaiting_payment', 'payment_pending', 'paid', 'preparing');
create index order_items_order_id_idx on public.order_items (order_id);
create index order_status_history_order_id_created_at_idx
  on public.order_status_history (order_id, created_at desc);

create or replace function private.set_order_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.record_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, previous_status, status)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status else null end,
      new.status
    );
  end if;
  return new;
end;
$$;

create trigger orders_set_updated_at
before update on public.orders
for each row execute function private.set_order_updated_at();

create trigger orders_record_status
after insert or update of status on public.orders
for each row execute function private.record_order_status();

create or replace function public.create_checkout_order(payload jsonb)
returns table (
  order_id uuid,
  order_code text,
  order_status text,
  order_total numeric
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if payload is null or jsonb_typeof(payload -> 'items') <> 'array'
    or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'invalid order payload';
  end if;

  select * into v_order
  from public.orders
  where client_request_id = (payload ->> 'client_request_id')::uuid;

  if found then
    return query select v_order.id, v_order.code, v_order.status, v_order.total;
    return;
  end if;

  insert into public.orders (
    client_request_id,
    customer_name,
    customer_email,
    customer_whatsapp,
    whatsapp_marketing_consent,
    marketing_consent_at,
    postal_code,
    street,
    address_number,
    complement,
    district,
    city,
    state,
    shipping_carrier,
    shipping_carrier_code,
    shipping_service,
    shipping_service_code,
    shipping_delivery_time,
    shipping_price,
    shipping_quoted_at,
    subtotal
  ) values (
    (payload ->> 'client_request_id')::uuid,
    payload #>> '{customer,name}',
    lower(payload #>> '{customer,email}'),
    payload #>> '{customer,whatsapp}',
    coalesce((payload #>> '{customer,whatsapp_marketing_consent}')::boolean, false),
    case
      when coalesce((payload #>> '{customer,whatsapp_marketing_consent}')::boolean, false) then now()
      else null
    end,
    payload #>> '{address,postal_code}',
    payload #>> '{address,street}',
    payload #>> '{address,number}',
    nullif(payload #>> '{address,complement}', ''),
    payload #>> '{address,district}',
    payload #>> '{address,city}',
    upper(payload #>> '{address,state}'),
    payload #>> '{shipping,carrier}',
    nullif(payload #>> '{shipping,carrier_code}', ''),
    payload #>> '{shipping,service}',
    nullif(payload #>> '{shipping,service_code}', ''),
    nullif(payload #>> '{shipping,delivery_time}', ''),
    (payload #>> '{shipping,price}')::numeric(12,2),
    (payload #>> '{shipping,quoted_at}')::timestamptz,
    (payload ->> 'subtotal')::numeric(12,2)
  )
  returning * into v_order;

  insert into public.order_items (
    order_id,
    product_slug,
    sku,
    product_name,
    category,
    unit_price,
    quantity
  )
  select
    v_order.id,
    item ->> 'slug',
    item ->> 'sku',
    item ->> 'name',
    item ->> 'category',
    (item ->> 'unit_price')::numeric(12,2),
    (item ->> 'quantity')::smallint
  from jsonb_array_elements(payload -> 'items') as item;

  if (
    select coalesce(sum(oi.line_total), 0)
    from public.order_items as oi
    where oi.order_id = v_order.id
  ) <> v_order.subtotal then
    raise exception 'order subtotal mismatch';
  end if;

  return query select v_order.id, v_order.code, v_order.status, v_order.total;
end;
$$;

alter table public.orders enable row level security;
alter table public.orders force row level security;
alter table public.order_items enable row level security;
alter table public.order_items force row level security;
alter table public.order_status_history enable row level security;
alter table public.order_status_history force row level security;

revoke all on public.orders, public.order_items, public.order_status_history
  from public, anon, authenticated;
revoke all on function public.create_checkout_order(jsonb)
  from public, anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update on public.orders to service_role;
grant select, insert on public.order_items, public.order_status_history to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.create_checkout_order(jsonb) to service_role;

comment on table public.orders is 'Pedidos recebidos pelo checkout da Chi Rho.';
comment on table public.order_items is 'Itens imutáveis registrados no momento do pedido.';
comment on table public.order_status_history is 'Histórico operacional de alterações de status do pedido.';
