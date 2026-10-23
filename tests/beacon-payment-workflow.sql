-- Teste transacional: nenhum pedido, reserva ou pagamento é mantido.
begin;
do $$
declare signing_key text; payload jsonb; response jsonb; second_response jsonb; readback jsonb;
  target_id uuid; method text; slug text; price numeric; discount_value numeric; before_stock integer;
  pay_payload jsonb;
begin
  select secret into signing_key from private.cpad_checkout_keys where name='production';
  if signing_key is null then raise exception 'TEST_SIGNING_NOT_CONFIGURED'; end if;
  begin
    perform private.cpad_signed_action('{"action":"health","environment":"production"}',repeat('0',64));
    raise exception 'TEST_AUTH_ACCEPTED_INVALID_SIGNATURE';
  exception when others then if sqlerrm<>'UNAUTHORIZED' then raise; end if; end;
  foreach slug in array array['comentario-biblico-beacon-antigo-testamento','comentario-biblico-beacon-novo-testamento'] loop
    foreach method in array array['pix','card'] loop
      begin
      select stock_available into before_stock from public.inventory where product_slug=slug;
      price:=case when method='card' then 349.99 when slug like '%antigo%' then 303.18 else 330.00 end;
      discount_value:=349.99-price;
      payload:=jsonb_build_object('action','order','environment','production','signed_at',extract(epoch from now())*1000,
        'client_request_id',gen_random_uuid(),'payment_method',method,
        'customer',jsonb_build_object('name','Teste transacional Beacon','email','beacon-transaction@example.invalid','whatsapp','21999999999','phone','21999999999','tax_id','52998224725'),
        'address',jsonb_build_object('postal_code','21210250','street','Rua Maria do Carmo','number','202','district','Penha Circular','city','Rio de Janeiro','state','RJ'),
        'shipping',jsonb_build_object('carrier','Retirada','carrier_code','PICKUP_VENDOR','service','Retirada','service_code','PICKUP_VENDOR','price',0,'quoted_at',now()),
        'subtotal',349.99,'discount',discount_value,'kits','[]'::jsonb,'items',jsonb_build_array(jsonb_build_object('slug',slug,'sku',slug,'name','Beacon','category','Livros Cristãos','unit_price',349.99,'quantity',1)));
      response:=private.cpad_signed_action(payload::text,encode(extensions.hmac(payload::text,signing_key,'sha256'),'hex'));
      target_id:=(response->>'order_id')::uuid;
      if (response->>'order_total')::numeric<>price then raise exception 'TEST_TOTAL_MISMATCH'; end if;
      if (select payment_method from public.orders where id=target_id)<>method then raise exception 'TEST_METHOD_MISSING'; end if;
      if method='pix' and (select reservation_expires_at from public.orders where id=target_id)<now()+interval '44 minutes' then raise exception 'TEST_PIX_RESERVATION_TOO_SHORT'; end if;
      if exists(select 1 from public.inventory_reservations r join public.orders o on o.id=r.order_id where o.id=target_id and r.expires_at<>o.reservation_expires_at) then raise exception 'TEST_RESERVATION_MISMATCH'; end if;
      second_response:=private.cpad_signed_action(payload::text,encode(extensions.hmac(payload::text,signing_key,'sha256'),'hex'));
      if second_response->>'order_id'<>response->>'order_id' then raise exception 'TEST_DUPLICATE_ORDER'; end if;
      if (select stock_available from public.inventory where product_slug=slug)<>before_stock-1 then raise exception 'TEST_STOCK_MISMATCH'; end if;
      begin
        pay_payload:=payload||jsonb_build_object('payment_method',case when method='pix' then 'card' else 'pix' end);
        perform private.cpad_signed_action(pay_payload::text,encode(extensions.hmac(pay_payload::text,signing_key,'sha256'),'hex'));
        raise exception 'TEST_ALLOWED_METHOD_CHANGE';
      exception when others then if sqlerrm<>'ORDER_PAYMENT_MISMATCH' then raise; end if; end;
      pay_payload:=jsonb_build_object('action','payment_read','environment','production','signed_at',extract(epoch from now())*1000,
        'code',response->>'order_code','public_token',response->>'order_public_token','test_mode',false);
      readback:=private.cpad_signed_action(pay_payload::text,encode(extensions.hmac(pay_payload::text,signing_key,'sha256'),'hex'));
      if (readback#>>'{order,grand_total}')::numeric<>price then raise exception 'TEST_PAYMENT_READ_MISMATCH'; end if;
      if method='pix' then
        pay_payload:=pay_payload||jsonb_build_object('action','payment_save','payment_id','123456789','payment_url','https://www.mercadopago.com.br/payments/123456789/ticket?hash=transactional-fixture');
      else
        pay_payload:=pay_payload||jsonb_build_object('action','payment_save','preference_id','transactional-fixture','payment_url','https://www.mercadopago.com.br/checkout/transactional-fixture');
      end if;
      perform private.cpad_signed_action(pay_payload::text,encode(extensions.hmac(pay_payload::text,signing_key,'sha256'),'hex'));
      if (select financial_status from public.orders where id=target_id)<>'aguardando_pagamento' then raise exception 'TEST_ORDER_MARKED_PAID'; end if;
      raise exception 'BEACON_CASE_PASSED';
      exception when others then if sqlerrm<>'BEACON_CASE_PASSED' then raise; end if; end;
    end loop;
  end loop;
end; $$;
rollback;
