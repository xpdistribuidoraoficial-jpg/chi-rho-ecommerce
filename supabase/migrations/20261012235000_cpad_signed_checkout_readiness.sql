-- Keep preview and production signing credentials isolated. Never commit their secret values.
-- The health action confirms a valid signature before allowing kit checkout.
create or replace function private.cpad_signed_action(payload_text text, signature text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare key text; payload jsonb; result record; target_id uuid; target_order public.orders%rowtype; expiry timestamptz;
begin
  if payload_text is null or signature is null or length(payload_text)>50000 or signature !~ '^[0-9a-f]{64}$' then
    raise exception 'UNAUTHORIZED';
  end if;
  select secret into key from private.cpad_checkout_keys
  where name in ('production','preview') and extensions.hmac(payload_text,secret,'sha256')=decode(signature,'hex')
  order by case when name='production' then 0 else 1 end limit 1;
  if key is null then raise exception 'UNAUTHORIZED'; end if;
  payload:=payload_text::jsonb;
  if payload->>'signed_at' is null or abs(extract(epoch from now())*1000-(payload->>'signed_at')::numeric)>90000 then raise exception 'UNAUTHORIZED'; end if;
  if payload->>'action'='health' then
    return jsonb_build_object('available',true);
  elsif payload->>'action'='order' then
    if not public.checkout_rate_limit_allowed(payload#>>'{customer,email}',payload#>>'{customer,whatsapp}',
      payload#>>'{customer,tax_id}',(payload->>'client_request_id')::uuid) then raise exception 'RATE_LIMITED'; end if;
    select * into result from public.create_checkout_order_with_kits(payload);
    return to_jsonb(result);
  elsif payload->>'action'='payment_read' then
    target_id:=public.prepare_payment_preference(payload->>'code',(payload->>'public_token')::uuid);
    select * into target_order from public.orders where id=target_id;
    if coalesce((payload->>'test_mode')::boolean,false) then
      expiry:=public.extend_test_payment_reservation(target_id,now()+interval '72 hours');
      select * into target_order from public.orders where id=target_id;
    end if;
    return jsonb_build_object('order',to_jsonb(target_order),'items',
      (select jsonb_agg(to_jsonb(item) order by item.id) from public.order_items item where item.order_id=target_id));
  elsif payload->>'action'='payment_save' then
    target_id:=public.prepare_payment_preference(payload->>'code',(payload->>'public_token')::uuid);
    if payload->>'payment_url' !~ '^https://(sandbox|www)\.mercadopago\.com\.br/' then raise exception 'INVALID_PAYMENT_URL'; end if;
    update public.orders set payment_preference_id=left(payload->>'preference_id',160),
      payment_preference_url=payload->>'payment_url',payment_preference_created_at=now() where id=target_id;
    return jsonb_build_object('saved',true);
  end if;
  raise exception 'INVALID_ACTION';
end; $$;
