import { activeProducts } from '../seo/catalog.mjs';
import { renderProductFeed } from '../lib/product-feed.mjs';
import { PUBLIC_KEY, SUPABASE_URL } from '../lib/cpad-database.mjs';

export default { async fetch(request) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método não permitido.', { status: 405, headers: { Allow: 'GET, HEAD' } });
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/inventory-status`, { headers: { apikey: PUBLIC_KEY }, signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.inventory) || !data.inventory.length) throw new Error('INVENTORY_UNAVAILABLE');
    const body = renderProductFeed(activeProducts, data.inventory);
    return new Response(request.method === 'HEAD' ? null : body, { headers: {
      'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60', 'X-Content-Type-Options': 'nosniff'
    } });
  } catch {
    // A temporary outage must never publish made-up prices or an empty catalog.
    return new Response('Catálogo temporariamente indisponível.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
} };
