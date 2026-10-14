import { kitSummary } from '../lib/kit-pricing.mjs';
import { casaKits } from './casa-kits.mjs';
const INVENTORY_ENDPOINT = 'https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/inventory-status';
const KITS_ENDPOINT = 'https://sailabcmcqdzrqhqztqs.supabase.co/rest/v1/cpad_kits?select=slug,name,description,active,discount_percent,components';
const PUBLIC_KEY = 'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
const validNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
export async function loadShippingCatalog() {
  const headers = { apikey: PUBLIC_KEY };
  const [inventoryResult, kitResult] = await Promise.allSettled([
    fetch(INVENTORY_ENDPOINT, { headers, signal: AbortSignal.timeout(8000) }).then(async response => response.ok ? (await response.json()).inventory : []),
    fetch(KITS_ENDPOINT, { headers, signal: AbortSignal.timeout(8000) }).then(async response => response.ok ? await response.json() : [])
  ]);
  const inventory = inventoryResult.status === 'fulfilled' && Array.isArray(inventoryResult.value) ? inventoryResult.value : [];
  const cpadKits = kitResult.status === 'fulfilled' && Array.isArray(kitResult.value) ? kitResult.value : [];
  const kits = [...cpadKits, ...casaKits];
  const products = Object.fromEntries(inventory.filter(item => typeof item.slug === 'string' && typeof item.name === 'string'
    && validNumber(item.unitPrice) && Number.isInteger(item.available) && ['weight','length','width','height'].every(key => validNumber(item[key])))
    .map(item => [item.slug, { sku:item.sku || item.slug, name:item.name, image:item.imageUrl || 'assets/logo-chi-rho.png',
      category:item.category || 'Catálogo CHI RHO', price:Number(item.unitPrice), stock:Math.max(0,item.available),
      weight:Number(item.weight), length:Number(item.length), width:Number(item.width), height:Number(item.height), fragile:item.fragile === true }]));
  const baseProducts = { ...products };
  for (const kit of kits) {
    try {
      const summary = kitSummary(kit, baseProducts);
      products[kit.slug] = { sku:kit.slug, name:kit.name, category:kit.pricing_mode ? 'Kits Casa' : 'Kits CPAD', image:baseProducts[kit.components[0].slug].image,
        price:summary.price, original:summary.original, stock:summary.stock, kitComponents:kit.components,
        description:kit.description };
    } catch { /* Incomplete drafts remain unavailable for checkout. */ }
  }
  return { products, baseProducts, kits };
}
const catalog = await loadShippingCatalog();
export const shippingProducts = Object.freeze(catalog.products);
export const baseShippingProducts = Object.freeze(catalog.baseProducts);
export const shippingKits = catalog.kits;
