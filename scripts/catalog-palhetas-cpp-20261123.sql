-- CHI RHO: 23/11/2026. Estoque inicial autorizado: 5 por Bíblia, 100 pacotes por tamanho.
-- Valores finais para todas as formas de pagamento, sem desconto adicional.
-- Palhetas: base cadastrada 150 g / 7; 10 de 24 cm = 215 g, 28 cm = 250 g.
-- Embalagem: margem autorizada de 1 cm em cada lado; altura proporcional de 2 para 3 cm.
-- Bíblias: pesos/dimensões de referência dos fornecedores; conferir pacote antes de postar.
-- Idempotente: reexecutar não repõe itens vendidos nem modifica reservas.
begin;
insert into public.inventory (product_slug,sku,product_name,image_url,stock_total,stock_reserved,unit_price,weight_kg,length_cm,width_cm,height_cm,category,is_fragile) values
  ('colarinho-clerical-palheta-24x3-pacote-10','MIN-COLARINHO-24X3-PCT10','Colarinho Clerical Palheta 24 × 3 cm — Pacote com 10','assets/products/colarinho-clerical-palheta-pastores-pacote-7.webp',100,0,22.0,0.215,26,5,3,'Acessórios Ministeriais',false),
  ('colarinho-clerical-palheta-28x3-pacote-10','MIN-COLARINHO-28X3-PCT10','Colarinho Clerical Palheta 28 × 3 cm — Pacote com 10','assets/products/colarinho-clerical-palheta-pastores-pacote-7.webp',100,0,26.0,0.25,30,5,3,'Acessórios Ministeriais',false),
  ('biblia-arc-jumbo-harpa-arabesco-preta','7908084623487','Bíblia Sagrada ARC — Letra Jumbo, Harpa e Corinhos, Arabesco Preta','assets/products/biblia-arc-jumbo-harpa-arabesco-preta-01.webp',5,0,79.9,1.06,24,15,3.5,'Bíblias Masculinas',false),
  ('biblia-arc-jumbo-harpa-arabesco-bordo','7908084623517','Bíblia Sagrada ARC — Letra Jumbo, Harpa e Corinhos, Arabesco Bordô','assets/products/biblia-arc-jumbo-harpa-arabesco-bordo-01.webp',5,0,79.9,0.85,24,15,4,'Bíblias Masculinas',false),
  ('biblia-arc-hipergigante-harpa-arabesco-bordo','7908084623104','Bíblia Sagrada ARC — Letra Hipergigante, Harpa e Corinhos, Arabesco Bordô','assets/products/biblia-arc-hipergigante-harpa-arabesco-bordo-01.webp',5,0,69.9,0.74,22,15,3,'Bíblias Masculinas',false),
  ('biblia-arc-hipergigante-harpa-cruz-preta','7908084623029','Bíblia Sagrada ARC — Letra Hipergigante, Harpa e Corinhos, Cruz Preta','assets/products/biblia-arc-hipergigante-harpa-cruz-preta-01.webp',5,0,69.9,0.79,22,15,3,'Bíblias Masculinas',false),
  ('biblia-arc-hipergigante-harpa-arabesco-marrom','7908084623098','Bíblia Sagrada ARC — Letra Hipergigante, Harpa e Corinhos, Arabesco Marrom','assets/products/biblia-arc-hipergigante-harpa-arabesco-marrom-01.webp',5,0,69.9,0.787,22,15,3,'Bíblias Masculinas',false)
on conflict (product_slug) do nothing;
update public.inventory set unit_price=79.90
where product_slug='biblia-arc-jumbo-harpa-jardim-vermelho' and sku='7908084623388' and unit_price in(105.09,79.90);
commit;
