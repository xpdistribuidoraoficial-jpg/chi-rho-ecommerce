-- Public offer information only; inventory and customer tables stay private.
grant select on public.cpad_kits to anon,authenticated;
create policy cpad_catalog_read on public.cpad_kits for select to anon,authenticated using(true);

create table private.cpad_checkout_keys (
 name text primary key, secret text not null, created_at timestamptz not null default now()
);
alter table private.cpad_checkout_keys enable row level security;
revoke all on private.cpad_checkout_keys from public,anon,authenticated;

create or replace function private.cpad_signed_action(payload_text text, signature text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare key text; payload jsonb; result record; target_id uuid; target_order public.orders%rowtype; expiry timestamptz;
begin
  select secret into key from private.cpad_checkout_keys where name='preview';
  if key is null or payload_text is null or signature is null or length(payload_text)>50000 or signature !~ '^[0-9a-f]{64}$'
    or extensions.hmac(payload_text,key,'sha256')<>decode(signature,'hex') then raise exception 'UNAUTHORIZED'; end if;
  payload:=payload_text::jsonb;
  if payload->>'signed_at' is null or abs(extract(epoch from now())*1000-(payload->>'signed_at')::numeric)>90000 then raise exception 'UNAUTHORIZED'; end if;
  if payload->>'action'='order' then
    if not public.checkout_rate_limit_allowed(payload#>>'{customer,email}',payload#>>'{customer,whatsapp}',
      payload#>>'{customer,tax_id}',(payload->>'client_request_id')::uuid) then raise exception 'RATE_LIMITED'; end if;
    select * into result from public.create_checkout_order_with_kits(payload);
    return to_jsonb(result);
  elsif payload->>'action'='payment_read' then
    target_id:=public.prepare_payment_preference(payload->>'code',(payload->>'public_token')::uuid);
    select * into target_order from public.orders where id=target_id;
    if coalesce((payload->>'test_mode')::boolean,false) then
      expiry:=public.extend_test_payment_reservation(target_id,now()+interval '72 hours');
      select * into target_order from public.orders where id=target_id;
    end if;
    return jsonb_build_object('order',to_jsonb(target_order),'items',
      (select jsonb_agg(to_jsonb(item) order by item.id) from public.order_items item where item.order_id=target_id));
  elsif payload->>'action'='payment_save' then
    target_id:=public.prepare_payment_preference(payload->>'code',(payload->>'public_token')::uuid);
    if payload->>'payment_url' !~ '^https://(sandbox|www)\.mercadopago\.com\.br/' then raise exception 'INVALID_PAYMENT_URL'; end if;
    update public.orders set payment_preference_id=left(payload->>'preference_id',160),
      payment_preference_url=payload->>'payment_url',payment_preference_created_at=now() where id=target_id;
    return jsonb_build_object('saved',true);
  end if;
  raise exception 'INVALID_ACTION';
end; $$;
revoke all on function private.cpad_signed_action(text,text) from public;
grant usage on schema private to anon,authenticated;
grant execute on function private.cpad_signed_action(text,text) to anon,authenticated;
create or replace function public.cpad_signed_action(payload_text text,signature text)
returns jsonb language sql security invoker set search_path='' as $$ select private.cpad_signed_action(payload_text,signature); $$;
revoke all on function public.cpad_signed_action(text,text) from public;
grant execute on function public.cpad_signed_action(text,text) to anon,authenticated;

create or replace function private.manage_cpad_kit(target_slug text,enabled boolean,components jsonb,portal text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare row public.cpad_kits%rowtype; expected_email text; component jsonb;
begin
  expected_email:=case portal when 'owner' then 'contato.michellopes@gmail.com' when 'paulo' then 'xpdistribuidora.oficial@gmail.com' end;
  if auth.uid() is null or expected_email is null
    or not exists(select 1 from auth.users where id=auth.uid() and lower(email)=expected_email)
    or not exists(select 1 from public.authorize_admin_session(auth.uid(),(auth.jwt()->>'session_id')::uuid))
    then raise exception 'UNAUTHORIZED'; end if;
  select * into row from public.cpad_kits where slug=target_slug for update;
  if not found then raise exception 'KIT_NOT_FOUND'; end if;
  if jsonb_typeof(components)<>'array' or jsonb_array_length(components) not between 2 and 6
    or (select count(distinct item->>'slug') from jsonb_array_elements(components) item)<>jsonb_array_length(components)
    then raise exception 'INVALID_KIT'; end if;
  if enabled or components<>row.components then
    for component in select * from jsonb_array_elements(components) loop
      if (component->>'quantity')::numeric<>trunc((component->>'quantity')::numeric)
        or (component->>'quantity')::integer not between 1 and 99
        or component->>'slug' not in ('biblia-media-letra-gigante-harpa','biblia-harpa-floral-aquarela-gigante','biblia-harpa-floral-preta-grande','biblia-estudo-pentecostal','biblia-aplicacao-pessoal-nvt','biblia-assembleia-de-deus-capa-luxo','biblia-estudo-cronologica','biblia-estudo-defesa-da-fe','panorama-da-biblia','herois-da-fe','uma-garota-segundo-o-coracao-de-deus','como-ter-o-coracao-de-maria-no-mundo-de-marta','historia-dos-hebreus','pequena-enciclopedia-biblica','historia-eclesiastica','declaracao-de-fe-atualizada','israel-gogue-e-o-anticristo','tempo-do-fim','comentario-biblico-beacon-antigo-testamento','comentario-exegetico-de-atos','teologia-sistematica-stanley-horton')
        or not exists(select 1 from public.inventory where product_slug=component->>'slug' and unit_price>0)
        then raise exception 'INVALID_KIT'; end if;
    end loop;
  end if;
  update public.cpad_kits set active=enabled,components=manage_cpad_kit.components,updated_at=now()
    where slug=target_slug returning * into row;
  return to_jsonb(row);
end; $$;
revoke all on function private.manage_cpad_kit(text,boolean,jsonb,text) from public,anon;
grant execute on function private.manage_cpad_kit(text,boolean,jsonb,text) to authenticated;
create or replace function public.manage_cpad_kit(target_slug text,enabled boolean,components jsonb,portal text)
returns jsonb language sql security invoker set search_path='' as $$ select private.manage_cpad_kit(target_slug,enabled,components,portal); $$;
revoke all on function public.manage_cpad_kit(text,boolean,jsonb,text) from public,anon;
grant execute on function public.manage_cpad_kit(text,boolean,jsonb,text) to authenticated;
