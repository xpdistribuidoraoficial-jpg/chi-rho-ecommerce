const TARGET="https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/mercadopago-webhook";
const PUBLIC_KEY="sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";

export default {
  async fetch(request){
    if(request.method!=="POST") return Response.json({error:"Método não permitido."},{status:405});
    const source=new URL(request.url),target=new URL(TARGET);
    source.searchParams.forEach((value,key)=>target.searchParams.append(key,value));
    const body=await request.text();
    if(body.length>30000) return Response.json({error:"Evento inválido."},{status:413});
    try{
      const forwarded=await fetch(target,{method:"POST",headers:{
        apikey:PUBLIC_KEY,"Content-Type":request.headers.get("content-type")||"application/json",
        "x-signature":request.headers.get("x-signature")||"",
        "x-request-id":request.headers.get("x-request-id")||""
      },body,signal:AbortSignal.timeout(18000)});
      return new Response(await forwarded.text(),{status:forwarded.status,headers:{
        "Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"}});
    }catch{return Response.json({error:"Webhook temporariamente indisponível."},{status:503});}
  }
};
