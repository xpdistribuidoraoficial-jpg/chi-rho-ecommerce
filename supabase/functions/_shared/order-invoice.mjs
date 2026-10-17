const digits=value=>String(value||'').replace(/\D/g,'');
const cents=value=>Math.round(Number(value)*100);
const single=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:null;
export function validInvoiceKey(value){
  const key=String(value||'');if(!/^\d{44}$/.test(key)||key.slice(20,22)!=='55')return false;
  let sum=0,weight=2;for(let i=42;i>=0;i--){sum+=Number(key[i])*weight;weight=weight===9?2:weight+1;}
  const remainder=sum%11,check=remainder===0||remainder===1?0:11-remainder;
  return Number(key[43])===check;
}
export function readOrderInvoice(xml,order,parse){
  if(typeof xml!=='string'||xml.length>2*1024*1024||/<!\s*(DOCTYPE|ENTITY)/i.test(xml))throw new Error('INVOICE_XML_INVALID');
  let doc;try{doc=parse(xml);}catch{throw new Error('INVOICE_XML_INVALID');}
  const root=single(doc?.nfeProc),nfe=single(root?.NFe),info=single(nfe?.infNFe),protocol=single(single(root?.protNFe)?.infProt);
  const ide=single(info?.ide),issuer=single(info?.emit),recipient=single(info?.dest),totals=single(single(info?.total)?.ICMSTot);
  if(!root||!info||!protocol||!ide||!issuer||!recipient||!totals)throw new Error('INVOICE_XML_INVALID');
  const key=String(protocol.chNFe||''),id=String(info['@_Id']||'');
  if(!validInvoiceKey(key)||id!==`NFe${key}`||String(ide.mod)!=='55'
    ||key.slice(6,20)!==digits(issuer.CNPJ)||String(Number(key.slice(22,25)))!==String(Number(ide.serie))
    ||String(Number(key.slice(25,34)))!==String(Number(ide.nNF)))throw new Error('INVOICE_KEY_INVALID');
  if(String(ide.tpAmb)!=='1'||String(protocol.tpAmb)!=='1'||!['100','150'].includes(String(protocol.cStat))
    ||!/^\d{15}$/.test(String(protocol.nProt||'')))throw new Error('INVOICE_NOT_AUTHORIZED');
  if(digits(issuer.CNPJ)!=='42300391000100')throw new Error('INVOICE_ISSUER_MISMATCH');
  const recipientDocument=digits(recipient.CPF||recipient.CNPJ);
  if(!recipientDocument||recipientDocument!==digits(order.tax_id))throw new Error('INVOICE_RECIPIENT_MISMATCH');
  if(!/^\d+\.\d{2}$/.test(String(totals.vNF))||!/^\d+\.\d{2}$/.test(String(totals.vFrete||'0.00')))throw new Error('INVOICE_TOTAL_MISMATCH');
  const value=Number(totals.vNF),freight=Number(totals.vFrete||0);
  if(!Number.isFinite(value)||value<=0||cents(value)!==cents(order.grand_total)||!Number.isFinite(freight)
    ||cents(freight)!==cents(order.shipping_price))throw new Error('INVOICE_TOTAL_MISMATCH');
  const issuedAt=String(ide.dhEmi||ide.dEmi||'');
  if(!issuedAt||!Number.isFinite(Date.parse(issuedAt))||Date.parse(issuedAt)>Date.now()+5*60*1000)throw new Error('INVOICE_DATE_INVALID');
  return {key,number:String(ide.nNF),series:String(ide.serie),issuedAt,value,freight,
    issuerDocument:digits(issuer.CNPJ),recipientDocument,protocol:String(protocol.nProt),statusCode:String(protocol.cStat),
    source:'contador',environment:'production'};
}
export const invoiceMessage=code=>({
  INVOICE_XML_INVALID:'Envie o XML processado da NF-e, com o protocolo de autorização recebido pelo contador.',
  INVOICE_KEY_INVALID:'A chave, o modelo ou os dados do XML da NF-e não conferem.',
  INVOICE_NOT_AUTHORIZED:'O XML deve conter protocolo de autorização de NF-e em produção.',
  INVOICE_ISSUER_MISMATCH:'O CNPJ emissor da NF-e precisa ser o da CHI RHO.',
  INVOICE_RECIPIENT_MISMATCH:'O CPF/CNPJ da nota difere do destinatário do pedido.',
  INVOICE_TOTAL_MISMATCH:'O total ou o frete da nota difere do pedido. Confira com o contador.',
  INVOICE_DATE_INVALID:'A data de emissão da nota precisa ser conferida.',
  INVOICE_ALREADY_REGISTERED:'Já existe nota vinculada. Confira a nota registrada antes de qualquer substituição.',
  LABEL_IN_PROGRESS:'A etiqueta está em processamento; os documentos não podem ser alterados.',
  INVOICE_DOCUMENT_INVALID:'O DANFE precisa ser um PDF de até 5 MB.',
  ORDER_NOT_PAID:'Aguarde o pagamento antes de vincular a nota.',
  INVOICE_SAVE_FAILED:'Não foi possível registrar os documentos. Tente novamente sem emitir outra nota.'
}[code]||'Não foi possível registrar a nota. Confira o pedido e os documentos com o contador.');
