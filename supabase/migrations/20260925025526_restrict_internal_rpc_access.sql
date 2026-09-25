-- Internal RPCs must only be invoked by authenticated server-side Edge Functions.
-- Keep implementations, business rules and data unchanged.
revoke execute on function public.admin_adjust_inventory(text,integer,text,uuid) from public, anon, authenticated;
revoke execute on function public.confirm_pickup_delivery(uuid,uuid,text,text) from public, anon, authenticated;
revoke execute on function public.authorize_admin_session(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.checkout_rate_limit_allowed(text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.admin_adjust_inventory(text,integer,text,uuid) to service_role;
grant execute on function public.confirm_pickup_delivery(uuid,uuid,text,text) to service_role;
grant execute on function public.authorize_admin_session(uuid,uuid) to service_role;
grant execute on function public.checkout_rate_limit_allowed(text,text,text,uuid) to service_role;
