-- Mantém o estado financeiro monotônico e a baixa de estoque idempotente.
create or replace function public.apply_order_payment_status(
  target_order_id uuid,new_financial_status text,provider_event_key text,
  external_payment_id text default null,payment_method_name text default null,
  event_type_name text default 'payment.updated',raw_provider_status text default null,
  event_signature_valid boolean default false,event_reason text default null)
returns table(order_id uuid,order_code text,financial_status text,operational_status text,event_processed boolean)
language plpgsql security invoker set search_path='' as $$
declare v_order public.orders%rowtype; v_event bigint; v_external_payment_id text:=$4;
begin
  if new_financial_status not in ('aguardando_pagamento','pago','recusado','cancelado','reembolsado')
    then raise exception 'INVALID_PAYMENT_STATUS'; end if;

  insert into public.payment_events(provider_event_id,order_id,external_payment_id,event_type,
    raw_status,mapped_status,signature_valid)
  values(provider_event_key,target_order_id,v_external_payment_id,event_type_name,
    raw_provider_status,new_financial_status,event_signature_valid)
  on conflict(provider_event_id) do nothing returning id into v_event;

  select * into v_order from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_event is null then
    return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,false;
    return;
  end if;

  if v_order.financial_status=new_financial_status then
    update public.payment_events set
      processed=case when new_financial_status<>'pago'
        or v_order.payment_external_id is null
        or v_order.payment_external_id=v_external_payment_id then true else false end,
      processed_at=now(),
      error_code=case when new_financial_status='pago'
        and v_order.payment_external_id is not null
        and v_order.payment_external_id<>v_external_payment_id
        then 'DUPLICATE_APPROVED_PAYMENT' end
    where id=v_event;
    return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,false;
    return;
  end if;

  if (v_order.financial_status='pago' and new_financial_status<>'reembolsado')
    or v_order.financial_status='reembolsado'
    or (v_order.financial_status in ('recusado','cancelado'))
    or (new_financial_status='reembolsado' and v_order.financial_status<>'pago') then
    update public.payment_events set error_code='INVALID_PAYMENT_TRANSITION',processed_at=now() where id=v_event;
    return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,false;
    return;
  end if;

  if new_financial_status='pago' then
    if not exists(select 1 from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado') then
      update public.payment_events set error_code='RESERVATION_NOT_ACTIVE',processed_at=now() where id=v_event;
      raise exception 'RESERVATION_NOT_ACTIVE';
    end if;

    perform 1 from public.inventory inventory
    where inventory.product_slug in (
      select reservation.product_slug from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado'
    ) order by inventory.product_slug for update;

    update public.inventory inventory set
      stock_total=inventory.stock_total-reserved.quantity,
      stock_reserved=inventory.stock_reserved-reserved.quantity
    from (
      select reservation.product_slug,sum(reservation.quantity)::integer quantity
      from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado'
      group by reservation.product_slug
    ) reserved
    where inventory.product_slug=reserved.product_slug;

    update public.inventory_reservations reservation set status='confirmado',committed_at=now()
    where reservation.order_id=v_order.id and reservation.status='reservado';
  elsif new_financial_status in ('recusado','cancelado') then
    perform 1 from public.inventory inventory
    where inventory.product_slug in (
      select reservation.product_slug from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado'
    ) order by inventory.product_slug for update;

    update public.inventory inventory set stock_reserved=inventory.stock_reserved-reserved.quantity
    from (
      select reservation.product_slug,sum(reservation.quantity)::integer quantity
      from public.inventory_reservations reservation
      where reservation.order_id=v_order.id and reservation.status='reservado'
      group by reservation.product_slug
    ) reserved
    where inventory.product_slug=reserved.product_slug;

    update public.inventory_reservations reservation set status='liberado',released_at=now(),
      release_reason=coalesce(event_reason,new_financial_status)
    where reservation.order_id=v_order.id and reservation.status='reservado';
  end if;

  update public.orders as target set
    financial_status=new_financial_status,
    payment_external_id=coalesce(v_external_payment_id,target.payment_external_id),
    payment_reference=coalesce(v_external_payment_id,target.payment_reference),
    payment_method=coalesce(payment_method_name,target.payment_method),
    operational_status=case when new_financial_status in ('recusado','cancelado') then 'cancelado' else target.operational_status end,
    cancelled_at=case when new_financial_status in ('recusado','cancelado') then coalesce(target.cancelled_at,now()) else target.cancelled_at end,
    cancellation_reason=case when new_financial_status in ('recusado','cancelado')
      then coalesce(event_reason,target.cancellation_reason,new_financial_status) else target.cancellation_reason end
  where target.id=v_order.id returning target.* into v_order;

  update public.payment_events set processed=true,processed_at=now() where id=v_event;
  return query select v_order.id,v_order.code,v_order.financial_status,v_order.operational_status,true;
end;
$$;

revoke all on function public.apply_order_payment_status(uuid,text,text,text,text,text,text,boolean,text)
  from public,anon,authenticated;
grant execute on function public.apply_order_payment_status(uuid,text,text,text,text,text,text,boolean,text)
  to service_role;
