const EMAIL_FROM = "CHI RHO <acesso@chirho.com.br>";
const EMAIL_REPLY_TO = "XPdistribuidora.oficial@gmail.com";
const SITE_URL = "https://www.chirho.com.br";
const PICKUP_ADDRESS_TEXT = "Rua Maria do Carmo, 202 - Penha Circular - Rio de Janeiro/RJ - CEP 21210-250";
const PICKUP_WHATSAPP = "(21) 99624-1374";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const moneyBr = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const emailShell = (title: string, intro: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#1d1d1f">
<div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #e8e8e8">
<div style="font-size:13px;letter-spacing:1.4px;font-weight:700;color:#6b6b6b">CHI RHO • CASA • FAMÍLIA • FÉ</div>
<h1 style="font-size:25px;margin:12px 0 10px">${escapeHtml(title)}</h1>
<p style="font-size:16px;line-height:1.55;margin:0 0 20px">${escapeHtml(intro)}</p>
${body}
<div style="margin-top:26px;padding-top:18px;border-top:1px solid #ececec;font-size:13px;color:#6b6b6b">
Acompanhe seus pedidos em <a href="${SITE_URL}/minhas-compras.html" style="color:#1d1d1f">Minhas Compras</a>.
</div></div></div></body></html>`;

export const sendOrderEmail = async (input: {
  event: "order_created"|"payment_confirmed"|"preparing"|"shipped"|"pickup_ready"|"pickup_completed";
  orderId: string; orderCode: string; to: string; customerName?: string; total?: number;
  trackingCode?: string|null; trackingUrl?: string|null; isPickup?: boolean;
}) => {
  const apiKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("RESEND_SMTP_PASSWORD") || Deno.env.get("SMTP_PASSWORD") || Deno.env.get("SMTP_PASS");
  if (!apiKey) { console.warn("Transactional email skipped: Resend credential not available"); return { sent:false, reason:"missing_key" }; }
  const firstName = String(input.customerName || "").trim().split(/\s+/)[0] || "Olá";
  const code = escapeHtml(input.orderCode);
  let subject="", title="", intro="", body="";
  if(input.event==="order_created"){
    subject=`Recebemos seu pedido ${input.orderCode} na CHI RHO`; title="Pedido recebido";
    intro=`${firstName}, recebemos seu pedido ${input.orderCode} com sucesso.`;
    body=`<p style="line-height:1.55">O pagamento ainda precisa ser concluído para confirmarmos o pedido.</p>${Number.isFinite(input.total)?`<p><strong>Total: ${moneyBr(input.total)}</strong></p>`:""}`;
  } else if(input.event==="payment_confirmed"){
    subject=`Pagamento confirmado — Pedido ${input.orderCode}`; title="Pagamento confirmado";
    intro=`${firstName}, o pagamento do pedido ${input.orderCode} foi aprovado.`;
    body=`<p style="line-height:1.55">Agora vamos preparar seus produtos para a próxima etapa.</p>`;
  } else if(input.event==="preparing"){
    subject=`Seu pedido ${input.orderCode} está sendo preparado`; title="Pedido em preparação";
    intro=`${firstName}, já iniciamos a separação do seu pedido ${input.orderCode}.`;
    body=`<p style="line-height:1.55">Avisaremos assim que houver uma nova atualização.</p>`;
  } else if(input.event==="shipped"){
    subject=`Seu pedido ${input.orderCode} está a caminho`; title="Pedido enviado";
    intro=`${firstName}, seu pedido ${input.orderCode} foi enviado.`;
    body=`${input.trackingCode?`<p><strong>Código de rastreio:</strong> ${escapeHtml(input.trackingCode)}</p>`:""}${input.trackingUrl?`<p><a href="${escapeHtml(input.trackingUrl)}">Acompanhar entrega</a></p>`:""}`;
  } else if(input.event==="pickup_ready"){
    subject=`Seu pedido ${input.orderCode} já pode ser retirado`; title="Pedido disponível para retirada";
    intro=`${firstName}, seu pedido ${input.orderCode} está pronto para retirada.`;
    body=`<div style="background:#f7f7f7;border-radius:12px;padding:16px;line-height:1.55"><strong>Local de retirada</strong><br>${PICKUP_ADDRESS_TEXT}<br><br><strong>WhatsApp do Paulo:</strong> ${PICKUP_WHATSAPP}</div><p style="line-height:1.55">Se precisar alinhar a retirada, entre em contato pelo WhatsApp antes de se deslocar.</p>`;
  } else {
    subject=`Retirada concluída — Pedido ${input.orderCode}`; title="Pedido retirado";
    intro=`${firstName}, registramos a retirada do pedido ${input.orderCode}.`;
    body=`<p style="line-height:1.55">Obrigado por comprar com a CHI RHO. Esperamos receber você novamente em breve.</p>`;
  }
  const html=emailShell(title,intro,body);
  const text=[title,intro,input.event==="pickup_ready"?`Local: ${PICKUP_ADDRESS_TEXT}. WhatsApp do Paulo: ${PICKUP_WHATSAPP}.`:"",input.trackingCode?`Rastreio: ${input.trackingCode}`:"",`Minhas Compras: ${SITE_URL}/minhas-compras.html`].filter(Boolean).join("\n\n");
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
    Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":`chi-rho/${input.event}/${input.orderId}`
  },body:JSON.stringify({from:EMAIL_FROM,to:[input.to],reply_to:[EMAIL_REPLY_TO],subject,html,text}),signal:AbortSignal.timeout(12000)});
  if(!response.ok){console.error("Transactional email failed",input.event,response.status);return {sent:false,status:response.status};}
  const data=await response.json().catch(()=>({}));
  return {sent:true,id:data?.id||null};
};

