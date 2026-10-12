-- Publicação condicionada à conferência comercial e autorização da operação.
-- Somente atualiza o SKU já cadastrado; não cria estoque fictício das versões luxo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory
    WHERE product_slug = 'biblia-estudo-defesa-da-fe' AND unit_price = 127.49) THEN
    RAISE EXCEPTION 'Preço da Bíblia Defesa da Fé alterado; revisar antes de publicar';
  END IF;
  UPDATE public.inventory SET unit_price = 89.99, updated_at = now()
  WHERE product_slug = 'biblia-estudo-defesa-da-fe' AND unit_price = 127.49;
END $$;
