import { signedAction, verifyPaymentDiagnostic } from '../../lib/cpad-database.mjs';
import { paymentReadiness } from '../../lib/cpad-payment-readiness.mjs';
const output=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});

export default {async fetch(request) {
  if(request.method!=='POST')return output({error:'Método não permitido.'},405);
  const payloadText=await request.text();
  if(!verifyPaymentDiagnostic(payloadText,request.headers.get('x-cpad-signature')))
    return output({error:'Não autorizado.'},401);
  let signing={available:false};
  try {signing=await signedAction({action:'health'});} catch {}
  return output({signing,payment:await paymentReadiness()});
}};
