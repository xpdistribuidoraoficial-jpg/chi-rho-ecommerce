-- Teste com assinatura real, sem pagamento e com rollback de todos os pedidos/reservas.
begin;
do $$
declare signing_key text; payload jsonb; result jsonb; item jsonb; component jsonb;
  kit public.cpad_kits%rowtype; method text; subtotal numeric; reduction numeric; expected_total numeric;
  order_items jsonb; kit_components jsonb; original_stocks jsonb;
begin
 select secret into signing_key from private.cpad_checkout_keys where name='production';
 if signing_key is null then raise exception 'TEST_SIGNING_NOT_CONFIGURED'; end if;
 select jsonb_object_agg(product_slug,stock_available) into original_stocks from public.inventory;
 for kit in select * from public.cpad_kits where active and discount_percent=0 loop
  foreach method in array array['pix','card'] loop
   begin
    subtotal:=0;reduction:=0;order_items:='[]';kit_components:='[]';
    for component in select value from jsonb_array_elements(kit.components) loop
     select jsonb_build_object('slug',product_slug,'sku',sku,'name',product_name,'category',category,'unit_price',unit_price,'quantity',(component->>'quantity')::integer)
      into item from public.inventory where product_slug=component->>'slug';
     subtotal:=subtotal+(item->>'unit_price')::numeric*(item->>'quantity')::integer;
     if method='pix' and item->>'slug'='comentario-biblico-beacon-antigo-testamento' then
      reduction:=reduction+69.99*(item->>'quantity')::integer;
     end if;
     order_items:=order_items||jsonb_build_array(item);kit_components:=kit_components||jsonb_build_array(item);
    end loop;
    expected_total:=case when kit.slug='kit-cpad-leitura-crescimento' then 74 when method='pix' then 479.90 else 549.89 end;
    payload:=jsonb_build_object('action','order','environment','production','signed_at',extract(epoch from now())*1000,'client_request_id',gen_random_uuid(),'payment_method',method,
     'customer',jsonb_build_object('name','Teste transacional kit promocional','email','kit-promo@example.invalid','whatsapp','21999999999','phone','21999999999','tax_id','52998224725'),
     'address',jsonb_build_object('postal_code','21210250','street','Rua Maria do Carmo','number','202','district','Penha Circular','city','Rio de Janeiro','state','RJ'),
     'shipping',jsonb_build_object('carrier','Retirada','carrier_code','PICKUP_VENDOR','service','Retirada','service_code','PICKUP_VENDOR','price',0,'quoted_at',now()),
     'subtotal',subtotal,'discount',reduction,'items',order_items,'kits',jsonb_build_array(jsonb_build_object('slug',kit.slug,'name',kit.name,'quantity',1,'discount_percent',0,'pricing_mode','sum_current_prices','original_unit_total',subtotal,'unit_total',subtotal,'components',kit_components)));
    result:=private.cpad_signed_action(payload::text,encode(extensions.hmac(payload::text,signing_key,'sha256'),'hex'));
    if (result->>'order_total')::numeric<>expected_total then raise exception 'TEST_KIT_TOTAL_MISMATCH'; end if;
    if (select sum(unit_price*quantity) from public.order_items where order_id=(result->>'order_id')::uuid)-reduction<>expected_total then raise exception 'TEST_RECONCILIATION_FAILED'; end if;
    if not exists(select 1 from public.order_kit_details where order_id=(result->>'order_id')::uuid) then raise exception 'TEST_KIT_SNAPSHOT_MISSING'; end if;
    if (select financial_status from public.orders where id=(result->>'order_id')::uuid)<>'aguardando_pagamento' then raise exception 'TEST_ORDER_MARKED_PAID'; end if;
    raise exception 'KIT_PROMO_CASE_PASSED';
   exception when others then if sqlerrm<>'KIT_PROMO_CASE_PASSED' then raise; end if; end;
  end loop;
 end loop;
 if (select jsonb_object_agg(product_slug,stock_available) from public.inventory)<>original_stocks then raise exception 'TEST_STOCK_NOT_ROLLED_BACK'; end if;
 if (select active from public.cpad_kits where slug='kit-cpad-culto') then raise exception 'TEST_CULTO_ACTIVE'; end if;
end; $$;
rollback;
