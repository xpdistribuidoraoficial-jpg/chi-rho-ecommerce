-- Oferta aprovada para a Bíblia Defesa da Fé capa dura: R$ 89,99.
-- Reexecução segura: preço novo idempotente; qualquer terceiro preço exige revisão.
DO $$
DECLARE current_price numeric;
BEGIN
  SELECT unit_price INTO current_price FROM public.inventory
  WHERE product_slug='biblia-estudo-defesa-da-fe';
  IF current_price IS NULL THEN
    RAISE EXCEPTION 'Bíblia não localizada no inventário';
  ELSIF current_price=89.99 THEN
    RETURN;
  ELSIF current_price<>127.49 THEN
    RAISE EXCEPTION 'Preço inesperado: revisar antes de atualizar a oferta';
  END IF;
  UPDATE public.inventory SET unit_price=89.99,updated_at=now()
  WHERE product_slug='biblia-estudo-defesa-da-fe' AND unit_price=127.49;
END $$;
