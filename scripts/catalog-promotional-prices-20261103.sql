-- Preços de venda com desconto confirmados pelo lojista em 03/11/2026.
-- Beacon permanece a R$349,99 no cartão; Pix é calculado em data/payment-offers.mjs.
-- Não altera estoque, reservas, pedidos anteriores ou preços cheios dos kits.
begin;
do $$
declare changed integer;
begin
with prices(product_slug, expected_price, new_price) as (values
  ('colarinho-clerical-palheta-pastores-pacote-7',28.00,19.00),
  ('biblia-estudo-pentecostal',280.49,199.90),
  ('biblia-pregador-pentecostal',357.90,199.90),
  ('casa-balanca-digital-cozinha-10kg',29.90,19.90),
  ('cafe-com-as-mulheres-da-biblia',31.84,18.50),
  ('cafe-com-o-espirito-santo',23.92,18.50),
  ('como-ter-o-coracao-de-maria-no-mundo-de-marta',46.74,36.00),
  ('herois-da-fe',42.49,32.00),
  ('historia-dos-hebreus',169.99,135.00),
  ('panorama-da-biblia',59.46,42.00),
  ('tempo-do-fim',67.96,48.00),
  ('teologia-sistematica-herman-bavinck',119.92,59.00),
  ('casa-bomba-eletrica-garrafa-agua',32.90,7.90)
)
update public.inventory i set unit_price=p.new_price,updated_at=now()
from prices p where i.product_slug=p.product_slug and i.unit_price=p.expected_price;
get diagnostics changed = row_count;
if changed <> 13 then raise exception 'PRICE_UPDATE_CONFLICT: expected 13 unchanged prices, got %',changed; end if;
end; $$;
commit;
