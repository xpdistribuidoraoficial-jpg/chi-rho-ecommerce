-- Registra a forma escolhida somente no fluxo com assinatura HMAC.
-- Nenhuma chave, permissão pública ou regra de estoque é removida.
create or replace function private.cpad_signed_action(payload_text text, signature text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare key text; key_environment text; payload jsonb; result record; target_id uuid;
  target_order public.orders%rowtype; expiry timestamptz; selected_method text;
begin
  if payload_text is null or signature is null or length(payload_text)>50000 or signature !~ '^[0-9a-f]{64}$'
    then raise exception 'UNAUTHORIZED'; end if;
  payload:=payload_text::jsonb;
  if payload->>'environment' is null or payload->>'environment' not in ('production','preview')
    then raise exception 'UNAUTHORIZED'; end if;
  select secret,name into key,key_environment from private.cpad_checkout_keys
    where name=payload->>'environment' and extensions.hmac(payload_text,secret,'sha256')=decode(signature,'hex')
    order by case when name='production' then 0 else 1 end limit 1;
  if key is null then raise exception 'UNAUTHORIZED'; end if;
  if payload->>'signed_at' is null or abs(extract(epoch from now())*1000-(payload->>'signed_at')::numeric)>90000
    then raise exception 'UNAUTHORIZED'; end if;
  if payload->>'action'='health' then
    return jsonb_build_object('available',true,'environment',key_environment);
  elsif payload->>'action'='order' then
    if payload ? 'payment_method' and coalesce(payload->>'payment_method','') not in ('pix','card')
      then raise exception 'INVALID_PAYMENT_METHOD'; end if;
    if not public.checkout_rate_limit_allowed(payload#>>'{customer,email}',payload#>>'{customer,whatsapp}',
      payload#>>'{customer,tax_id}',(payload->>'client_request_id')::uuid) then raise exception 'RATE_LIMITED'; end if;
    select * into result from public.create_checkout_order_with_kits(payload);
    if payload ? 'payment_method' then
      selected_method:=payload->>'payment_method';
      select * into target_order from public.orders where id=result.order_id for update;
      if target_order.subtotal<>(payload->>'subtotal')::numeric
        or target_order.discount<>(payload->>'discount')::numeric
        or (target_order.payment_method is not null and target_order.payment_method<>selected_method)
        then raise exception 'ORDER_PAYMENT_MISMATCH'; end if;
      -- Pix exige ao menos 30 minutos de validade no provedor. A extensão é feita uma vez.
      if target_order.payment_method is null then
        expiry:=case when selected_method='pix' then now()+interval '45 minutes' else target_order.reservation_expires_at end;
        update public.orders set payment_method=selected_method,reservation_expires_at=expiry where id=result.order_id;
        update public.inventory_reservations set expires_at=expiry where order_id=result.order_id and status='reservado';
      end if;
    end if;
    return to_jsonb(result) || case when selected_method is not null then
      jsonb_build_object('order_reservation_expires_at',(select reservation_expires_at from public.orders where id=result.order_id))
      else '{}'::jsonb end;
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
    select * into target_order from public.orders where id=target_id for update;
    if payload->>'payment_url' !~ '^https://(sandbox|www)\.mercadopago\.com\.br/'
      then raise exception 'INVALID_PAYMENT_URL'; end if;
    if target_order.payment_method='pix' then
      if coalesce(payload->>'payment_id','') !~ '^[0-9]+$'
        or payload->>'payment_url' !~ ('^https://www\.mercadopago\.com\.br/(sandbox/)?payments/'||(payload->>'payment_id')||'/ticket(\?|$)')
        or (target_order.payment_external_id is not null and target_order.payment_external_id<>payload->>'payment_id')
        then raise exception 'INVALID_PIX_PAYMENT'; end if;
      update public.orders set payment_external_id=payload->>'payment_id',
        payment_preference_url=payload->>'payment_url',payment_preference_created_at=now() where id=target_id;
    else
      if nullif(payload->>'preference_id','') is null then raise exception 'INVALID_PREFERENCE'; end if;
      update public.orders set payment_preference_id=left(payload->>'preference_id',160),
        payment_preference_url=payload->>'payment_url',payment_preference_created_at=now() where id=target_id;
    end if;
    return jsonb_build_object('saved',true);
  end if;
  raise exception 'INVALID_ACTION';
end; $$;

-- Preço padrão do avulso no cartão; Pix é desconto financeiro exclusivo do pagamento Pix.
-- Não altera estoque, reservas existentes nem preços cheios dos kits.
update public.inventory set unit_price=349.99
where product_slug in ('comentario-biblico-beacon-antigo-testamento','comentario-biblico-beacon-novo-testamento');
