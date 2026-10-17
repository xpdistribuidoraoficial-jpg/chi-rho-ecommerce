import {validInvoiceKey} from './order-invoice.mjs';

// Server-only: one financial submission per claim. Uncertain results stay locked.
const digits = value => String(value || '').replace(/\D/g, '');
const cents = value => Math.round(Number(value) * 100);
const money = value => cents(value) / 100;
const https = value => { try { return new URL(value).protocol === 'https:' ? String(value) : ''; } catch { return ''; } };
const price = value => {
  if (typeof value === 'number') return value;
  const clean = String(value ?? '').replace(/[^0-9,.-]/g, '');
  return clean.trim() ? Number(clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean) : NaN;
};
export const labelConfiguration = env => ({
  token: env('FRENET_TOKEN')?.trim() || '',
  partnerToken: env('FRENET_PARTNER_TOKEN')?.trim() || '',
  sellerCep: digits(env('FRENET_SELLER_CEP') || '21210250'),
  printFormat: /^(A4|A6)$/i.test(env('FRENET_PRINTING_FORMAT') || '') ? env('FRENET_PRINTING_FORMAT').toUpperCase() : 'A4'
});
export const labelCapability = config => ({
  available: Boolean(config.token && config.partnerToken && config.sellerCep.length === 8),
  automaticOnReady: true,
  provider: 'frenet',
  reason: !config.token ? 'client_token_pending' : !config.partnerToken ? 'partner_token_pending' : config.sellerCep.length !== 8 ? 'origin_postcode_pending' : null
});
export const validPackage = parcel => parcel && ['weightKg', 'lengthCm', 'widthCm', 'heightCm'].every(key =>
  typeof parcel[key] === 'number' && Number.isFinite(parcel[key]) && parcel[key] > 0 && parcel[key] <= (key === 'weightKg' ? 30 : 200));
export const shouldGenerateLabel = order => order?.financial_status === 'pago'
  && order.operational_status === 'pronto_para_envio' && order.shipping_carrier_code !== 'PICKUP_VENDOR';

const messages = {
  LABEL_NOT_CONFIGURED: 'Emissão pendente de configuração da Frenet. O pedido continua pronto para envio.',
  LABEL_ALREADY_GENERATED: 'Já existe uma etiqueta para este pedido.',
  LABEL_IN_PROGRESS: 'A emissão anterior precisa ser conferida na Frenet antes de qualquer nova tentativa.',
  ORDER_NOT_PAID: 'A etiqueta só pode ser gerada após o pagamento.',
  ORDER_NOT_READY: 'O pedido precisa estar pronto para envio.',
  PICKUP_ORDER: 'Pedidos de retirada não geram etiqueta.',
  SHIPPING_PACKAGE_REQUIRED: 'Confira o peso e as medidas do pacote antes de emitir a etiqueta.',
  INVOICE_REQUIRED: 'Vincule a NF-e emitida pelo contador antes de solicitar a etiqueta.',
  STOCK_NOT_COMMITTED: 'A baixa de estoque ainda não foi confirmada.',
  ADDRESS_INCOMPLETE: 'Complete o endereço do destinatário.',
  RECIPIENT_DOCUMENT_MISSING: 'Confira o CPF ou CNPJ do destinatário.',
  RECIPIENT_PHONE_MISSING: 'Confira o telefone do destinatário.',
  ORDER_TOTAL_MISMATCH: 'Os valores dos itens e do pedido precisam ser conferidos.',
  SHIPPING_QUOTE_FAILED: 'Não foi possível conferir o preço atual do frete. Nenhuma etiqueta foi solicitada.',
  SHIPPING_SERVICE_UNAVAILABLE: 'O serviço escolhido não está disponível para este pacote. Nenhuma etiqueta foi solicitada.',
  SHIPPING_PRICE_INCREASED: 'O frete atual supera o valor cobrado no pedido. Confira a diferença antes de emitir.',
  LABEL_RECONCILIATION_REQUIRED: 'Confira a emissão na Frenet: a resposta não pôde ser confirmada. Uma nova compra foi bloqueada.'
};
const failure = (code, status = 409) => ({ok: false, status, code,
  message: messages[code] || 'Confira os dados do pedido antes de emitir a etiqueta.'});

