create or replace function public.create_checkout_order_with_kits(payload jsonb)
returns table(order_id uuid,order_code text,order_public_token uuid,
 order_operational_status text,order_financial_status text,order_total numeric,order_reservation_expires_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare result record;
begin
  if jsonb_typeof(coalesce(payload->'kits','[]'::jsonb)) <> 'array'
    or coalesce((payload->>'discount')::numeric,0)<0
    or coalesce((payload->>'discount')::numeric,0)>=(payload->>'subtotal')::numeric
    then raise exception 'INVALID_ITEMS'; end if;
  select * into result from public.create_checkout_order_v2(payload);
  if jsonb_array_length(coalesce(payload->'kits','[]'::jsonb)) > 0 then
    insert into public.order_kit_details(order_id,kits) values(result.order_id,payload->'kits') on conflict on constraint order_kit_details_pkey do nothing;
  end if;
  return query select result.order_id,result.order_code,result.order_public_token,result.order_operational_status,
    result.order_financial_status,result.order_total,result.order_reservation_expires_at;
end; $$;
revoke all on function public.create_checkout_order_with_kits(jsonb) from public,anon,authenticated;
grant execute on function public.create_checkout_order_with_kits(jsonb) to service_role;
