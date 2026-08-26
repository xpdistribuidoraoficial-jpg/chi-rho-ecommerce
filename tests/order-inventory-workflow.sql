-- Teste transacional: não persiste pedidos nem altera o estoque real.
begin;

do $test$
declare
  payload jsonb;
  created record;
  repeated record;
  payment record;
  initial_total integer;
  initial_reserved integer;
begin
  select stock_total,stock_reserved into initial_total,initial_reserved
  from public.inventory where product_slug='casa-balanca-digital-cozinha-10kg';

  payload:=jsonb_build_object(
    'client_request_id',gen_random_uuid(),
    'customer',jsonb_build_object('name','Teste Controlado','email','teste@example.invalid','whatsapp','21999999999','whatsapp_marketing_consent',false),
    'address',jsonb_build_object('postal_code','01001000','street','Praça da Sé','number','1','district','Sé','city','São Paulo','state','SP'),
    'shipping',jsonb_build_object('carrier','Teste','service','Interno','delivery_time','0','price',0,'quoted_at',now(),'quote_id','test'),
    'subtotal',29.90,'discount',0,
    'items',jsonb_build_array(jsonb_build_object('slug','casa-balanca-digital-cozinha-10kg','sku','CASA-BALANCA-10KG','name','Balança Digital de Cozinha 10 kg','category','Cozinha','unit_price',29.90,'quantity',1))
  );

  select * into created from public.create_checkout_order_v2(payload);
  select * into repeated from public.create_checkout_order_v2(payload);
  if created.order_id<>repeated.order_id or
     (select stock_reserved from public.inventory where product_slug='casa-balanca-digital-cozinha-10kg')<>initial_reserved+1
  then raise exception 'CREATE_OR_RESERVATION_IDEMPOTENCY_FAILED'; end if;

  select * into payment from public.apply_order_payment_status(created.order_id,'pago','automated-test-event','test-payment-approved','pix','test','approved',true,null);
  if not payment.event_processed or
     (select stock_total from public.inventory where product_slug='casa-balanca-digital-cozinha-10kg')<>initial_total-1
  then raise exception 'PAYMENT_COMMIT_FAILED'; end if;

  select * into payment from public.apply_order_payment_status(created.order_id,'pago','automated-test-event','test-payment-approved','pix','test','approved',true,null);
  if payment.event_processed then raise exception 'PAYMENT_IDEMPOTENCY_FAILED'; end if;

  select * into payment from public.apply_order_payment_status(created.order_id,'aguardando_pagamento',
    'automated-test-late-pending','test-payment-approved','pix','test','pending',true,null);
  if payment.event_processed or payment.financial_status<>'pago' then
    raise exception 'PAYMENT_STATUS_REGRESSION_ALLOWED';
  end if;

  select * into payment from public.apply_order_payment_status(created.order_id,'pago',
    'automated-test-duplicate-approved','test-payment-duplicate','visa (credit_card)','test','approved',true,null);
  if payment.event_processed or
    not exists(select 1 from public.payment_events
      where provider_event_id='automated-test-duplicate-approved'
        and error_code='DUPLICATE_APPROVED_PAYMENT') then
    raise exception 'DUPLICATE_APPROVED_PAYMENT_NOT_BLOCKED';
  end if;

end
$test$;

-- Disputa interna determinística pela última unidade. A função usa FOR UPDATE;
-- este cenário prova que o segundo pedido não ultrapassa a reserva já feita.
do $last_unit_test$
declare
  first_payload jsonb;
  second_payload jsonb;
  first_order record;
  second_rejected boolean:=false;
  payment record;
