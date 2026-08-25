import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE_ORIGIN = "https://chi-rho-ecommerce.vercel.app";
const PUBLIC_CHECKOUT_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS = new Set([
  SITE_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

const PRODUCTS = Object.freeze({
  "casa-balanca-digital-cozinha-10kg": Object.freeze({
    sku: "CASA-BALANCA-10KG",
    name: "Balança Digital de Cozinha 10 kg",
    category: "Cozinha",
    price: 29.90,
    stock: 5
  }),
  "casa-bomba-eletrica-garrafa-agua": Object.freeze({
    sku: "CASA-BOMBA-AGUA-USB",
    name: "Bomba Elétrica USB para Garrafão de Água",
    category: "Utilidades Domésticas",
    price: 32.90,
    stock: 5
  })
});

const jsonResponse = (body: unknown, status = 200, origin = SITE_ORIGIN) => new Response(
  status === 204 ? null : JSON.stringify(body),
  {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin"
    }
  }
);

const onlyDigits = (value: unknown) => String(value || "").replace(/\D/g, "");
const cleanText = (value: unknown, maxLength: number) => String(value || "").trim().slice(0, maxLength);
const roundMoney = (value: number) => Number(value.toFixed(2));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validTaxId = (value: string) => {
  if (!/^\d{11}$|^\d{14}$/.test(value) || /^(\d)\1+$/.test(value)) return false;
  const digit = (base: string, factors: number[]) => {
    const sum = [...base].reduce((total, number, index) => total + Number(number) * factors[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  if (value.length === 11) {
    const first = digit(value.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = digit(value.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return value.endsWith(`${first}${second}`);
  }
  const first = digit(value.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = digit(value.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return value.endsWith(`${first}${second}`);
};

const validateItems = (requestedItems: unknown) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 2) {
    throw new Error("INVALID_ITEMS");
  }

  const quantities = new Map<string, number>();
  for (const requestedItem of requestedItems) {
    const slug = cleanText(requestedItem?.slug, 120);
    const quantity = Number(requestedItem?.quantity);
    const product = PRODUCTS[slug as keyof typeof PRODUCTS];
    if (!product || !Number.isInteger(quantity) || quantity < 1) throw new Error("INVALID_ITEMS");

    const accumulated = (quantities.get(slug) || 0) + quantity;
    if (accumulated > product.stock) throw new Error("OUT_OF_STOCK");
    quantities.set(slug, accumulated);
  }

  return [...quantities].map(([slug, quantity]) => {
    const product = PRODUCTS[slug as keyof typeof PRODUCTS];
    return {
      slug,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit_price: product.price,
      quantity
    };
  });
};

const validateContact = (body: any) => {
  const name = cleanText(body?.customer?.name, 160);
  const email = cleanText(body?.customer?.email, 320).toLowerCase();
  const whatsapp = onlyDigits(body?.customer?.whatsapp).slice(0, 11);
  const phone = onlyDigits(body?.customer?.phone || body?.customer?.whatsapp).slice(0, 11);
  const taxId = onlyDigits(body?.customer?.taxId).slice(0, 14);
  if (name.length < 3 || !emailPattern.test(email) || !/^\d{10,11}$/.test(whatsapp)
    || !/^\d{10,11}$/.test(phone) || !validTaxId(taxId)) {
    throw new Error("INVALID_CUSTOMER");
  }
  return {
    name,
    email,
    whatsapp,
    phone,
    tax_id: taxId,
    whatsapp_marketing_consent: body?.customer?.whatsappMarketing === true
  };
};

const validateAddress = (body: any) => {
  const address = {
    postal_code: onlyDigits(body?.address?.postcode).slice(0, 8),
    street: cleanText(body?.address?.street, 180),
    number: cleanText(body?.address?.number, 30),
    complement: cleanText(body?.address?.complement, 120),
    district: cleanText(body?.address?.district, 120),
    city: cleanText(body?.address?.city, 120),
    state: cleanText(body?.address?.state, 2).toUpperCase()
  };
  if (
    !/^\d{8}$/.test(address.postal_code)
    || address.street.length < 2
    || !address.number
    || address.district.length < 2
    || address.city.length < 2
    || !/^[A-Z]{2}$/.test(address.state)
  ) {
    throw new Error("INVALID_ADDRESS");
  }
  return address;
};

const getVerifiedShipping = async (body: any, items: Array<{ slug: string; quantity: number }>, postcode: string) => {
  const selected = body?.shipping?.service;
  if (!selected || onlyDigits(body?.shipping?.cep) !== postcode) throw new Error("INVALID_SHIPPING");

  const quoteResponse = await fetch(`${SITE_ORIGIN}/api/frete`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Origin": SITE_ORIGIN
    },
    body: JSON.stringify({ cep: postcode, itens: items }),
    signal: AbortSignal.timeout(15000)
  });
  const quote = await quoteResponse.json().catch(() => ({}));
  if (!quoteResponse.ok || !Array.isArray(quote?.services)) throw new Error("SHIPPING_UNAVAILABLE");

  const carrierCode = cleanText(selected?.carrierCode, 80);
  const serviceCode = cleanText(selected?.serviceCode, 80);
  const carrier = cleanText(selected?.carrier, 120);
  const description = cleanText(selected?.description, 160);
  const verified = quote.services.find((service: any) => (
    carrierCode && serviceCode
      ? String(service.carrierCode || "") === carrierCode && String(service.serviceCode || "") === serviceCode
      : String(service.carrier || "") === carrier && String(service.description || "") === description
  ));
  if (!verified || !Number.isFinite(verified.price)) throw new Error("INVALID_SHIPPING");

  return {
    carrier: cleanText(verified.carrier, 120),
    carrier_code: cleanText(verified.carrierCode, 80),
    service: cleanText(verified.description, 160),
    service_code: cleanText(verified.serviceCode, 80),
    delivery_time: cleanText(verified.deliveryTime, 80),
    price: roundMoney(Number(verified.price)),
    quoted_at: new Date().toISOString()
  };
};

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || SITE_ORIGIN;
  if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse({ error: "Origem não autorizada." }, 403, SITE_ORIGIN);
  if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
  if (request.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405, origin);

  const providedApiKey = request.headers.get("apikey");
  if (providedApiKey !== PUBLIC_CHECKOUT_KEY) {
    return jsonResponse({ error: "Requisição não autorizada." }, 401, origin);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 30000) return jsonResponse({ error: "Pedido inválido." }, 413, origin);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Dados do pedido inválidos." }, 400, origin);
  }

  try {
    const clientRequestId = cleanText(body?.clientRequestId, 36);
    if (!uuidPattern.test(clientRequestId)) throw new Error("INVALID_REQUEST_ID");

    const customer = validateContact(body);
    const address = validateAddress(body);
    const items = validateItems(body?.items);
    const subtotal = roundMoney(items.reduce((total, item) => total + item.unit_price * item.quantity, 0));
    const shipping = await getVerifiedShipping(body, items, address.postal_code);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("DATABASE_UNAVAILABLE");

    const databaseResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_checkout_order_v2`, {
      method: "POST",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        payload: {
          client_request_id: clientRequestId,
          customer,
          address,
          shipping,
          subtotal,
          items
        }
      }),
      signal: AbortSignal.timeout(10000)
    });
    const databaseData = await databaseResponse.json().catch(() => ({}));
    if (!databaseResponse.ok) {
      const databaseMessage = String(databaseData?.message || "");
      console.error("Order database error", databaseResponse.status, databaseData?.code || "unknown");
      if (databaseMessage.includes("OUT_OF_STOCK")) throw new Error("OUT_OF_STOCK");
      if (databaseMessage.includes("INVALID_ITEMS")) throw new Error("INVALID_ITEMS");
      throw new Error("DATABASE_ERROR");
    }

    const order = Array.isArray(databaseData) ? databaseData[0] : databaseData;
    return jsonResponse({
      order: {
        id: order.order_id,
        code: order.order_code,
        publicToken: order.order_public_token,
        status: order.order_financial_status,
        operationalStatus: order.order_operational_status,
        total: Number(order.order_total),
        reservationExpiresAt: order.order_reservation_expires_at
      },
      payment: { status: "aguardando_pagamento" }
    }, 201, origin);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("Order creation failed", code);
    const messages: Record<string, string> = {
      INVALID_ITEMS: "O pedido aceita somente os produtos de Casa liberados para teste.",
      OUT_OF_STOCK: "A quantidade solicitada é maior que o estoque disponível.",
      INVALID_CUSTOMER: "Confira o nome, o e-mail e o WhatsApp.",
      INVALID_ADDRESS: "Confira o endereço de entrega.",
      INVALID_SHIPPING: "O frete selecionado não pôde ser validado. Volte ao carrinho e faça uma nova cotação.",
      SHIPPING_UNAVAILABLE: "Não foi possível confirmar o frete neste momento.",
      INVALID_REQUEST_ID: "Não foi possível identificar esta tentativa de pedido.",
      DATABASE_UNAVAILABLE: "O banco de pedidos está temporariamente indisponível.",
      DATABASE_ERROR: "Não foi possível registrar o pedido neste momento."
    };
    const status = code.startsWith("INVALID") || code === "OUT_OF_STOCK" ? 400 : 503;
    return jsonResponse({ error: messages[code] || "Não foi possível registrar o pedido." }, status, origin);
  }
});
