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
begin
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
  perform public.update_order_operation(v_order,'pronto_para_envio',v_admin,null,null,'teste interno');
  v_label_claim:=public.claim_shipping_label(v_order,v_admin);
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
end $$;

rollback;
