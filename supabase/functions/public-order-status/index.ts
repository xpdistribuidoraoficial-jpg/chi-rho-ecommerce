import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://chi-rho-ecommerce.vercel.app";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const VERCEL_PREVIEW_ORIGIN=/^https:\/\/chi-rho-ecommerce(?:-[a-z0-9-]+)?\.vercel\.app$/i;
const isAllowedOrigin=(origin:string)=>ALLOWED_ORIGINS.has(origin)||VERCEL_PREVIEW_ORIGIN.test(origin);
const clean=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const reply=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(status===204?null:JSON.stringify(body),{
  status,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS","Cache-Control":"no-store",
  "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}
});

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!isAllowedOrigin(origin)) return reply({error:"Origem não autorizada."},403);
  if(request.method==="OPTIONS") return reply({},204,origin);
  if(request.method!=="POST") return reply({error:"Método não permitido."},405,origin);
  if(request.headers.get("apikey")!==PUBLIC_KEY) return reply({error:"Não autorizado."},401,origin);
  let body:any; try{body=await request.json();}catch{return reply({error:"Consulta inválida."},400,origin);}
  const code=clean(body?.code,40),token=clean(body?.publicToken,36);
  if(!/^CHR-[A-Z0-9-]+$/.test(code)||!/^[0-9a-f-]{36}$/i.test(token)) return reply({error:"Pedido não encontrado."},404,origin);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key) return reply({error:"Consulta temporariamente indisponível."},503,origin);
  const headers={apikey:key,Authorization:`Bearer ${key}`};
  // Esta rota pública devolve somente estado. Dados pessoais e itens nunca saem do banco
  // sem uma sessão administrativa autenticada.
  const select="code,financial_status,operational_status,reservation_expires_at,updated_at";
  const orderResponse=await fetch(`${url}/rest/v1/orders?code=eq.${encodeURIComponent(code)}&public_token=eq.${encodeURIComponent(token)}&select=${select}&limit=1`,{headers,signal:AbortSignal.timeout(8000)});
  const orders=orderResponse.ok?await orderResponse.json():[];
  if(!orders[0]) return reply({error:"Pedido não encontrado."},404,origin);
  const order=orders[0];
  return reply({order:{code:order.code,financialStatus:order.financial_status,
    operationalStatus:order.operational_status,reservationExpiresAt:order.reservation_expires_at,
    updatedAt:order.updated_at}},200,origin);
});
