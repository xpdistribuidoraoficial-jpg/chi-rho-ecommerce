-- CHI RHO: preço R$ 16,99 e 20 unidades aprovados em 16/10/2026.
-- Modelo KA-5005-5G com cabo Lightning, distinto do KA-5005 avulso.
-- Referência provisória de embalagem para cotação: 200 g, 20 x 15 x 10 cm.
-- Conferir o peso e as medidas reais antes da postagem.
-- Idempotente: não sobrescreve estoque nem reservas existentes.
insert into public.inventory (
  product_slug, sku, product_name, image_url, stock_total, stock_reserved,
  unit_price, weight_kg, length_cm, width_cm, height_cm, category, is_fragile
) values (
  'casa-carregador-kapbom-ka-5005-5g-30w-lightning', 'KA-5005-5G-LIGHTNING',
  'Carregador USB-C KAPBOM 30W + Cabo Lightning — KA-5005-5G',
  'assets/products/kapbom-ka-5005-5g-30w-conjunto.png', 20, 0,
  16.99, 0.200, 20, 15, 10, 'Utilidades Domésticas', false
) on conflict (product_slug) do nothing;
