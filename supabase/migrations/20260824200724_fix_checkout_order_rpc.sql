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

revoke all on function public.create_checkout_order(jsonb)
  from public, anon, authenticated;
grant execute on function public.create_checkout_order(jsonb) to service_role;
