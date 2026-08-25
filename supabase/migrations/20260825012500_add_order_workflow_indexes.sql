-- Índices de apoio para filtros administrativos e relacionamentos do fluxo de pedidos.
create index if not exists admin_audit_log_admin_user_id_idx on public.admin_audit_log(admin_user_id);
create index if not exists admin_audit_log_order_id_idx on public.admin_audit_log(order_id);
create index if not exists inventory_reservations_product_slug_idx on public.inventory_reservations(product_slug);
create index if not exists order_items_product_id_idx on public.order_items(product_id) where product_id is not null;
