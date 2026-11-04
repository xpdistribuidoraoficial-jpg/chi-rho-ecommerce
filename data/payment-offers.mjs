import { initialKits } from './cpad-kits.mjs';
// Preços avulsos autorizados pelo lojista em 03/11/2026.
// Kits por soma vigente repassam o Pix dos componentes uma única vez.
export const paymentOffers = Object.freeze({
  'comentario-biblico-beacon-antigo-testamento': Object.freeze({ card:349.99, pix:280.00 }),
  'comentario-biblico-beacon-novo-testamento': Object.freeze({ card:349.99, pix:290.00 })
});
export const hasPaymentOffer = (cart, kits = initialKits) => cart.some(line => Boolean(paymentOffers[line.slug])
  || line.paymentComponents?.some(component=>Boolean(paymentOffers[component.slug]))
  || kits.some(kit=>kit.slug===line.slug && kit.pricing_mode==='sum_current_prices'
    && kit.components.some(component=>Boolean(paymentOffers[component.slug]))));

export function applyPaymentOffer(pricing, method) {
  if (!['pix', 'card'].includes(method)) throw new Error('INVALID_PAYMENT_METHOD');
  const pixDiscountCents = method === 'pix' ? pricing.lines.reduce((sum, line) => {
    const components = line.paymentComponents || [{slug:line.slug,price:line.price,quantity:1}];
    return sum + components.reduce((part,component)=>{
      const offer=paymentOffers[component.slug];
      return part+(offer ? Math.max(0,Math.round(component.price*100)-Math.round(offer.pix*100))*component.quantity*line.quantity : 0);
    },0);
  }, 0) : 0;
  return { ...pricing, paymentMethod:method, pixDiscount:pixDiscountCents / 100,
    discount:(Math.round(pricing.discount * 100) + pixDiscountCents) / 100,
    referenceDiscount:(Math.round(pricing.referenceDiscount * 100) + pixDiscountCents) / 100,
    totalProducts:(Math.round(pricing.totalProducts * 100) - pixDiscountCents) / 100 };
}
