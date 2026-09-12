const INVENTORY_ENDPOINT = "https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/inventory-status";
const INVENTORY_PUBLIC_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";

let inventory = [];
try {
  const response = await fetch(INVENTORY_ENDPOINT, {
    headers: { apikey: INVENTORY_PUBLIC_KEY },
    signal: AbortSignal.timeout(8000)
  });
  const data = await response.json();
  if (response.ok && Array.isArray(data.inventory)) inventory = data.inventory;
} catch {
  inventory = [];
}

const validNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export const shippingProducts = Object.freeze(Object.fromEntries(
  inventory
    .filter((item) => (
      typeof item?.slug === "string"
      && typeof item?.name === "string"
      && validNumber(item?.unitPrice)
      && Number.isInteger(item?.available)
      && validNumber(item?.weight)
      && validNumber(item?.length)
      && validNumber(item?.width)
      && validNumber(item?.height)
    ))
    .map((item) => [item.slug, Object.freeze({
      sku: item.sku || `CHR-${item.slug.slice(0, 24).toUpperCase()}`,
      name: item.name,
      image: item.imageUrl || "assets/logo-chi-rho.png",
      category: item.category || "Catálogo CHI RHO",
      price: Number(item.unitPrice),
      stock: Math.max(0, item.available),
      weight: Number(item.weight),
      length: Number(item.length),
      width: Number(item.width),
      height: Number(item.height),
      fragile: item.fragile === true
    })])
));
