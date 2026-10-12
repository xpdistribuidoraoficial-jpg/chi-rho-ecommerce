-- Aplicar somente com a autorização de publicação da oferta.
-- Banco de estoque é compartilhado com produção; não executar durante a revisão da prévia.
-- Atualiza o preço efetivo do checkout para coincidir com a oferta comercial de R$ 119,00.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory
    WHERE product_slug = 'biblia-estudo-defesa-da-fe'
      AND unit_price = 127.49
  ) THEN
    RAISE EXCEPTION 'Preço ou produto mudou; revisar antes de ativar oferta';
  END IF;
  UPDATE public.inventory
  SET unit_price = 119.00, updated_at = now()
  WHERE product_slug = 'biblia-estudo-defesa-da-fe' AND unit_price = 127.49;
END $$;
