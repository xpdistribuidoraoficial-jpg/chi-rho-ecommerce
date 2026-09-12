import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN = "https://chi-rho-ecommerce.vercel.app";
const OFFICIAL_SITE_ORIGIN = "https://www.chirho.com.br";
const PUBLIC_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS = new Set([
  SITE_ORIGIN,
  OFFICIAL_SITE_ORIGIN,
  "https://chirho.com.br",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/chi-rho-ecommerce(?:-[a-z0-9-]+)?\.vercel\.app$/i;

const response = (body: unknown, status = 200, origin = SITE_ORIGIN) => new Response(
  status === 204 ? null : JSON.stringify(body),
  {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "apikey, content-type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin"
    }
  }
);

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || SITE_ORIGIN;
  if (!ALLOWED_ORIGINS.has(origin) && !VERCEL_PREVIEW_ORIGIN.test(origin)) {
    return response({ error: "Origem não autorizada." }, 403);
  }
  if (request.method === "OPTIONS") return response({}, 204, origin);
  if (request.method !== "GET") return response({ error: "Método não permitido." }, 405, origin);
  if (request.headers.get("apikey") !== PUBLIC_KEY) return response({ error: "Não autorizado." }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return response({ error: "Estoque indisponível." }, 503, origin);

  const select = [
    "product_slug",
    "sku",
    "product_name",
    "image_url",
    "unit_price",
    "stock_total",
    "stock_reserved",
    "stock_available",
    "weight_kg",
    "length_cm",
    "height_cm",
    "width_cm",
    "category",
    "is_fragile",
    "updated_at"
  ].join(",");

  const db = await fetch(`${url}/rest/v1/inventory?select=${select}&order=product_slug`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!db.ok) {
    console.error("Inventory query failed", db.status);
    return response({ error: "Estoque indisponível." }, 503, origin);
  }

  const rows = await db.json();
  return response({
    inventory: rows.map((row: any) => ({
      slug: row.product_slug,
      sku: row.sku,
      name: row.product_name,
      imageUrl: row.image_url,
      unitPrice: row.unit_price === null ? null : Number(row.unit_price),
      total: row.stock_total,
      reserved: row.stock_reserved,
      available: row.stock_available,
      weight: row.weight_kg === null ? null : Number(row.weight_kg),
      length: row.length_cm === null ? null : Number(row.length_cm),
      height: row.height_cm === null ? null : Number(row.height_cm),
      width: row.width_cm === null ? null : Number(row.width_cm),
      category: row.category,
      fragile: row.is_fragile === true,
      updatedAt: row.updated_at
    }))
  }, 200, origin);
});
