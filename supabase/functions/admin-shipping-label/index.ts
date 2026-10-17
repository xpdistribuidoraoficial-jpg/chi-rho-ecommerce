import { generateShippingLabel, labelConfiguration, labelCapability } from "../_shared/frenet-label.mjs";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://www.chirho.com.br";
const ROOT_ORIGIN="https://chirho.com.br";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,ROOT_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const VERCEL_PREVIEW_ORIGIN=/^https:\/\/chi-rho-ecommerce-[a-z0-9-]+\.vercel\.app$/i;
const isAllowedOrigin=(origin:string)=>ALLOWED_ORIGINS.has(origin)||VERCEL_PREVIEW_ORIGIN.test(origin);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const response=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{
  "Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-admin-portal",
  "Access-Control-Allow-Methods":"GET, POST, OPTIONS","Cache-Control":"no-store",
  "Content-Type":"application/json; charset=utf-8","Vary":"Origin"}});
const safe=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const digits=(value:unknown)=>String(value||"").replace(/\D/g,"");
const jwtPayload=(authorization:string)=>{try{const part=authorization.split(".")[1];if(!part)return null;const base64=part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"=");return JSON.parse(atob(base64));}catch{return null;}};
const rpc=async(url:string,serviceKey:string,name:string,body:unknown)=>{
  const result=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},
    body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  return {ok:result.ok,status:result.status,data:await result.json().catch(()=>null)};
};

const getAdmin=async(request:Request,url:string,serviceKey:string)=>{
  const authorization=request.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer ")) return null;
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:{apikey:PUBLIC_KEY,Authorization:authorization},signal:AbortSignal.timeout(8000)});
  if(!userResponse.ok) return null;
  const user=await userResponse.json(),payload=jwtPayload(authorization.slice(7));
  const sessionId=safe(payload?.session_id,36);
  if(!uuid.test(String(user?.id||""))||!uuid.test(sessionId)) return null;
  const authorized=await rpc(url,serviceKey,"authorize_admin_session",{target_user_id:user.id,target_session_id:sessionId});
  const record=Array.isArray(authorized.data)?authorized.data[0]:null;
  return authorized.ok&&record?{id:user.id,email:user.email,displayName:record.display_name,role:record.role||"operator"}:null;
};

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!isAllowedOrigin(origin)) return response({error:"Origem não autorizada."},403,SITE_ORIGIN);
  if(request.method==="OPTIONS") return response({},204,origin);
  if(request.method!=="GET"&&request.method!=="POST") return response({error:"Método não permitido."},405,origin);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) return response({error:"Operação temporariamente indisponível."},503,origin);
  const admin=await getAdmin(request,url,serviceKey);
  if(!admin) return response({error:"Acesso administrativo não autorizado."},401,origin);
  const portal=safe(request.headers.get("x-admin-portal"),20);
  const expectedEmail=portal==="paulo"?"xpdistribuidora.oficial@gmail.com":portal==="owner"?"contato.michellopes@gmail.com":"";
  if(!expectedEmail||String(admin.email||"").toLowerCase()!==expectedEmail){
    return response({error:"Este usuário não pertence a este acesso administrativo."},403,origin);
  }

  const config=labelConfiguration(name=>Deno.env.get(name));
  if(request.method==="GET") return response(labelCapability(config),200,origin);
  let body:any;try{body=await request.json();}catch{return response({error:"Ação inválida."},400,origin);}
  const orderId=safe(body?.orderId,36);
  if(!uuid.test(orderId)) return response({error:"Pedido inválido."},400,origin);
  const result=await generateShippingLabel({url,serviceKey,adminId:admin.id,orderId,config});
  return response(result.ok?result:{error:result.message,code:result.code},result.status,origin);
});
