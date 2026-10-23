import { signedAction, sameOrigin, checkoutEnvironment } from '../../lib/cpad-database.mjs';
import { paymentItems, cents } from '../../lib/kit-pricing.mjs';
import { paymentReadiness } from '../../lib/cpad-payment-readiness.mjs';
const output=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default { async fetch(request) {
  if(!sameOrigin(request))return output({error:'Origem não autorizada.'},403);
  const token=process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim(),publicKey=process.env.MERCADO_PAGO_PUBLIC_KEY?.trim();
  const testMode=process.env.MERCADO_PAGO_TEST_MODE!=='false';
  const available=Boolean(token&&publicKey&&process.env.CPAD_CHECKOUT_SIGNING_SECRET);
  if(request.method==='GET') {
    let verified=false;
    if(available) try { const health=await signedAction({action:'health'}); verified=health?.available===true; } catch {}
    const readiness=available&&verified?await paymentReadiness():{ready:false};
    return output({available:available&&verified&&readiness.ready,provider:'mercado_pago',mode:testMode?'test':'production'});
  }
  if(request.method!=='POST')return output({error:'Método não permitido.'},405);
  if(!available)return output({error:'Pagamento dos kits em configuração neste ambiente.'},503);
  if(!(await paymentReadiness()).ready)return output({error:'Pagamento dos kits aguardando validação do ambiente e das credenciais.'},503);
  try {
    const raw=await request.text();if(raw.length>5000)return output({error:'Pedido inválido.'},413);
    const body=JSON.parse(raw),code=String(body.code||''),public_token=String(body.publicToken||'');
    if(!/^CHR-[A-Z0-9-]{6,32}$/i.test(code)||!/^[0-9a-f-]{36}$/i.test(public_token))return output({error:'Pedido inválido.'},400);
    const data=await signedAction({action:'payment_read',code,public_token,test_mode:testMode}),{order,items}=data;
    const providerItems=paymentItems(items,Number(order.discount));
    const providerTotal=providerItems.reduce((sum,item)=>sum+cents(item.unit_price)*item.quantity,0)+cents(order.shipping_price);
    if(providerTotal!==cents(order.grand_total))throw new Error('ORDER_TOTAL_MISMATCH');
    if (order.payment_method === 'pix') {
      const pixUrlPattern = /^https:\/\/www\.mercadopago\.com\.br\/(?:sandbox\/)?payments\/\d+\/ticket(?:\?|$)/;
      if (order.payment_external_id && pixUrlPattern.test(order.payment_preference_url || ''))
        return output({paymentUrl:order.payment_preference_url,paymentId:order.payment_external_id,reused:true});
      if (new Date(order.reservation_expires_at).getTime() - Date.now() < 31 * 60 * 1000)
        return output({error:'O prazo para gerar o Pix deste pedido terminou. Volte ao carrinho e refaça a compra.'},409);
      const taxId = String(order.tax_id || '').replace(/\D/g, '');
      const names = String(order.customer_name || '').trim().split(/\s+/);
      const pixPayload = {transaction_amount:Number(order.grand_total),description:`Pedido ${order.code} — CHI RHO`,
        payment_method_id:'pix',external_reference:order.code,
        payer:{email:order.customer_email,first_name:names[0],last_name:names.slice(1).join(' ') || names[0],
          identification:{type:taxId.length === 14 ? 'CNPJ' : 'CPF',number:taxId}},
        notification_url:'https://www.chirho.com.br/api/mercadopago-webhook?source_news=webhooks',
        date_of_expiration:order.reservation_expires_at,metadata:{order_id:order.id,order_code:order.code}};
      const pixResponse = await fetch('https://api.mercadopago.com/v1/payments',{method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-Idempotency-Key':`${order.id}-pix`},
        body:JSON.stringify(pixPayload),signal:AbortSignal.timeout(15000)});
      const pix = await pixResponse.json();
      const paymentUrl = pix.point_of_interaction?.transaction_data?.ticket_url;
      if (!pixResponse.ok || !/^\d+$/.test(String(pix.id || '')) || pix.payment_method_id !== 'pix'
        || cents(pix.transaction_amount) !== cents(order.grand_total) || !pixUrlPattern.test(paymentUrl || ''))
        throw new Error('PIX_UNAVAILABLE');
      await signedAction({action:'payment_save',code,public_token,payment_id:String(pix.id),payment_url:paymentUrl});
      return output({paymentUrl,paymentId:String(pix.id),reused:false},201);
    }
    const pattern=testMode?/^https:\/\/sandbox\.mercadopago\.com\.br\//:/^https:\/\/www\.mercadopago\.com\.br\//;
    if(order.payment_preference_id&&pattern.test(order.payment_preference_url||''))return output({paymentUrl:order.payment_preference_url,preferenceId:order.payment_preference_id,reused:true});
    const origin=checkoutEnvironment()==='production'?'https://www.chirho.com.br':new URL(request.url).origin;
    const payload={items:providerItems,shipments:{cost:Number(order.shipping_price)},external_reference:order.code,
      payer:testMode?undefined:{name:order.customer_name,email:order.customer_email},
      back_urls:Object.fromEntries([['success','pagamento-sucesso.html'],['pending','pagamento-pendente.html'],['failure','pagamento-falhou.html']]
        .map(([key,page])=>[key,`${origin}/${page}?order=${encodeURIComponent(order.code)}`])),
      notification_url:'https://www.chirho.com.br/api/mercadopago-webhook?source_news=webhooks',
      auto_return:'approved',expires:true,expiration_date_to:order.reservation_expires_at,
      ...(order.payment_method === 'card' ? {payment_methods:{installments:12,
        excluded_payment_types:[{id:'bank_transfer'},{id:'ticket'},{id:'atm'}]}} : {}),
      metadata:{order_id:order.id,order_code:order.code}};
    const result=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-Idempotency-Key':order.id},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
    const preference=await result.json();if(!result.ok||!preference.id)throw new Error('PAYMENT_UNAVAILABLE');
    const paymentUrl=testMode?preference.sandbox_init_point:preference.init_point;
    if(!pattern.test(paymentUrl||''))throw new Error('PAYMENT_URL_INVALID');
    await signedAction({action:'payment_save',code,public_token,preference_id:String(preference.id),payment_url:paymentUrl});
    return output({paymentUrl,preferenceId:String(preference.id),reused:false},201);
  } catch {return output({error:'Não foi possível iniciar o pagamento. O pedido permanece sem confirmação de pagamento.'},503);}
} };
