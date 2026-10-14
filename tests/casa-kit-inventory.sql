-- Teste transacional: não persiste pedidos, reservas nem eventos financeiros.
begin;
do $test$
declare
  payload jsonb;
  created record;
  repeated record;
  charger_reserved integer;
  fone_reserved integer;
begin
  select stock_reserved into charger_reserved from public.inventory where product_slug='casa-carregador-kapbom-ka-5005';
  select stock_reserved into fone_reserved from public.inventory where product_slug='casa-fone-bluetooth-visor-bateria';
  payload:=jsonb_build_object(
    'client_request_id',gen_random_uuid(),
    'customer',jsonb_build_object('name','Teste Transacional Kit Casa','email','kit-casa@example.invalid','whatsapp','21999999999'),
    'address',jsonb_build_object('postal_code','25525660','street','Rua Bento Siqueira','number','668','district','Retirada CHI RHO','city','São João de Meriti','state','RJ'),
    'shipping',jsonb_build_object('carrier','Retirada','carrier_code','PICKUP_VENDOR','service','Retirada','price',0,'quoted_at',now()),
    'subtotal',38.98,'discount',2,
    'items',jsonb_build_array(
      jsonb_build_object('slug','casa-fone-bluetooth-visor-bateria','sku','CASA-FONE-BT-VISOR-PRETO','name','Fone Bluetooth — Kit Casa','category','Utilidades Domésticas','unit_price',23.99,'quantity',1),
      jsonb_build_object('slug','casa-carregador-kapbom-ka-5005','sku','KA-5005','name','Carregador USB-C — Kit Casa','category','Utilidades Domésticas','unit_price',14.99,'quantity',1)),
    'kits',jsonb_build_array(jsonb_build_object('slug','kit-casa-fone-carregador','name','Kit Fone Bluetooth + Carregador USB-C','quantity',1,
      'discount_percent',0,'discount_amount',2,'pricing_mode','sum_current_prices','original_unit_total',38.98,'unit_total',36.98,
      'components',jsonb_build_array(jsonb_build_object('slug','casa-fone-bluetooth-visor-bateria','quantity',1),jsonb_build_object('slug','casa-carregador-kapbom-ka-5005','quantity',1))))
  );
  select * into created from public.create_checkout_order_with_kits(payload);
  select * into repeated from public.create_checkout_order_with_kits(payload);
  if created.order_total<>36.98 or repeated.order_id<>created.order_id then raise exception 'CASA_KIT_TOTAL_OR_IDEMPOTENCY_FAILED'; end if;
  if (select sum(line_total) from public.order_items where order_id=created.order_id)<>38.98
    or (select discount from public.orders where id=created.order_id)<>2
    or (select count(*) from public.inventory_reservations where order_id=created.order_id and status='reservado')<>2
    or (select stock_reserved from public.inventory where product_slug='casa-carregador-kapbom-ka-5005')<>charger_reserved+1
    or (select stock_reserved from public.inventory where product_slug='casa-fone-bluetooth-visor-bateria')<>fone_reserved+1
    or not exists(select 1 from public.order_kit_details where order_id=created.order_id and kits#>>'{0,discount_amount}'='2')
    then raise exception 'CASA_KIT_COMPONENT_ACCOUNTING_FAILED'; end if;
end
$test$;
rollback;
select 'PASS: total 36.98, desconto 2.00, dois componentes, reserva e idempotência; tudo revertido' as verification;
