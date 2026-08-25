import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN = "https://chi-rho-ecommerce.vercel.app";
const PUBLIC_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS = new Set([SITE_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);

const response = (body: unknown,status=200,origin=SITE_ORIGIN) => new Response(
  status===204?null:JSON.stringify(body),
  {status,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"apikey, content-type",
    "Access-Control-Allow-Methods":"GET, OPTIONS","Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}}
);

Deno.serve(async (request) => {
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!ALLOWED_ORIGINS.has(origin)) return response({error:"Origem não autorizada."},403);
  if(request.method==="OPTIONS") return response({},204,origin);
  if(request.method!=="GET") return response({error:"Método não permitido."},405,origin);
  if(request.headers.get("apikey")!==PUBLIC_KEY) return response({error:"Não autorizado."},401,origin);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key) return response({error:"Estoque indisponível."},503,origin);
  const db=await fetch(`${url}/rest/v1/inventory?select=product_slug,stock_total,stock_reserved,stock_available,updated_at&order=product_slug`,{
    headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(8000)
  });
  if(!db.ok){console.error("Inventory query failed",db.status);return response({error:"Estoque indisponível."},503,origin);}
  const rows=await db.json();
  return response({inventory:rows.map((row:any)=>({slug:row.product_slug,total:row.stock_total,
    reserved:row.stock_reserved,available:row.stock_available,updatedAt:row.updated_at}))},200,origin);
});
