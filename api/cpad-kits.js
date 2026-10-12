import { SUPABASE_URL, PUBLIC_KEY, signedAction, sameOrigin } from '../lib/cpad-database.mjs';
import { cpadProductSlugs } from '../data/cpad-products.mjs';
const output=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default { async fetch(request) {
  if(!sameOrigin(request))return output({error:'Origem não autorizada.'},403);
  const headers={apikey:PUBLIC_KEY,'Content-Type':'application/json'};
  try {
    if(request.method==='GET') {
      const [kitResponse, inventoryResponse]=await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/cpad_kits?select=slug,name,description,active,discount_percent,components&order=slug`,{headers,signal:AbortSignal.timeout(10000)}),
        fetch(`${SUPABASE_URL}/functions/v1/inventory-status`,{headers,signal:AbortSignal.timeout(10000)})
      ]);
      if(!kitResponse.ok||!inventoryResponse.ok)throw new Error('DATABASE_UNAVAILABLE');
      const inventory=await inventoryResponse.json();
      let checkoutReady=false;
      try { const health=await signedAction({action:'health'}); checkoutReady=health?.available===true; } catch {}
      return output({kits:await kitResponse.json(),checkoutReady,products:inventory.inventory.filter(item=>cpadProductSlugs.includes(item.slug))
        .map(item=>({product_slug:item.slug,product_name:item.name}))});
    }
    if(request.method==='PATCH') {
      const auth=request.headers.get('authorization');
      if(!auth?.startsWith('Bearer '))return output({error:'Acesso administrativo não autorizado.'},401);
      const raw=await request.text();if(raw.length>12000)return output({error:'Kit inválido.'},413);
      const body=JSON.parse(raw);
      const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/manage_cpad_kit`,{method:'POST',
        headers:{...headers,Authorization:auth},body:JSON.stringify({target_slug:body.slug,enabled:body.active,components:body.components,portal:request.headers.get('x-admin-portal')}),signal:AbortSignal.timeout(10000)});
      const data=await response.json();
      return response.ok?output({kit:data}):output({error:'Confira a composição e a autorização administrativa do kit.'},response.status);
    }
    return output({error:'Método não permitido.'},405);
  } catch {return output({error:'Não foi possível atualizar os kits.'},503);}
} };
