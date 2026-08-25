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

  select * into payment from public.apply_order_payment_status(created.order_id,'pago','automated-test-event',null,'pix','test','approved',true,null);
  if not payment.event_processed or
     (select stock_total from public.inventory where product_slug='casa-balanca-digital-cozinha-10kg')<>initial_total-1
  then raise exception 'PAYMENT_COMMIT_FAILED'; end if;

  select * into payment from public.apply_order_payment_status(created.order_id,'pago','automated-test-event',null,'pix','test','approved',true,null);
  if payment.event_processed then raise exception 'PAYMENT_IDEMPOTENCY_FAILED'; end if;

  perform public.update_order_operation(created.order_id,'em_separacao',null,null,null,'teste');
  perform public.update_order_operation(created.order_id,'pronto_para_envio',null,null,null,'teste');
end
$test$;

rollback;
