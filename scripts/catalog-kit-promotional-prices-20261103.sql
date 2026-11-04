-- Preços promocionais dos avulsos passam a compor os kits sem mais 30%.
-- discount_percent=0 indica soma dos preços vigentes; 30 preserva a regra de preço cheio.
-- Nenhuma permissão, chave, estoque ou pedido anterior é alterado.
begin;
alter table public.cpad_kits drop constraint cpad_kits_discount_percent_check;
alter table public.cpad_kits add constraint cpad_kits_discount_percent_check check (discount_percent in (0,30));
do $$
declare changed integer;
begin
update public.cpad_kits set discount_percent=0,updated_at=now()
where slug in ('kit-cpad-leitura-crescimento','kit-cpad-estudo-palavra');
get diagnostics changed = row_count;
if changed <> 2 then raise exception 'KIT_UPDATE_CONFLICT'; end if;
end; $$;
commit;
