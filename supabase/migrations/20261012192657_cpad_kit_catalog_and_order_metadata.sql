create table if not exists public.cpad_kits (
  slug text primary key check (slug ~ '^kit-cpad-[a-z0-9-]+$'),
  name text not null check (length(name) between 3 and 120),
  description text not null default '',
  active boolean not null default false,
  discount_percent integer not null default 30 check (discount_percent = 30),
  components jsonb not null check (jsonb_typeof(components) = 'array' and jsonb_array_length(components) between 2 and 6),
  updated_at timestamptz not null default now()
);
alter table public.cpad_kits enable row level security;
revoke all on public.cpad_kits from public, anon, authenticated;
grant select, insert, update on public.cpad_kits to service_role;
create table if not exists public.order_kit_details (
  order_id uuid primary key references public.orders(id) on delete cascade,
  kits jsonb not null check (jsonb_typeof(kits) = 'array'),
  created_at timestamptz not null default now()
);
alter table public.order_kit_details enable row level security;
revoke all on public.order_kit_details from public, anon, authenticated;
grant select, insert on public.order_kit_details to service_role;

insert into public.cpad_kits(slug,name,description,active,components) values
('kit-cpad-leitura-crescimento','Kit Leitura e Crescimento','Panorama da Bíblia + Heróis da Fé.',true,
 '[{"slug":"panorama-da-biblia","quantity":1},{"slug":"herois-da-fe","quantity":1}]'),
('kit-cpad-estudo-palavra','Kit Estudo da Palavra','Bíblia de Estudo Pentecostal + Beacon Antigo Testamento, 5 volumes.',true,
 '[{"slug":"biblia-estudo-pentecostal","quantity":1},{"slug":"comentario-biblico-beacon-antigo-testamento","quantity":1}]'),
('kit-cpad-culto','Kit Culto','Bíblia CPAD sem Harpa incorporada + Harpa Cristã avulsa. Seleção em preparação.',false,
 '[{"slug":"biblia-estudo-pentecostal","quantity":1},{"slug":"harpa-crista-grande-luxo-preta","quantity":1}]')
on conflict(slug) do nothing;

create or replace function public.create_checkout_order_with_kits(payload jsonb)
returns table(order_id uuid,order_code text,order_public_token uuid,
 order_operational_status text,order_financial_status text,order_total numeric,order_reservation_expires_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare result record;
begin
  if jsonb_typeof(coalesce(payload->'kits','[]'::jsonb)) <> 'array'
    or coalesce((payload->>'discount')::numeric,0)<0
    or coalesce((payload->>'discount')::numeric,0)>=(payload->>'subtotal')::numeric
    then raise exception 'INVALID_ITEMS'; end if;
  select * into result from public.create_checkout_order_v2(payload);
  if jsonb_array_length(coalesce(payload->'kits','[]'::jsonb)) > 0 then
    insert into public.order_kit_details(order_id,kits) values(result.order_id,payload->'kits') on conflict(order_id) do nothing;
  end if;
  return query select result.order_id,result.order_code,result.order_public_token,result.order_operational_status,
    result.order_financial_status,result.order_total,result.order_reservation_expires_at;
end; $$;
revoke all on function public.create_checkout_order_with_kits(jsonb) from public,anon,authenticated;
grant execute on function public.create_checkout_order_with_kits(jsonb) to service_role;
