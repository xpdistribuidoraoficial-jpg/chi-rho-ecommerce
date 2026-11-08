-- CHI RHO: cinco Bíblias femininas, 5 unidades de cada, autorizadas pelo lojista em 08/11/2026.
-- Preço de venda: promoção no cartão pesquisada na Plenitude; ARA letra grande pela SBB.
-- Não aplica desconto adicional de Pix nem descontos cumulativos.
-- King James 9788581582375 excluída: a página da editora contém divergência de ISBN.
-- Medidas e pesos de referência dos fornecedores. Espessura de 4 cm estimada para a ARA letra grande.
-- Confirmar peso e dimensões do pacote embalado antes da postagem.
-- Uma nova execução nunca repõe estoque já vendido nem altera reservas.
begin;
insert into public.inventory (
  product_slug, sku, product_name, image_url, stock_total, stock_reserved,
  unit_price, weight_kg, length_cm, width_cm, height_cm, category, is_fragile
) values
  ('biblia-ara-mulher-letra-grande-pink', '7899938421086', 'Bíblia Sagrada ARA para Mulher — Letra Grande, Rosa Pink', 'assets/products/biblia-ara-mulher-letra-grande-pink-01.webp', 5, 0, 97.90, 0.58, 21, 13.5, 4, 'Bíblias Femininas', false),
  ('biblia-ara-letra-gigante-pink', '7899938423165', 'Bíblia Sagrada ARA — Letra Gigante, Capa Luxo Pink', 'assets/products/biblia-ara-letra-gigante-pink-01.webp', 5, 0, 49.34, 0.739, 20.5, 14.5, 3, 'Bíblias Femininas', false),
  ('biblia-ara-letra-gigante-vermelha', '7899938423196', 'Bíblia Sagrada ARA — Letra Gigante, Capa Luxo Vermelha', 'assets/products/biblia-ara-letra-gigante-vermelha-01.webp', 5, 0, 50.09, 1, 21, 14, 3, 'Bíblias Femininas', false),
  ('biblia-naa-letra-gigante-pink-flor-indice', '9788531117510', 'Bíblia Sagrada NAA — Letra Gigante, Pink Floral, com Índice', 'assets/products/biblia-naa-letra-gigante-pink-flor-indice-01.webp', 5, 0, 93.00, 0.8, 21, 14, 3, 'Bíblias Femininas', false),
  ('biblia-arc-jumbo-harpa-jardim-vermelho', '7908084623388', 'Bíblia Sagrada ARC — Letra Jumbo, Harpa e Corinhos, Jardim Vermelho', 'assets/products/biblia-arc-jumbo-harpa-jardim-vermelho-01.webp', 5, 0, 105.09, 0.959, 24, 15, 3.5, 'Bíblias Femininas', false)
on conflict (product_slug) do nothing;
commit;
