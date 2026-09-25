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
const jwtPayload=(token:string)=>{try{const part=token.split(".")[1];if(!part)return null;const base64=part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"=");return JSON.parse(atob(base64));}catch{return null;}};

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
  return admins[0]?{id:user.id,email:user.email,displayName:admins[0].display_name,role:admins[0].role||"operator"}:null;
};

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!isAllowedOrigin(origin)) return response({error:"Origem não autorizada."},403,origin);
  if(request.method==="OPTIONS") return response({},204,origin);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) return response({error:"Painel temporariamente indisponível."},503,origin);
  const admin=await getAdmin(request,url,serviceKey);
  if(!admin) return response({error:"Acesso administrativo não autorizado."},401,origin);
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};
  const requestUrl=new URL(request.url);

  if(request.method==="GET"&&requestUrl.searchParams.get("action")==="history"){
    const slug=safe(requestUrl.searchParams.get("product"),180);
    if(!slug) return response({error:"Produto inválido."},400,origin);
    const movementResponse=await fetch(`${url}/rest/v1/inventory_movements?product_slug=eq.${encodeURIComponent(slug)}&select=id,product_slug,movement_type,quantity_change,previous_stock_total,new_stock_total,reason,actor_user_id,created_at&order=created_at.desc&limit=100`,{headers,signal:AbortSignal.timeout(10000)});
    const movements=movementResponse.ok?await movementResponse.json():[];
    if(!movementResponse.ok) return response({error:"Não foi possível carregar o histórico."},503,origin);

    const actorIds=[...new Set(movements.map((item:any)=>item.actor_user_id).filter((id:any)=>uuid.test(String(id))))];
    let actorNames=new Map<string,string>();
    if(actorIds.length){
      const actorResponse=await fetch(`${url}/rest/v1/admin_users?user_id=in.(${actorIds.join(",")})&select=user_id,display_name`,{headers,signal:AbortSignal.timeout(8000)});
      const actors=actorResponse.ok?await actorResponse.json():[];
      actorNames=new Map(actors.map((item:any)=>[item.user_id,item.display_name||"Administrador"]));
    }
    return response({movements:movements.map((item:any)=>({...item,actor_name:item.actor_user_id?(actorNames.get(item.actor_user_id)||"Administrador"):"Sistema"}))},200,origin);
  }

  if(request.method==="GET"){
    const result=await fetch(`${url}/rest/v1/inventory?select=product_slug,sku,product_name,image_url,category,unit_price,stock_total,stock_reserved,stock_available,updated_at&order=category.asc,product_name.asc`,{headers,signal:AbortSignal.timeout(10000)});
    const items=result.ok?await result.json():[];
    if(!result.ok){console.error("Admin inventory list failed",result.status);return response({error:"Não foi possível carregar o estoque."},503,origin);}
    return response({admin,items},200,origin);
  }

  if(request.method==="PATCH"){
    let body:any;try{body=await request.json();}catch{return response({error:"Alteração inválida."},400,origin);}
    const slug=safe(body?.productSlug,180);
    const quantityDelta=Number(body?.quantityDelta);
    const reason=safe(body?.reason,240);
    if(!slug||!Number.isInteger(quantityDelta)||quantityDelta===0||Math.abs(quantityDelta)>999999){
      return response({error:"Informe uma quantidade válida para entrada ou saída."},400,origin);
    }
    if(!reason) return response({error:"Informe o motivo da movimentação."},400,origin);

    const rpc=await fetch(`${url}/rest/v1/rpc/admin_adjust_inventory`,{
      method:"POST",headers,
      body:JSON.stringify({
        target_product_slug:slug,
        quantity_delta:quantityDelta,
        movement_reason:reason,
        actor_user_id:admin.id
      }),
      signal:AbortSignal.timeout(10000)
    });
    const data=await rpc.json().catch(()=>[]);
    if(!rpc.ok){
      const message=String(data?.message||"");
      if(message.includes("NEGATIVE_STOCK")) return response({error:"A saída informada deixaria o estoque negativo."},409,origin);
      if(message.includes("BELOW_RESERVED_STOCK")) return response({error:"A saída informada deixaria o estoque abaixo da quantidade reservada em pedidos."},409,origin);
      if(message.includes("PRODUCT_NOT_FOUND")) return response({error:"Produto não encontrado no estoque."},404,origin);
      console.error("Admin inventory movement failed",rpc.status,data?.code||"unknown");
      return response({error:"Não foi possível registrar a movimentação."},503,origin);
    }

    const itemResponse=await fetch(`${url}/rest/v1/inventory?product_slug=eq.${encodeURIComponent(slug)}&select=product_slug,sku,product_name,image_url,category,unit_price,stock_total,stock_reserved,stock_available,updated_at&limit=1`,{headers,signal:AbortSignal.timeout(8000)});
    const rows=itemResponse.ok?await itemResponse.json():[];
    return response({item:rows[0]||null,movement:data?.[0]||null},200,origin);
  }

  return response({error:"Método não permitido."},405,origin);
});