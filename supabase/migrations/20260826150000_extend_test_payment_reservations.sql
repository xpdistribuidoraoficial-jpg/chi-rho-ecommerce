-- Pix é assíncrono. Em modo de teste, amplia a reserva para acompanhar a
-- vigência mínima usada pela preferência sem alterar a regra pública de 30 min.
create or replace function public.extend_test_payment_reservation(
  target_order_id uuid,
  requested_expires_at timestamptz
)
returns timestamptz
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_order public.orders%rowtype;
begin
  if requested_expires_at < now() + interval '2 days'
    or requested_expires_at > now() + interval '4 days' then
    raise exception 'INVALID_TEST_RESERVATION_EXPIRY';
  end if;

  select * into v_order
  from public.orders
  where id=target_order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.financial_status<>'aguardando_pagamento'
    or v_order.reservation_expires_at is null
    or v_order.reservation_expires_at<=now() then
    raise exception 'ORDER_NOT_PAYABLE';
  end if;
  if not exists(
    select 1 from public.inventory_reservations
    where order_id=v_order.id and status='reservado'
  ) then raise exception 'RESERVATION_NOT_ACTIVE'; end if;

  update public.inventory_reservations
  set expires_at=greatest(expires_at,requested_expires_at)
  where order_id=v_order.id and status='reservado';

  update public.orders
  set reservation_expires_at=greatest(reservation_expires_at,requested_expires_at)
  where id=v_order.id
  returning reservation_expires_at into requested_expires_at;

  return requested_expires_at;
end;
$$;

revoke all on function public.extend_test_payment_reservation(uuid,timestamptz)
  from public,anon,authenticated;
grant execute on function public.extend_test_payment_reservation(uuid,timestamptz)
  to service_role;
