(() => {
  if (typeof catalogProducts === 'undefined') return;

  const blockMania = catalogProducts.find((product) => product.slug === 'brinquedo-blocos-104-pecas');
  if (!blockMania) return;

  blockMania.precoOriginal = 47.80;
  blockMania.preco = 40.63;
  blockMania.fontePreco = 'Preço cheio informado pelo lojista; desconto CHI RHO de 15%';
  blockMania.dataConsultaPreco = '2026-09-12';
})();
