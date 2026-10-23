-- CHI RHO: oferta e estoque autorizados pelo lojista em 22/10/2026.
-- Preserva o estoque e as reservas existentes; novos cadastros recebem 5 unidades.
-- Peso/medidas da Bíblia: CPAD, edição Tarja Verde (GTIN 7898203062375).
-- Peso Beacon NT: CPAD, 5,170 kg; envelope logístico de 25 x 22 x 18 cm
-- segue a caixa Beacon AT já cadastrada; conferir embalagem real antes da postagem.
begin;
update public.inventory
set unit_price = 352.00
where product_slug = 'biblia-estudo-cronologica';

insert into public.inventory (
  product_slug, sku, product_name, image_url, stock_total, stock_reserved,
  unit_price, weight_kg, length_cm, width_cm, height_cm, category, is_fragile
) values (
  'biblia-estudo-cronologica-tricolor', 'CPAD-282477',
  'Bíblia de Estudo Cronológica Aplicação Pessoal — Tricolor (Tarja Verde)',
  'assets/products/biblia-estudo-cronologica-tricolor-01.jpg', 5, 0,
  352.00, 1.700, 25, 19, 5, 'Bíblias de Estudo', false
) on conflict (product_slug) do nothing;

insert into public.inventory (
  product_slug, sku, product_name, image_url, stock_total, stock_reserved,
  unit_price, weight_kg, length_cm, width_cm, height_cm, category, is_fragile
)
select 'comentario-biblico-beacon-novo-testamento', 'CPAD-128275',
  'Comentário Bíblico Beacon — Novo Testamento, 5 volumes',
  'assets/products/comentario-beacon-novo-testamento-01.jpg', stock_available, 0,
  unit_price, 5.170, 25, 18, 22, 'Livros Cristãos', false
from public.inventory where product_slug = 'comentario-biblico-beacon-antigo-testamento'
on conflict (product_slug) do nothing;
commit;
