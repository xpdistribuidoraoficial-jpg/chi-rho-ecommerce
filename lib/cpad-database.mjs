import { createHmac } from 'node:crypto';
export const SUPABASE_URL='https://sailabcmcqdzrqhqztqs.supabase.co';
export const PUBLIC_KEY='sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
export async function signedAction(payload) {
  const secret=process.env.CPAD_CHECKOUT_SIGNING_SECRET;
  if(!secret)throw new Error('CHECKOUT_NOT_CONFIGURED');
  const payload_text=JSON.stringify({...payload,signed_at:Date.now()});
  const signature=createHmac('sha256',secret).update(payload_text).digest('hex');
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/cpad_signed_action`,{method:'POST',
    headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({payload_text,signature}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.message || 'DATABASE_ERROR');
  return data;
}
export function sameOrigin(request) {
  const origin=request.headers.get('origin');
  try{return !origin || new URL(origin).host===new URL(request.url).host;}catch{return false;}
}
