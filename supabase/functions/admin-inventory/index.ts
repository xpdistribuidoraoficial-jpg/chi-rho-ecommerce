import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://www.chirho.com.br";
const ROOT_ORIGIN="https://chirho.com.br";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,ROOT_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const VERCEL_PREVIEW_ORIGIN=/^https:\/\/chi-rho-ecommerce-[a-z0-9-]+\.vercel\.app$/i;
const isAllowedOrigin=(origin:string)=>ALLOWED_ORIGINS.has(origin)||VERCEL_PREVIEW_ORIGIN.test(origin);
const response=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(status===204?null:JSON.stringify(body),{
  status,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"GET, PATCH, OPTIONS","Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}
});
const safe=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jwtPayload=(token:string)=>{try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}};

const getAdmin=async(request:Request,url:string,serviceKey:string)=>{
  const authorization=request.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer ")) return null;
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:{apikey:PUBLIC_KEY,Authorization:authorization},signal:AbortSignal.timeout(8000)});
  if(!userResponse.ok) return null;
  const user=await userResponse.json(),payload=jwtPayload(authorization.slice(7));
  const sessionId=safe(payload?.session_id,36);
  if(!uuid.test(String(user?.id||""))||!uuid.test(sessionId)) return null;
  const check=await fetch(`${url}/rest/v1/rpc/authorize_admin_session`,{method:"POST",headers:{
    apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({target_user_id:user.id,target_session_id:sessionId}),signal:AbortSignal.timeout(8000)});
  const admins=check.ok?await check.json():[];
  return admins[0]?{id:user.id,email:user.email,displayName:admins[0].display_name}:null;
};

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!isAllowedOrigin(origin)) return response({error:"Origem não autorizada."},403);
  if(request.method==="OPTIONS") return response({},204,origin);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) return response({error:"Painel temporariamente indisponível."},503,origin);
  const admin=await getAdmin(request,url,serviceKey);
  if(!admin) return response({error:"Acesso administrativo não autorizado."},401,origin);
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};

  if(request.method==="GET"){
    const result=await fetch(`${url}/rest/v1/inventory?select=product_slug,sku,product_name,image_url,category,unit_price,stock_total,stock_reserved,stock_available,updated_at&order=category.asc,product_name.asc`,{headers,signal:AbortSignal.timeout(10000)});
    const items=result.ok?await result.json():[];
    if(!result.ok){console.error("Admin inventory list failed",result.status);return response({error:"Não foi possível carregar o estoque."},503,origin);}
    return response({admin,items},200,origin);
  }

  if(request.method==="PATCH"){
    let body:any;try{body=await request.json();}catch{return response({error:"Alteração inválida."},400,origin);}
    const slug=safe(body?.productSlug,180);
    const stockTotal=Number(body?.stockTotal);
    if(!slug||!Number.isInteger(stockTotal)||stockTotal<0||stockTotal>999999) return response({error:"Informe uma quantidade de estoque válida."},400,origin);

    const currentResponse=await fetch(`${url}/rest/v1/inventory?product_slug=eq.${encodeURIComponent(slug)}&select=product_slug,stock_total,stock_reserved&limit=1`,{headers,signal:AbortSignal.timeout(8000)});
    const currentRows=currentResponse.ok?await currentResponse.json():[];
    const current=currentRows[0];
    if(!current) return response({error:"Produto não encontrado no estoque."},404,origin);
    if(stockTotal<Number(current.stock_reserved||0)) return response({error:`Há ${current.stock_reserved} unidade(s) reservada(s). O estoque total não pode ficar abaixo desse valor.`},409,origin);

    const update=await fetch(`${url}/rest/v1/inventory?product_slug=eq.${encodeURIComponent(slug)}`,{
      method:"PATCH",headers:{...headers,Prefer:"return=representation"},
      body:JSON.stringify({stock_total:stockTotal,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(8000)
    });
    const rows=await update.json().catch(()=>[]);
    if(!update.ok){console.error("Admin inventory update failed",update.status);return response({error:"Não foi possível atualizar o estoque."},503,origin);}
    return response({item:rows[0]||null},200,origin);
  }

  return response({error:"Método não permitido."},405,origin);
});