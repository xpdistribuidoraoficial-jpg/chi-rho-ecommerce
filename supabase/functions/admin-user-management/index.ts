import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN="https://www.chirho.com.br";
const ROOT_ORIGIN="https://chirho.com.br";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS=new Set([SITE_ORIGIN,ROOT_ORIGIN,"http://localhost:3000","http://127.0.0.1:3000"]);
const VERCEL_PREVIEW_ORIGIN=/^https:\/\/chi-rho-ecommerce-[a-z0-9-]+\.vercel\.app$/i;
const isAllowedOrigin=(origin:string)=>ALLOWED_ORIGINS.has(origin)||VERCEL_PREVIEW_ORIGIN.test(origin);
const response=(body:unknown,status=200,origin=SITE_ORIGIN)=>new Response(status===204?null:JSON.stringify(body),{
  status,headers:{
    "Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"GET, POST, PATCH, OPTIONS",
    "Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8",
    "Vary":"Origin"
  }
});
const safe=(value:unknown,max:number)=>String(value||"").trim().slice(0,max);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const jwtPayload=(token:string)=>{try{return JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}};

const getOwner=async(request:Request,url:string,serviceKey:string)=>{
  const authorization=request.headers.get("authorization")||"";
  if(!authorization.startsWith("Bearer ")) return null;
  const userResponse=await fetch(`${url}/auth/v1/user`,{headers:{apikey:PUBLIC_KEY,Authorization:authorization},signal:AbortSignal.timeout(8000)});
  if(!userResponse.ok) return null;
  const user=await userResponse.json(),payload=jwtPayload(authorization.slice(7));
  const sessionId=safe(payload?.session_id,36);
  if(!uuid.test(String(user?.id||""))||!uuid.test(sessionId)) return null;
  const check=await fetch(`${url}/rest/v1/rpc/authorize_admin_session`,{
    method:"POST",
    headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({target_user_id:user.id,target_session_id:sessionId}),
    signal:AbortSignal.timeout(8000)
  });
  const rows=check.ok?await check.json():[];
  const record=rows[0];
  if(!record||record.role!=="owner") return null;
  return {id:user.id,email:user.email,displayName:record.display_name,role:record.role};
};

Deno.serve(async(request)=>{
  const origin=request.headers.get("origin")||SITE_ORIGIN;
  if(!isAllowedOrigin(origin)) return response({error:"Origem não autorizada."},403,origin);
  if(request.method==="OPTIONS") return response({},204,origin);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey) return response({error:"Gestão de usuários indisponível."},503,origin);
  const owner=await getOwner(request,url,serviceKey);
  if(!owner) return response({error:"Somente o proprietário pode gerenciar usuários administrativos."},403,origin);
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};

  if(request.method==="GET"){
    const adminsResponse=await fetch(`${url}/rest/v1/admin_users?select=user_id,display_name,active,role,created_at,updated_at&order=created_at.asc`,{headers,signal:AbortSignal.timeout(8000)});
    const admins=adminsResponse.ok?await adminsResponse.json():[];
    const usersResponse=await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`,{headers,signal:AbortSignal.timeout(10000)});
    const userData=usersResponse.ok?await usersResponse.json():{};
    const users=Array.isArray(userData?.users)?userData.users:[];
    const emailById=new Map(users.map((user:any)=>[user.id,user.email||""]));
    return response({
      owner,
      users:admins.map((admin:any)=>({
        ...admin,
        email:emailById.get(admin.user_id)||""
      }))
    },200,origin);
  }

  if(request.method==="POST"){
    let body:any;try{body=await request.json();}catch{return response({error:"Dados inválidos."},400,origin);}
    const email=safe(body?.email,254).toLowerCase();
    const displayName=safe(body?.displayName,120);
    if(!emailPattern.test(email)||displayName.length<2) return response({error:"Informe nome e e-mail válidos."},400,origin);

    const inviteResponse=await fetch(`${url}/auth/v1/invite`,{
      method:"POST",headers,
      body:JSON.stringify({
        email,
        data:{display_name:displayName,admin_role:"operator"},
        redirect_to:`${SITE_ORIGIN}/xpdistribuidora.html`
      }),
      signal:AbortSignal.timeout(10000)
    });
    const invited=await inviteResponse.json().catch(()=>({}));
    if(!inviteResponse.ok){
      const message=String(invited?.msg||invited?.message||"");
      if(/already|registered|exists/i.test(message)) return response({error:"Este e-mail já possui uma conta. Use outro e-mail ou solicite a vinculação da conta existente."},409,origin);
      return response({error:"Não foi possível enviar o convite administrativo."},400,origin);
    }
    const userId=String(invited?.id||invited?.user?.id||"");
    if(!uuid.test(userId)) return response({error:"O convite foi enviado, mas não foi possível concluir o vínculo administrativo."},503,origin);

    const insert=await fetch(`${url}/rest/v1/admin_users`,{
      method:"POST",headers:{...headers,Prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify({user_id:userId,display_name:displayName,active:true,role:"operator",updated_at:new Date().toISOString()}),
      signal:AbortSignal.timeout(8000)
    });
    if(!insert.ok) return response({error:"O convite foi enviado, mas o perfil administrativo não pôde ser registrado."},503,origin);

    return response({invited:true,email,displayName,role:"operator"},201,origin);
  }

  if(request.method==="PATCH"){
    let body:any;try{body=await request.json();}catch{return response({error:"Dados inválidos."},400,origin);}
    const userId=safe(body?.userId,36);
    const active=body?.active;
    if(!uuid.test(userId)||typeof active!=="boolean") return response({error:"Alteração inválida."},400,origin);
    if(userId===owner.id&&!active) return response({error:"O proprietário não pode desativar o próprio acesso."},409,origin);

    const targetResponse=await fetch(`${url}/rest/v1/admin_users?user_id=eq.${userId}&select=user_id,role&limit=1`,{headers,signal:AbortSignal.timeout(8000)});
    const targets=targetResponse.ok?await targetResponse.json():[];
    if(!targets[0]) return response({error:"Usuário administrativo não encontrado."},404,origin);
    if(targets[0].role==="owner") return response({error:"O acesso do proprietário não pode ser alterado por esta tela."},409,origin);

    const update=await fetch(`${url}/rest/v1/admin_users?user_id=eq.${userId}`,{
      method:"PATCH",headers:{...headers,Prefer:"return=representation"},
      body:JSON.stringify({active,updated_at:new Date().toISOString()}),
      signal:AbortSignal.timeout(8000)
    });
    const rows=update.ok?await update.json():[];
    if(!update.ok) return response({error:"Não foi possível alterar o acesso."},503,origin);
    return response({user:rows[0]||null},200,origin);
  }

  return response({error:"Método não permitido."},405,origin);
});