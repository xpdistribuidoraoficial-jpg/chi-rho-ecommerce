const TARGET="https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/mercadopago-create-preference";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";

const output=(body,status)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});

export default {
  async fetch(request){
    if(!["GET","POST"].includes(request.method)) return output({error:"Método não permitido."},405);
    const requestUrl=new URL(request.url),origin=request.headers.get("origin");
    if(origin){try{if(new URL(origin).host!==requestUrl.host)return output({error:"Origem não autorizada."},403);}catch{return output({error:"Origem não autorizada."},403);}}
    let body;
    if(request.method==="POST"){
      body=await request.text();
      if(body.length>5000)return output({error:"Pedido inválido."},413);
    }
    try{
      const response=await fetch(TARGET,{method:request.method,headers:{apikey:PUBLIC_KEY,"Content-Type":"application/json",Origin:origin||"https://chi-rho-ecommerce.vercel.app"},
        body,signal:AbortSignal.timeout(18000)});
      return new Response(await response.text(),{status:response.status,headers:{"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"}});
    }catch{return output({error:"Pagamento temporariamente indisponível."},503);}
  }
};