export async function generateShippingLabel({url, serviceKey, adminId, orderId, config, fetcher = fetch}) {
  if (!labelCapability(config).available) return failure('LABEL_NOT_CONFIGURED', 503);
  const headers = {apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json'};
  const rpc = async (name, body) => {
    const result = await fetcher(`${url}/rest/v1/rpc/${name}`, {method: 'POST', headers,
      body: JSON.stringify(body), signal: AbortSignal.timeout(10000)});
    return {ok: result.ok, data: await result.json().catch(() => null)};
  };
  let claim;
  try { claim = await rpc('claim_shipping_label', {target_order_id: orderId, actor_user_id: adminId}); }
  catch { return failure('LABEL_IN_PROGRESS', 503); }
  if (!claim.ok) {
    const message = String(claim.data?.message || '');
    return failure(Object.keys(messages).find(code => message.includes(code)) || 'LABEL_VALIDATION_FAILED');
  }
  const requestKey = String(claim.data || '');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) return failure('LABEL_IN_PROGRESS',503);
  let submitted = false;
  try {
    const select = 'id,code,customer_name,customer_email,customer_whatsapp,customer_phone,tax_id,postal_code,street,address_number,complement,district,city,state,shipping_carrier,shipping_carrier_code,shipping_service,shipping_service_code,shipping_delivery_time,shipping_price,subtotal,discount,grand_total,shipping_package,fiscal_invoice';
    const read = async path => {
      const result = await fetcher(`${url}/rest/v1/${path}`, {headers, signal: AbortSignal.timeout(8000)});
      if (!result.ok) throw new Error('ORDER_DATA_MISSING');
      return result.json();
    };
    const [orders, items] = await Promise.all([
      read(`orders?id=eq.${orderId}&select=${select}&limit=1`),
      read(`order_items?order_id=eq.${orderId}&select=id,product_slug,sku,product_name,category,unit_price,quantity,line_total&order=id`)
    ]);
    const order = orders[0], parcel = order?.shipping_package;
    if (!order || !items.length) throw new Error('ORDER_DATA_MISSING');
    if (order.shipping_carrier_code === 'PICKUP_VENDOR') throw new Error('PICKUP_ORDER');
    if (!validPackage(parcel)) throw new Error('SHIPPING_PACKAGE_REQUIRED');
    const invoice=order.fiscal_invoice;
    if(!validInvoiceKey(invoice?.key)||invoice.environment!=='production'||invoice.issuerDocument!=='42300391000100'
      ||invoice.recipientDocument!==digits(order.tax_id)||cents(invoice.value)!==cents(order.grand_total)||cents(invoice.freight)!==cents(order.shipping_price))throw new Error('INVOICE_REQUIRED');
    const document = digits(order.tax_id), phone = digits(order.customer_phone || order.customer_whatsapp);
    if (!/^\d{11}$|^\d{14}$/.test(document)) throw new Error('RECIPIENT_DOCUMENT_MISSING');
    if (!/^\d{10,11}$/.test(phone)) throw new Error('RECIPIENT_PHONE_MISSING');
    const itemCents = items.reduce((sum, item) => sum + cents(item.line_total), 0);
    const discountCents=cents(order.discount || 0), goodsCents=itemCents-discountCents;
    if (items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity>1000 || !Number.isFinite(Number(item.unit_price))
      || Number(item.unit_price) < 0 || cents(item.unit_price * item.quantity) !== cents(item.line_total))
      || itemCents !== cents(order.subtotal) || !Number.isInteger(discountCents) || discountCents<0 || goodsCents<=0
      || cents(order.grand_total) !== goodsCents + cents(order.shipping_price)) throw new Error('ORDER_TOTAL_MISMATCH');
    // Requote the actual closed package using the same service. Never switch carriers silently.
    const quoted = await fetcher('https://api.frenet.com.br/shipping/quote', {method: 'POST',
      headers: {'Content-Type': 'application/json', token: config.token}, signal: AbortSignal.timeout(12000),
      body: JSON.stringify({SellerCEP: config.sellerCep, RecipientCEP: digits(order.postal_code),
        ShipmentInvoiceValue: goodsCents / 100, ShippingItemArray: [{Weight: parcel.weightKg, Length: parcel.lengthCm,
          Width: parcel.widthCm, Height: parcel.heightCm, Quantity: 1, SKU: order.code, Category: 'Pedido embalado'}]})});
    const quote = await quoted.json().catch(() => null);
    if (!quoted.ok || !quote) throw new Error('SHIPPING_QUOTE_FAILED');
    const services = quote.ShippingSevicesArray || quote.ShippingServicesArray || [];
    const service = services.find(item => !item.Error && String(item.ServiceCode) === String(order.shipping_service_code)
      && String(item.CarrierCode || '').toUpperCase() === String(order.shipping_carrier_code || '').toUpperCase());
    if (!service) throw new Error('SHIPPING_SERVICE_UNAVAILABLE');
    const currentPrice = price(service.ShippingPrice);
    if (!Number.isFinite(currentPrice) || currentPrice < 0) throw new Error('SHIPPING_QUOTE_FAILED');
    if (cents(currentPrice) > cents(order.shipping_price)) throw new Error('SHIPPING_PRICE_INCREASED');
    // Allocate the already-applied order discount once, with exact cent reconciliation.
    const units=items.flatMap(item=>Array.from({length:item.quantity},(_,index)=>({item,index,full:cents(item.unit_price)})));
    let allocated=0;
    const orderItems=units.map(unit=>{
      const value=Math.floor(unit.full*goodsCents/itemCents); allocated+=value;
      return {OrderId:order.code,ItemId:`${unit.item.id}-${unit.index+1}`,ProductId:unit.item.product_slug,
        ProductName:unit.item.product_name,SKU:unit.item.sku,Category:unit.item.category,Quantity:1,Price:value/100};
    });
    for(let index=0;index<goodsCents-allocated;index++) orderItems[index].Price=money(orderItems[index].Price+0.01);
    const payload = [{Order: {Id: order.code, Value: money(order.grand_total), UseFrenetRegistration: true, Items: orderItems,
      Invoice:{Key:invoice.key,Number:invoice.number,Series:invoice.series,Value:invoice.value,Date:invoice.issuedAt},
      To: {Name: order.customer_name, Email: order.customer_email, Phone: phone, Document: document,
        Address: {ZipCode: digits(order.postal_code), City: order.city, Street: order.street, AddressNumber: order.address_number,
          AddressComplement: order.complement || '', AddressQuarter: order.district, AddressState: order.state, Country: 'BR'}}},
      Volumes: [{Weight: parcel.weightKg, Length: parcel.lengthCm, Width: parcel.widthCm, Height: parcel.heightCm,
        Price: goodsCents / 100, DeclaredValue: goodsCents / 100, OrderItemsId: orderItems.map(item => item.ItemId)}],
      Quotation: {ShippingServiceCode: order.shipping_service_code, ShippingServiceName: service.ServiceDescription || order.shipping_service,
        PlatformShippingPrice: money(order.shipping_price), ShippingPrice: money(currentPrice),
        DeliveryTime: Number.parseInt(String(service.DeliveryTime || order.shipping_delivery_time || '0'), 10) || 0,
        Carrier: service.Carrier || order.shipping_carrier, CarrierCode: order.shipping_carrier_code,
        Services: {DeclaredValue: false, ReceiptNotification: false, OwnHand: false}}}];
    submitted = true;
    const result = await fetcher('https://whitelabel.frenet.com.br/v1/orders/oneclick', {method: 'POST',
      headers: {token: config.token, 'x-partner-token': config.partnerToken, 'x-printing-format': config.printFormat,
        'Content-Type': 'application/json'}, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000)});
    const batch = await result.json().catch(() => null), rows = batch?.Items || batch?.items;
    const item = Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
    const labelId = String(item?.ShipmentId || item?.shipmentId || '');
    const labelUrl = https(item?.LabelUrl || item?.labelUrl);
    const errors = item?.Errors ?? item?.errors;
    if (!result.ok || !item || !labelId || !labelUrl || String(item.OrderId || item.orderId) !== order.code
      || (Array.isArray(errors) ? errors.length > 0 : Boolean(errors)) || batch?.Error || batch?.error) throw new Error('LABEL_RECONCILIATION_REQUIRED');
    const trackingUrl = https(item.TrackingUrl || item.trackingUrl);
    const declarationUrl = https(item.DeclarationUrl || item.declarationUrl);
    const trackingCode = (trackingUrl.match(/([A-Z]{2}\d{9}[A-Z]{2})(?:\b|\/|$)/i) || [])[1] || '';
    const validThrough = item.ValidThrough || item.validThrough || null;
    const completed = await rpc('complete_shipping_label', {target_order_id: orderId, request_key: requestKey, actor_user_id: adminId,
      provider_name: 'frenet', provider_label_id: labelId, label_document_url: labelUrl, declaration_document_url: declarationUrl,
      provider_tracking_url: trackingUrl, provider_tracking_code: trackingCode, label_expiration: validThrough});
    if (!completed.ok) throw new Error('LABEL_RECONCILIATION_REQUIRED');
    return {ok: true, status: 201, code: 'LABEL_GENERATED', message: 'Etiqueta Frenet gerada. Confira antes de imprimir.',
      label: {id: labelId, labelUrl, declarationUrl, trackingUrl, trackingCode, validThrough, status: 'gerada'}};
  } catch (error) {
    const code = submitted ? 'LABEL_RECONCILIATION_REQUIRED' : error?.message || 'LABEL_VALIDATION_FAILED';
    await rpc('fail_shipping_label', {target_order_id: orderId, request_key: requestKey, actor_user_id: adminId, error_code: code}).catch(() => null);
    return failure(code, submitted ? 502 : 409);
  }
}
