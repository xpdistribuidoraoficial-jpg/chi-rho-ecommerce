begin;

do $$
declare
  v_admin uuid:=gen_random_uuid();
  v_session uuid:=gen_random_uuid();
  v_request uuid:=gen_random_uuid();
  v_order uuid;
  v_order_code text;
  v_public_token uuid;
  v_label_claim uuid;
  v_duplicate_blocked boolean:=false;
  v_blocked boolean;
  v_invoice jsonb:='{"key":"33260142300391000100550010000001231123456786","number":"123","series":"1","issuedAt":"2026-01-01T12:00:00-03:00","value":44.9,"freight":15,"issuerDocument":"42300391000100","recipientDocument":"52998224725","protocol":"123456789012345","statusCode":"100","source":"contador","environment":"production","xmlPath":"PLACEHOLDER"}';
  v_path text;
  v_parcel jsonb:='{"weightKg":1.2,"lengthCm":25,"widthCm":20,"heightCm":10}';
begin
  update public.inventory set stock_total=greatest(stock_total,stock_reserved+50),unit_price=29.90,weight_kg=0.5,length_cm=20,width_cm=15,height_cm=5,category='Cozinha' where product_slug='casa-balanca-digital-cozinha-10kg';
  insert into auth.users(id,email,created_at,updated_at,is_sso_user,is_anonymous)
    values(v_admin,'admin-test@invalid.local',now(),now(),false,false);
  insert into auth.sessions(id,user_id,created_at,updated_at)
    values(v_session,v_admin,now(),now());
  insert into public.admin_users(user_id,display_name) values(v_admin,'Teste automatizado');
  if not exists(select 1 from public.authorize_admin_session(v_admin,v_session)) then
    raise exception 'TEST_ADMIN_SESSION_NOT_AUTHORIZED';
  end if;

  select order_id,order_code,order_public_token into v_order,v_order_code,v_public_token
  from public.create_checkout_order_v2(jsonb_build_object(
    'client_request_id',v_request,
    'customer',jsonb_build_object('name','Cliente Teste','email','cliente@invalid.local','whatsapp','21999999999','phone','21999999999','tax_id','52998224725'),
    'address',jsonb_build_object('postal_code','21870350','street','Rua de Teste','number','100','district','Centro','city','Rio de Janeiro','state','RJ'),
    'shipping',jsonb_build_object('carrier','Correios','carrier_code','COR','service','PAC','service_code','03298','delivery_time','5','price',15.00,'quoted_at',now()),
    'subtotal',29.90,'discount',0,
    'items',jsonb_build_array(jsonb_build_object('slug','casa-balanca-digital-cozinha-10kg','sku','CASA-BALANCA-10KG','name','Balança Digital de Cozinha 10 kg','category','Cozinha','unit_price',29.90,'quantity',1))
  ));
  if public.prepare_payment_preference(v_order_code,v_public_token)<>v_order then
    raise exception 'TEST_PAYMENT_PREPARATION_FAILED';
  end if;
  perform public.apply_order_payment_status(v_order,'pago','test:approved:'||v_order::text,'test-payment','pix','test.payment','approved',false,'teste interno');
  perform public.update_order_operation(v_order,'em_separacao',v_admin,null,null,'teste interno');
  v_blocked:=false;
  begin
    perform public.prepare_order_shipping(v_order,v_admin,v_parcel||'{"weightKg":0}'::jsonb,'teste interno');
  exception when others then v_blocked:=position('SHIPPING_PACKAGE_REQUIRED' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_INVALID_PACKAGE_NOT_BLOCKED'; end if;
  perform public.prepare_order_shipping(v_order,v_admin,v_parcel,'teste interno');
  if not exists(select 1 from public.orders where id=v_order and shipping_package=v_parcel and operational_status='pronto_para_envio')
    then raise exception 'TEST_PACKAGE_NOT_SAVED'; end if;
  update public.orders set financial_status='aguardando_pagamento' where id=v_order;
  v_blocked:=false;
  begin perform public.claim_shipping_label(v_order,v_admin);
  exception when others then v_blocked:=position('ORDER_NOT_PAID' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_UNPAID_NOT_BLOCKED'; end if;
  update public.orders set financial_status='pago',shipping_carrier_code='PICKUP_VENDOR' where id=v_order;
  v_blocked:=false;
  begin perform public.claim_shipping_label(v_order,v_admin);
  exception when others then v_blocked:=position('PICKUP_ORDER' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_PICKUP_NOT_BLOCKED'; end if;
  update public.orders set shipping_carrier_code='COR' where id=v_order;

  v_blocked:=false;
  begin perform public.claim_shipping_label(v_order,v_admin);
  exception when others then v_blocked:=position('INVOICE_REQUIRED' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_INVOICE_REQUIRED'; end if;
  v_path:=v_order::text||'/'||gen_random_uuid()::text||'.xml';
  insert into storage.objects(bucket_id,name) values('order-invoices',v_path);
  v_invoice:=jsonb_set(v_invoice,'{xmlPath}',to_jsonb(v_path));
  v_blocked:=false;
  begin perform public.record_order_invoice(v_order,v_admin,v_invoice||'{"value":1}'::jsonb);
  exception when others then v_blocked:=position('INVOICE_INVALID' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_INVOICE_TOTAL_NOT_CHECKED'; end if;
  perform public.record_order_invoice(v_order,v_admin,v_invoice);
  v_blocked:=false;
  begin perform public.record_order_invoice(v_order,v_admin,v_invoice);
  exception when others then v_blocked:=position('INVOICE_ALREADY_REGISTERED' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_INVOICE_REPLACED'; end if;
  if has_function_privilege('anon','public.record_order_invoice(uuid,uuid,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','public.record_order_invoice(uuid,uuid,jsonb)','EXECUTE')
    or exists(select 1 from storage.buckets where id='order-invoices' and public) then raise exception 'TEST_INVOICE_PUBLIC_ACCESS'; end if;
  v_label_claim:=public.claim_shipping_label(v_order,v_admin);
  perform public.fail_shipping_label(v_order,v_label_claim,v_admin,'LABEL_RECONCILIATION_REQUIRED');
  v_blocked:=false;
  begin perform public.claim_shipping_label(v_order,v_admin);
  exception when others then v_blocked:=position('LABEL_IN_PROGRESS' in sqlerrm)>0; end;
  if not v_blocked then raise exception 'TEST_UNCERTAIN_LABEL_RETRIED'; end if;
  if not exists(select 1 from public.orders where id=v_order and label_request_key=v_label_claim and label_status='gerando')
    then raise exception 'TEST_UNCERTAIN_LOCK_LOST'; end if;
  perform public.complete_shipping_label(v_order,v_label_claim,v_admin,'frenet','test-shipment','https://example.invalid/label.pdf',
    'https://example.invalid/declaration.pdf','https://example.invalid/track/AA123456789BR','AA123456789BR',now()+interval '7 days');
  begin
    perform public.claim_shipping_label(v_order,v_admin);
  exception when others then
    v_duplicate_blocked:=position('LABEL_ALREADY_GENERATED' in sqlerrm)>0;
  end;
  if not v_duplicate_blocked then raise exception 'TEST_DUPLICATE_LABEL_NOT_BLOCKED'; end if;
  perform public.update_order_operation(v_order,'enviado',v_admin,null,null,'teste interno');
  perform public.update_order_operation(v_order,'entregue',v_admin,null,null,'teste interno');
  if not exists(select 1 from public.orders where id=v_order and operational_status='entregue' and label_status='gerada') then
    raise exception 'TEST_FULFILLMENT_FLOW_FAILED';
  end if;
  raise notice 'AUTO_LABEL_DB_TESTS_PASSED';
end $$;

rollback;
