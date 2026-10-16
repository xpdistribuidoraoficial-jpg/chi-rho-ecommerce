import { trackAnalyticsEvent } from './analytics-consent.mjs';

const EVENTS = new Set(['view_item', 'view_cart', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info']);
const cents = value => Math.round(Number(value) * 100);

export function commerceItems(rows = []) {
  return rows.map(row => {
    const product = row.product || row;
    const quantity = Number(row.quantity || 1);
    const price = Number(product.preco ?? product.price ?? (Number(product.line_total) / quantity));
    const id = String(product.slug || product.sku || '').slice(0, 120);
    if (!id || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) return null;
    return { item_id: id, item_name: String(product.nome || product.name || product.product_name || id).slice(0, 200),
      item_category: String(product.categoria || product.category || '').slice(0, 100), price: cents(price) / 100, quantity };
  }).filter(Boolean);
}

export function commercePayload(rows, extra = {}) {
  const items = commerceItems(rows);
  return { currency: 'BRL', value: items.reduce((sum, item) => sum + cents(item.price) * item.quantity, 0) / 100, items,
    ...(extra.shipping_tier ? { shipping_tier: String(extra.shipping_tier).slice(0, 100) } : {}),
    ...(extra.payment_type ? { payment_type: String(extra.payment_type).slice(0, 40) } : {}) };
}

export function trackCommerce(name, rows, extra) {
  if (!EVENTS.has(name)) return false;
  const payload = commercePayload(rows, extra);
  return payload.items.length > 0 && trackAnalyticsEvent(name, payload);
}

export function createPurchaseTracker({ emit, storage }) {
  const sent = new Set();
  return (order, snapshot) => {
    // A redirect or a client flag never confirms payment: use the status API.
    if (order?.financialStatus !== 'pago' || !/^CHR-[A-Z0-9-]+$/.test(order.code || '')) return false;
    const items = commerceItems(snapshot?.items);
    const total = Number(snapshot?.total), shipping = Number(snapshot?.shippingPrice || 0);
    if (!items.length || !Number.isFinite(total) || total <= 0 || !Number.isFinite(shipping) || shipping < 0) return false;
    const value = items.reduce((sum, item) => sum + cents(item.price) * item.quantity, 0) / 100;
    if (Math.abs(cents(total - shipping) - cents(value)) > 1) return false;
    const key = `chi-rho-analytics-purchase:${order.code}`;
    try { if (sent.has(key) || storage?.getItem(key)) return false; } catch {}
    if (!emit('purchase', { transaction_id: order.code, currency: 'BRL', value, shipping, items })) return false;
    sent.add(key);
    try { storage?.setItem(key, '1'); } catch {}
    return true;
  };
}

let purchaseTracker;
export function trackConfirmedPurchase(order, snapshot) {
  if (!purchaseTracker) {
    let storage;
    try { storage = window.localStorage; } catch {}
    purchaseTracker = createPurchaseTracker({ emit: trackAnalyticsEvent, storage });
  }
  return purchaseTracker(order, snapshot);
}

if (typeof document !== 'undefined') {
  document.addEventListener('chi-rho-commerce', event => {
    const { name, items, extra } = event.detail || {};
    trackCommerce(name, items, extra);
  });
}
