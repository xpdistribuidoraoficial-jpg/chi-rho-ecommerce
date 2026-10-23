// Preços avulsos autorizados pelo lojista em 23/10/2026.
// Kit Estudo da Palavra mantém seu desconto próprio sobre os preços cheios.
export const paymentOffers = Object.freeze({
  'comentario-biblico-beacon-antigo-testamento': Object.freeze({ card:349.99, pix:303.18 }),
  'comentario-biblico-beacon-novo-testamento': Object.freeze({ card:349.99, pix:330.00 })
});
export const hasPaymentOffer = cart => cart.some(line => Boolean(paymentOffers[line.slug]));

export function applyPaymentOffer(pricing, method) {
  if (!['pix', 'card'].includes(method)) throw new Error('INVALID_PAYMENT_METHOD');
  const pixDiscountCents = method === 'pix' ? pricing.lines.reduce((sum, line) => {
    const offer = paymentOffers[line.slug];
    return sum + (offer ? Math.max(0, Math.round(line.price * 100) - Math.round(offer.pix * 100)) * line.quantity : 0);
  }, 0) : 0;
  return { ...pricing, paymentMethod:method, pixDiscount:pixDiscountCents / 100,
    discount:(Math.round(pricing.discount * 100) + pixDiscountCents) / 100,
    referenceDiscount:(Math.round(pricing.referenceDiscount * 100) + pixDiscountCents) / 100,
    totalProducts:(Math.round(pricing.totalProducts * 100) - pixDiscountCents) / 100 };
}
