// Regra comercial compartilhada pela cotação, checkout e expedição.
export const FREE_SHIPPING_MINIMUM = 100.01;
const minimumCents = Math.round(FREE_SHIPPING_MINIMUM * 100);
export const FREE_SHIPPING_PREFIX = 'Frete grátis • ';
export const qualifiesForFreeShipping = total => Number.isFinite(Number(total)) && Math.round(Number(total)*100) >= minimumCents;
export const remainingForFreeShipping = total => Math.max(0,minimumCents-Math.round((Number(total)||0)*100))/100;
export function shippingWithOffer(service,total) {
  if(service.carrierCode==='PICKUP_VENDOR') return {...service,price:0};
  const originalPrice=service.originalPrice ?? service.price;
  const free=service.economy===true && qualifiesForFreeShipping(total);
  const description=String(service.description||'Entrega').replace(/^Frete grátis • /,'');
  return {...service,originalPrice,price:free?0:originalPrice,freeShipping:free,
    description:(free?FREE_SHIPPING_PREFIX:'')+description};
}
export function applyShippingOffer(services,total) {
  return [...services].sort((a,b)=>a.price-b.price).map((service,index)=>shippingWithOffer({...service,economy:index===0},total));
}
export const merchantPaysShipping = order => Number(order.shipping_price)===0
  // Honor confirmed orders that qualified under the previous R$100 minimum.
  && Math.round((Number(order.subtotal)-Number(order.discount||0))*100) >= 10000
  && String(order.shipping_service||'').startsWith(FREE_SHIPPING_PREFIX)
  && order.shipping_carrier_code!=='PICKUP_VENDOR';
