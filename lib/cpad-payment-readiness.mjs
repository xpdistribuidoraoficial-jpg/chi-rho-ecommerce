import { checkoutEnvironment, SUPABASE_URL, PUBLIC_KEY } from './cpad-database.mjs';

// Never send credentials, account contact details or provider responses to the public health endpoint.
export async function paymentReadiness() {
  const token=process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  const publicKey=process.env.MERCADO_PAGO_PUBLIC_KEY?.trim();
  const testMode=process.env.MERCADO_PAGO_TEST_MODE!=='false';
  const production=checkoutEnvironment()==='production';
  const result={configured:Boolean(token&&publicKey),mode:testMode?'test':'production',
    credentialsValid:false,productionAccount:false,webhookConfigured:false,ready:false};
  if(!result.configured)return result;
  try {
    const [accountResponse,webhookResponse]=await Promise.all([
      fetch('https://api.mercadolibre.com/users/me',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)}),
      fetch(`${SUPABASE_URL}/functions/v1/mercadopago-create-preference`,{headers:{apikey:PUBLIC_KEY},signal:AbortSignal.timeout(8000)})
    ]);
    const account=await accountResponse.json(),webhook=await webhookResponse.json();
    result.credentialsValid=accountResponse.ok&&Boolean(account.id);
    result.productionAccount=result.credentialsValid&&account.site_id==='MLB'
      &&Array.isArray(account.tags)&&!account.tags.includes('test_user')
      &&!token.startsWith('TEST-')&&!publicKey.startsWith('TEST-');
    result.webhookConfigured=webhookResponse.ok&&webhook.available===true&&webhook.mode===result.mode;
    // Account identity is available only to the signed administrative diagnostic.
    if(result.credentialsValid)result.account={id:String(account.id),nickname:String(account.nickname||''),testAccount:account.tags?.includes('test_user')===true};
    result.ready=result.credentialsValid&&result.webhookConfigured
      &&(production?(!testMode&&result.productionAccount):testMode);
  } catch {}
  return result;
}
