import {loadShippingCatalog} from '../data/shipping-products.mjs';
import {signedAction,sameOrigin} from '../lib/cpad-database.mjs';
import {paymentReadiness} from '../lib/cpad-payment-readiness.mjs';

import { applyPaymentOffer, hasPaymentOffer } from '../data/payment-offers.mjs';

import { priceCart } from "../lib/kit-pricing.mjs";

const SITE_ORIGIN = "https://www.chirho.com.br";
const OFFICIAL_SITE_ORIGIN = "https://www.chirho.com.br";
const PUBLIC_CHECKOUT_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const ALLOWED_ORIGINS = new Set([
  SITE_ORIGIN,
  OFFICIAL_SITE_ORIGIN,
  "https://chirho.com.br",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/chi-rho-ecommerce(?:-[a-z0-9-]+)?\.vercel\.app$/i;
const isAllowedOrigin = (origin        ) => ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_ORIGIN.test(origin);

const jsonResponse = (body         , status = 200, origin = SITE_ORIGIN) => new Response(
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

const onlyDigits = (value         ) => String(value || "").replace(/\D/g, "");
const cleanText = (value         , maxLength        ) => String(value || "").trim().slice(0, maxLength);
const roundMoney = (value        ) => Number(value.toFixed(2));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9][a-z0-9-]{0,119}$/;
const PICKUP_ADDRESS = Object.freeze({
  postal_code: "21210250",
  street: "Rua Maria do Carmo",
  number: "202",
  complement: "",
  district: "Penha Circular",
  city: "Rio de Janeiro",
  state: "RJ"
});

const validTaxId = (value        ) => {
  if (!/^\d{11}$|^\d{14}$/.test(value) || /^(\d)\1+$/.test(value)) return false;
  const digit = (base        , factors          ) => {
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

const getCartPricing = async (requestedItems, paymentMethod) => {
  const catalog=await loadShippingCatalog();
  const pricing = priceCart(requestedItems,catalog.baseProducts,catalog.kits);
  return hasPaymentOffer(pricing.lines) ? applyPaymentOffer(pricing, paymentMethod) : pricing;
};

const validateContact = (body     ) => {
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

const validateAddress = (body     ) => {
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

const getVerifiedShipping = async (body     , items                                           , postcode        ) => {
  const selected = body?.shipping?.service;
  if (!selected) throw new Error("INVALID_SHIPPING");

  if (cleanText(selected?.carrierCode, 80) === "PICKUP_VENDOR") {
    return {
      carrier: "Retirada com o vendedor",
      carrier_code: "PICKUP_VENDOR",
      service: "Retirar com o vendedor",
      service_code: "PICKUP_VENDOR",
      delivery_time: "Retirada a combinar",
      price: 0,
      quoted_at: new Date().toISOString()
    };
  }

  if (onlyDigits(body?.shipping?.cep) !== postcode) throw new Error("INVALID_SHIPPING");

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
  const verified = quote.services.find((service     ) => (
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

export default { async fetch(request) {
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  if (!sameOrigin(request)) return jsonResponse({error:"Origem não autorizada."},403,origin);
  if (!isAllowedOrigin(origin)) return jsonResponse({ error: "Origem não autorizada." }, 403, SITE_ORIGIN);
  if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
  if (request.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405, origin);

  if (request.headers.get("apikey") !== PUBLIC_CHECKOUT_KEY) {
    return jsonResponse({ error: "Requisição não autorizada." }, 401, origin);
  }

  if (!(await paymentReadiness()).ready) {
    return jsonResponse({error:"Pagamento dos kits aguardando validação. Nenhum estoque foi reservado."},503,origin);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 50000) return jsonResponse({ error: "Pedido inválido." }, 413, origin);

  let body     ;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Dados do pedido inválidos." }, 400, origin);
  }

  try {
    const clientRequestId = cleanText(body?.clientRequestId, 36);
    if (!uuidPattern.test(clientRequestId)) throw new Error("INVALID_REQUEST_ID");

    const customer = validateContact(body);
    const isPickup = cleanText(body?.shipping?.service?.carrierCode, 80) === "PICKUP_VENDOR";
    const address = isPickup ? { ...PICKUP_ADDRESS } : validateAddress(body);
    const pricing = await getCartPricing(body?.items, body?.paymentMethod);
    const items = pricing.items;
    const subtotal = pricing.subtotal;
    const shipping = await getVerifiedShipping(body, items, address.postal_code);
    const attribution = {
      channel: cleanText(body?.attribution?.channel, 80),
      source: cleanText(body?.attribution?.source, 100),
      medium: cleanText(body?.attribution?.medium, 100),
      campaign: cleanText(body?.attribution?.campaign, 160),
      content: cleanText(body?.attribution?.content, 160),
      term: cleanText(body?.attribution?.term, 160),
      referrer: cleanText(body?.attribution?.referrer, 500),
      landing_path: cleanText(body?.attribution?.landing_path, 500),
      device: cleanText(body?.attribution?.device, 40)
    };

    const databaseData=await signedAction({
      action:'order',client_request_id:clientRequestId,customer,address,shipping,subtotal,
      discount:pricing.discount,kits:pricing.kits,items,attribution,
      ...(pricing.paymentMethod ? {payment_method:pricing.paymentMethod} : {})
    });

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
    const messages                         = {
      ORDER_PAYMENT_MISMATCH: "Este pedido já foi registrado com outra forma ou valor. Atualize a página para iniciar uma nova compra.",
      INVALID_PAYMENT_METHOD: "Escolha Pix ou cartão para confirmar o preço do Beacon. Se necessário, atualize esta página.",
      INVALID_KIT: "A composição deste kit precisa ser atualizada.",
      KIT_INACTIVE: "Este kit não está disponível para compra.",
      KIT_COMPONENT_UNAVAILABLE: "Um componente deste kit não está disponível.",
      INVALID_ITEMS: "Um ou mais produtos não estão liberados para compra.",
      OUT_OF_STOCK: "A quantidade solicitada é maior que o estoque disponível.",
      INVALID_CUSTOMER: "Confira o nome, o e-mail e o WhatsApp.",
      INVALID_ADDRESS: "Confira o endereço de entrega.",
      INVALID_SHIPPING: "O frete selecionado não pôde ser validado. Volte ao carrinho e faça uma nova cotação.",
      SHIPPING_UNAVAILABLE: "Não foi possível confirmar o frete neste momento.",
      INVALID_REQUEST_ID: "Não foi possível identificar esta tentativa de pedido.",
      DATABASE_UNAVAILABLE: "O banco de pedidos está temporariamente indisponível.",
      DATABASE_ERROR: "Não foi possível registrar o pedido neste momento.",
      RATE_LIMITED: "Há muitas tentativas de pedido recentes com estes dados. Aguarde alguns minutos antes de tentar novamente."
    };
    const status = code === "RATE_LIMITED" ? 429 : code.startsWith("INVALID") || code === "OUT_OF_STOCK" ? 400 : 503;
    return jsonResponse({ error: messages[code] || "Não foi possível registrar o pedido." }, status, origin);
  }
} };
