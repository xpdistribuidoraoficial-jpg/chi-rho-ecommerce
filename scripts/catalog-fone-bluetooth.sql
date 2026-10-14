-- CHI RHO: oferta e estoque confirmados pelo lojista em 14/10/2026.
-- Embalagem de referência para cotação: 200 g, 20 x 15 x 10 cm.
-- Peso e medidas são estimativas operacionais, a conferir antes da postagem.
-- Nunca repõe nem sobrescreve estoque de um produto já cadastrado.
insert into public.inventory (
  product_slug, sku, product_name, image_url, stock_total, stock_reserved,
  unit_price, weight_kg, length_cm, width_cm, height_cm, category, is_fragile
) values (
  'casa-fone-bluetooth-visor-bateria', 'CASA-FONE-BT-VISOR-PRETO',
  'Fone Bluetooth com Estojo e Visor de Bateria — Preto',
  'assets/products/fone-bluetooth-visor-produto.png', 20, 0,
  23.99, 0.200, 20, 15, 10, 'Utilidades Domésticas', false
) on conflict (product_slug) do nothing;
