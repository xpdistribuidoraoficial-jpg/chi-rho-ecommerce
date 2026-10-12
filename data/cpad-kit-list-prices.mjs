// Preços cheios CPAD já conferidos no catálogo, separados do preço avulso promocional do Chi Rho.
// Kits aplicam 30% UMA VEZ sobre a soma dos preços cheios (arredondamento no kit).
// Para criar novos kits, cadastre primeiro o valor cheio de todos os componentes.
export const cpadKitListPrices = Object.freeze({
  'panorama-da-biblia': 69.95,
  'herois-da-fe': 49.99,
  'biblia-estudo-pentecostal': 329.99,
  'comentario-biblico-beacon-antigo-testamento': 489.99
});
export function kitListPrice(slug) {
  const price = cpadKitListPrices[slug];
  if (!Number.isFinite(price) || price <= 0) throw new Error('KIT_LIST_PRICE_UNAVAILABLE');
  return price;
}
