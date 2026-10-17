import {readOrderInvoice,invoiceMessage} from './order-invoice.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bucket='order-invoices';
const encoded=path=>path.split('/').map(encodeURIComponent).join('/');
const result=(body,status=200)=>({body,status});

// Called only after the portal, live admin session and origin have been authorized.
export async function invoiceDocuments({request,url,serviceKey,adminId,parse,fetcher=fetch}){
  const params=new URL(request.url).searchParams;
  const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'};
  const readOrder=async id=>{
    const response=await fetcher(`${url}/rest/v1/orders?id=eq.${id}&select=id,tax_id,grand_total,shipping_price,financial_status,operational_status,label_status,shipping_label_id,fiscal_invoice&limit=1`,{headers,signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error('INVOICE_SAVE_FAILED');
    return (await response.json())[0];
  };
  try{
    if(request.method==='GET'){
      const id=params.get('id')||'',kind=params.get('kind');
      if(!uuid.test(id)||!['xml','danfe'].includes(kind))return result({error:'Documento inválido.'},400);
      const order=await readOrder(id),path=order?.fiscal_invoice?.[kind==='xml'?'xmlPath':'danfePath'];
      if(!path||!new RegExp(`^${id}/[0-9a-f-]{36}\\.${kind==='xml'?'xml':'pdf'}$`,'i').test(path))return result({error:'Documento não disponível.'},404);
      const signed=await fetcher(`${url}/storage/v1/object/sign/${bucket}/${encoded(path)}`,{method:'POST',headers,body:JSON.stringify({expiresIn:300}),signal:AbortSignal.timeout(8000)});
      const data=signed.ok?await signed.json():null,relative=data?.signedURL||data?.signedUrl;
      if(!relative)throw new Error('INVOICE_SAVE_FAILED');
      const documentUrl=new URL(relative.startsWith('http')?relative:`${url}/storage/v1${relative}`);
      if(documentUrl.origin!==new URL(url).origin||documentUrl.protocol!=='https:')throw new Error('INVOICE_SAVE_FAILED');
      return result({url:documentUrl.href,expiresIn:300});
    }
    if(request.method!=='POST')return result({error:'Método não permitido.'},405);
    if(!request.headers.get('content-type')?.includes('multipart/form-data'))return result({error:invoiceMessage('INVOICE_XML_INVALID')},400);
    // Bound the actual bytes, including multipart overhead, before parsing the form.
    const limit=8*1024*1024;
    if(Number(request.headers.get('content-length'))>limit)return result({error:'Documentos acima do limite permitido.'},413);
    const reader=request.body?.getReader(),chunks=[];let size=0;
    if(!reader)return result({error:invoiceMessage('INVOICE_XML_INVALID')},400);
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>limit){await reader.cancel();return result({error:'Documentos acima do limite permitido.'},413);}chunks.push(value);}
    const form=await new Response(new Blob(chunks),{headers:{'Content-Type':request.headers.get('content-type')}}).formData();
    const id=String(form.get('orderId')||''),xml=form.get('xml'),danfe=form.get('danfe');
    if(!uuid.test(id))return result({error:'Pedido inválido.'},400);
    if(form.get('confirmed')!=='true')return result({error:'Confirme a conferência da nota com o contador.'},400);
    if(!(xml instanceof File)||xml.size<1||xml.size>2*1024*1024)return result({error:invoiceMessage('INVOICE_XML_INVALID')},400);
    if(danfe instanceof File&&danfe.size>0&&(danfe.size>5*1024*1024||await danfe.slice(0,5).text()!=='%PDF-'))
      return result({error:invoiceMessage('INVOICE_DOCUMENT_INVALID')},400);
    const order=await readOrder(id);
    if(!order)return result({error:'Pedido não encontrado.'},404);
    if(order.financial_status!=='pago'||order.operational_status==='cancelado')throw new Error('ORDER_NOT_PAID');
    if(order.fiscal_invoice)throw new Error('INVOICE_ALREADY_REGISTERED');
    if(['gerando','gerada'].includes(order.label_status)||order.shipping_label_id)throw new Error('LABEL_IN_PROGRESS');
    const invoice=readOrderInvoice(await xml.text(),order,parse),paths=[];
    const cleanup=()=>fetcher(`${url}/storage/v1/object/${bucket}`,{method:'DELETE',headers,body:JSON.stringify({prefixes:paths}),signal:AbortSignal.timeout(8000)}).catch(()=>null);
    const upload=async(file,type,extension)=>{
      const path=`${id}/${crypto.randomUUID()}.${extension}`;
      paths.push(path);
      const uploaded=await fetcher(`${url}/storage/v1/object/${bucket}/${encoded(path)}`,{method:'POST',headers:{...headers,'Content-Type':type,'x-upsert':'false'},body:file,signal:AbortSignal.timeout(15000)});
      if(!uploaded.ok)throw new Error('INVOICE_SAVE_FAILED');
      return path;
    };
    try{
      invoice.xmlPath=await upload(xml,'application/xml','xml');
      if(danfe instanceof File&&danfe.size>0)invoice.danfePath=await upload(danfe,'application/pdf','pdf');
    }catch{await cleanup();throw new Error('INVOICE_SAVE_FAILED');}
    // A lost RPC response may already have committed. Keep the private documents
    // for reconciliation rather than deleting files potentially linked to an order.
    const saved=await fetcher(`${url}/rest/v1/rpc/record_order_invoice`,{method:'POST',headers,
      body:JSON.stringify({target_order_id:id,actor_user_id:adminId,invoice_details:invoice}),signal:AbortSignal.timeout(10000)});
    const data=await saved.json().catch(()=>null);
    if(!saved.ok){
      if(saved.status<500)await cleanup();
      const code=['INVOICE_ALREADY_REGISTERED','LABEL_IN_PROGRESS','ORDER_NOT_PAID'].find(key=>String(data?.message||'').includes(key));
      throw new Error(code||'INVOICE_SAVE_FAILED');
    }
    return result({registered:true,message:'NF-e do contador vinculada ao pedido.'},201);
  }catch(error){return result({error:invoiceMessage(error?.message)},409);}
}
