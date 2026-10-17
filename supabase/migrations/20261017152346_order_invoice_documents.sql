-- Accountant-issued NF-e only. No SEFAZ issuance or public document access.
alter table public.orders add column if not exists fiscal_invoice jsonb;
create unique index if not exists orders_fiscal_invoice_key_unique on public.orders ((fiscal_invoice->>'key')) where fiscal_invoice is not null;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('order-invoices','order-invoices',false,5242880,array['application/xml','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.valid_order_invoice_key(value text)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare v_sum integer:=0; v_weight integer:=2; v_check integer; i integer;
begin
  if value is null or value !~ '^[0-9]{44}$' or substring(value,21,2)<>'55' then return false; end if;
  for i in reverse 43..1 loop
    v_sum:=v_sum+substring(value,i,1)::integer*v_weight;
    v_weight:=case when v_weight=9 then 2 else v_weight+1 end;
  end loop;
  v_check:=case when v_sum%11 in (0,1) then 0 else 11-v_sum%11 end;
  return right(value,1)::integer=v_check;
end $$;

create or replace function public.order_invoice_matches(invoice jsonb,document text,total numeric,freight numeric)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
begin
  return coalesce(jsonb_typeof(invoice)='object'
    and public.valid_order_invoice_key(invoice->>'key')
    and invoice->>'environment'='production' and invoice->>'source'='contador'
    and invoice->>'issuerDocument'='42300391000100'
    and substring(invoice->>'key',7,14)=invoice->>'issuerDocument'
    and (invoice->>'number')::numeric=substring(invoice->>'key',26,9)::numeric
    and (invoice->>'series')::numeric=substring(invoice->>'key',23,3)::numeric
    and invoice->>'recipientDocument'=regexp_replace(document,'[^0-9]','','g')
    and (invoice->>'value')::numeric=total and (invoice->>'freight')::numeric=freight
    and invoice->>'protocol' ~ '^[0-9]{15}$' and invoice->>'statusCode' in ('100','150'),false);
exception when others then return false;
end $$;

create or replace function public.record_order_invoice(target_order_id uuid,actor_user_id uuid,invoice_details jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype; v_path text;
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true) then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.financial_status<>'pago' or v_order.cancelled_at is not null or v_order.operational_status='cancelado' then raise exception 'ORDER_NOT_PAID'; end if;
  if v_order.fiscal_invoice is not null then raise exception 'INVOICE_ALREADY_REGISTERED'; end if;
  if v_order.label_status in ('gerando','gerada') or v_order.label_request_key is not null or v_order.shipping_label_id is not null then raise exception 'LABEL_IN_PROGRESS'; end if;
  if not public.order_invoice_matches(invoice_details,v_order.tax_id,v_order.grand_total,v_order.shipping_price)
    or (invoice_details->>'issuedAt')::timestamptz > now()+interval '5 minutes' or invoice_details->>'issuedAt' is null then raise exception 'INVOICE_INVALID'; end if;
  foreach v_path in array array[invoice_details->>'xmlPath',invoice_details->>'danfePath'] loop
    if v_path is not null and (v_path !~ ('^'||target_order_id::text||'/[0-9a-f-]{36}\.(xml|pdf)$') or not exists(
      select 1 from storage.objects where bucket_id='order-invoices' and name=v_path)) then raise exception 'INVOICE_DOCUMENT_INVALID'; end if;
  end loop;
  if invoice_details->>'xmlPath' is null or right(invoice_details->>'xmlPath',4)<>'.xml'
    or (invoice_details->>'danfePath' is not null and right(invoice_details->>'danfePath',4)<>'.pdf') then raise exception 'INVOICE_DOCUMENT_INVALID'; end if;
  update public.orders set fiscal_invoice=invoice_details where id=target_order_id;
  insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,target_order_id,'nota_fiscal:registrada','NF-e do contador vinculada; XML privado.');
exception when unique_violation then raise exception 'INVOICE_ALREADY_REGISTERED';
end $$;

revoke all on function public.valid_order_invoice_key(text),public.order_invoice_matches(jsonb,text,numeric,numeric),public.record_order_invoice(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.valid_order_invoice_key(text),public.order_invoice_matches(jsonb,text,numeric,numeric),public.record_order_invoice(uuid,uuid,jsonb) to service_role;

create or replace function public.claim_shipping_label(target_order_id uuid,actor_user_id uuid)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_order public.orders%rowtype; v_request_key uuid:=gen_random_uuid();
begin
  if not exists(select 1 from public.admin_users where user_id=actor_user_id and active=true)
    then raise exception 'ADMIN_NOT_AUTHORIZED'; end if;
  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.financial_status<>'pago' then raise exception 'ORDER_NOT_PAID'; end if;
  if v_order.operational_status<>'pronto_para_envio' then raise exception 'ORDER_NOT_READY'; end if;
  if v_order.shipping_carrier_code='PICKUP_VENDOR' then raise exception 'PICKUP_ORDER'; end if;
  if v_order.shipping_package is null then raise exception 'SHIPPING_PACKAGE_REQUIRED'; end if;
  if not public.order_invoice_matches(v_order.fiscal_invoice,v_order.tax_id,v_order.grand_total,v_order.shipping_price) then raise exception 'INVOICE_REQUIRED'; end if;
  if v_order.cancelled_at is not null then raise exception 'ORDER_CANCELLED'; end if;
  if coalesce(v_order.postal_code,'')='' or coalesce(v_order.street,'')='' or
    coalesce(v_order.address_number,'')='' or coalesce(v_order.district,'')='' or
    coalesce(v_order.city,'')='' or coalesce(v_order.state,'')='' then
    raise exception 'ADDRESS_INCOMPLETE';
  end if;
  if coalesce(v_order.shipping_carrier,'')='' or coalesce(v_order.shipping_service,'')='' or
    coalesce(v_order.shipping_service_code,'')='' or v_order.shipping_price is null then
    raise exception 'SHIPPING_INCOMPLETE';
  end if;
  if v_order.label_status='gerada' or v_order.shipping_label_id is not null then
    raise exception 'LABEL_ALREADY_GENERATED';
  end if;
  if v_order.label_status='gerando' or v_order.label_request_key is not null then
    raise exception 'LABEL_IN_PROGRESS';
  end if;
  if not exists(select 1 from public.order_items where order_id=v_order.id) then
    raise exception 'ITEMS_MISSING';
  end if;
  if exists(
    select 1 from public.order_items item
    left join public.inventory inventory on inventory.product_slug=item.product_slug
    where item.order_id=v_order.id and (
      inventory.product_slug is null or inventory.unit_price is null or
      inventory.weight_kg is null or inventory.length_cm is null or
      inventory.height_cm is null or inventory.width_cm is null or
      inventory.category is null or item.quantity<1 or item.unit_price<0 or item.line_total<>round(item.unit_price*item.quantity,2)
    )
  ) then raise exception 'PRODUCT_SHIPPING_DATA_INCOMPLETE'; end if;
  if v_order.subtotal<>(select coalesce(sum(line_total),0) from public.order_items where order_id=v_order.id)
    or v_order.grand_total<>round(v_order.subtotal-v_order.discount+v_order.shipping_price,2)
    then raise exception 'ORDER_TOTAL_MISMATCH'; end if;
  if exists(
    select 1 from public.order_items item
    where item.order_id=v_order.id and not exists(
      select 1 from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.product_slug=item.product_slug
        and reservation.status='confirmado' and reservation.quantity=item.quantity
    )
  ) then raise exception 'STOCK_NOT_COMMITTED'; end if;
  update public.orders set label_status='gerando',label_request_key=v_request_key,
    label_last_error=null where id=v_order.id;
  insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,v_order.id,'etiqueta:solicitada','Frenet OneClick');
  return v_request_key;
end;
$$;

