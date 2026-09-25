-- Administrative visibility only: never update orders, payments or inventory.
create table public.admin_order_archives (
  order_id uuid primary key references public.orders(id) on delete restrict,
  archived_at timestamptz not null default now(),
  archived_by uuid references auth.users(id) on delete set null
);
alter table public.admin_order_archives enable row level security;
revoke all on public.admin_order_archives from public, anon, authenticated;
grant select, insert, delete on public.admin_order_archives to service_role;

create function public.set_admin_order_archived(
  target_order_id uuid, actor_user_id uuid, archive_value boolean
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  target public.orders%rowtype;
  changed integer;
begin
  if archive_value is null then raise exception 'INVALID_ARCHIVE_ACTION'; end if;
  if not exists (select 1 from public.admin_users where user_id=actor_user_id and active)
    then raise exception 'ADMIN_REQUIRED'; end if;
  select * into target from public.orders where id=target_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if archive_value then
    if target.operational_status <> 'cancelado'
       or target.financial_status = 'pago' then
      raise exception 'ORDER_NOT_CANCELLED';
    end if;
    insert into public.admin_order_archives(order_id,archived_by)
      values(target_order_id,actor_user_id) on conflict(order_id) do nothing;
  else
    delete from public.admin_order_archives where order_id=target_order_id;
  end if;
  get diagnostics changed = row_count;
  if changed > 0 then
    insert into public.admin_audit_log(admin_user_id,order_id,action,note)
    values(actor_user_id,target_order_id,
      case when archive_value then 'pedido_arquivado' else 'pedido_restaurado' end,
      'Alteração apenas da visibilidade administrativa; pedido e histórico preservados.');
  end if;
  return jsonb_build_object('archived',archive_value,'changed',changed > 0);
end;
$$;
revoke all on function public.set_admin_order_archived(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_admin_order_archived(uuid,uuid,boolean) to service_role;