begin
  if exists(
    select 1 from public.inventory_reservations
    where product_slug='casa-bomba-eletrica-garrafa-agua'
      and status='reservado' and expires_at>now()
  ) then raise exception 'LAST_UNIT_TEST_REQUIRES_NO_ACTIVE_RESERVATION'; end if;

  update public.inventory set stock_total=1,stock_reserved=0
  where product_slug='casa-bomba-eletrica-garrafa-agua';

  first_payload:=jsonb_build_object(
    'client_request_id',gen_random_uuid(),
    'customer',jsonb_build_object('name','Teste Última Unidade','email','ultima-unidade-1@example.invalid','whatsapp','21999999999','whatsapp_marketing_consent',false),
    'address',jsonb_build_object('postal_code','01001000','street','Praça da Sé','number','1','district','Sé','city','São Paulo','state','SP'),
    'shipping',jsonb_build_object('carrier','Teste','service','Interno','delivery_time','0','price',0,'quoted_at',now(),'quote_id','last-unit-test'),
    'subtotal',32.90,'discount',0,
    'items',jsonb_build_array(jsonb_build_object('slug','casa-bomba-eletrica-garrafa-agua','sku','CASA-BOMBA-AGUA-USB','name','Bomba Elétrica USB para Garrafão de Água','category','Utilidades Domésticas','unit_price',32.90,'quantity',1))
  );
  second_payload:=jsonb_set(jsonb_set(first_payload,'{client_request_id}',to_jsonb(gen_random_uuid())),
    '{customer,email}',to_jsonb('ultima-unidade-2@example.invalid'::text));

  select * into first_order from public.create_checkout_order_v2(first_payload);
  begin
    perform public.create_checkout_order_v2(second_payload);
  exception when others then
    if sqlerrm not like '%OUT_OF_STOCK%' then raise; end if;
    second_rejected:=true;
  end;

  if not second_rejected or
    (select stock_reserved from public.inventory where product_slug='casa-bomba-eletrica-garrafa-agua')<>1
  then raise exception 'LAST_UNIT_OVERSOLD'; end if;

  select * into payment from public.apply_order_payment_status(first_order.order_id,'cancelado',
    'internal-last-unit-cancel',null,null,'internal.inventory',null,true,'teste interno');
  if not payment.event_processed or
    (select stock_reserved from public.inventory where product_slug='casa-bomba-eletrica-garrafa-agua')<>0
  then raise exception 'LAST_UNIT_RELEASE_FAILED'; end if;
end
$last_unit_test$;

-- Expiração interna: a reserva vencida deve ser liberada e o pedido cancelado.
do $expiration_test$
declare
  payload jsonb;
  created record;
  expired_count integer;
begin
  payload:=jsonb_build_object(
    'client_request_id',gen_random_uuid(),
    'customer',jsonb_build_object('name','Teste Expiração','email','expiracao@example.invalid','whatsapp','21999999999','whatsapp_marketing_consent',false),
    'address',jsonb_build_object('postal_code','01001000','street','Praça da Sé','number','1','district','Sé','city','São Paulo','state','SP'),
    'shipping',jsonb_build_object('carrier','Teste','service','Interno','delivery_time','0','price',0,'quoted_at',now(),'quote_id','expiration-test'),
    'subtotal',32.90,'discount',0,
    'items',jsonb_build_array(jsonb_build_object('slug','casa-bomba-eletrica-garrafa-agua','sku','CASA-BOMBA-AGUA-USB','name','Bomba Elétrica USB para Garrafão de Água','category','Utilidades Domésticas','unit_price',32.90,'quantity',1))
  );

  select * into created from public.create_checkout_order_v2(payload);
  update public.inventory_reservations set expires_at=now()-interval '1 second'
    where order_id=created.order_id and status='reservado';
  update public.orders set reservation_expires_at=now()-interval '1 second'
    where id=created.order_id;
  expired_count:=public.expire_inventory_reservations(200);

  if expired_count<1 or
    not exists(select 1 from public.inventory_reservations where order_id=created.order_id and status='expirado') or
    not exists(select 1 from public.orders where id=created.order_id and financial_status='cancelado' and operational_status='cancelado') or
    (select stock_reserved from public.inventory where product_slug='casa-bomba-eletrica-garrafa-agua')<>0
  then raise exception 'RESERVATION_EXPIRATION_FAILED'; end if;
end
$expiration_test$;

rollback;
