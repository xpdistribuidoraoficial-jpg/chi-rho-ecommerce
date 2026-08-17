import { shippingProducts } from "../data/shipping-products.mjs";

const jsonResponse = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  }
});

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const getValidatedItems = (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 10) {
    throw new Error("INVALID_ITEMS");
  }

  const quantitiesBySlug = new Map();
  requestedItems.forEach((item) => {
    const slug = typeof item?.slug === "string" ? item.slug : "";
    const quantity = Number(item?.quantity);
    const product = shippingProducts[slug];
    if (!product || !Number.isInteger(quantity) || quantity < 1) throw new Error("INVALID_ITEMS");

    const accumulatedQuantity = (quantitiesBySlug.get(slug) || 0) + quantity;
    if (accumulatedQuantity > product.stock) throw new Error("OUT_OF_STOCK");
    quantitiesBySlug.set(slug, accumulatedQuantity);
  });

  return [...quantitiesBySlug].map(([slug, quantity]) => ({
    slug,
    quantity,
    product: shippingProducts[slug]
  }));
};

const parsePrice = (value) => {
  if (typeof value === "number") return value;
  const sanitizedValue = String(value || "").replace(/[^0-9,.-]/g, "");
  const normalizedValue = sanitizedValue.includes(",")
    ? sanitizedValue.replace(/\./g, "").replace(",", ".")
    : sanitizedValue;
  const price = Number(normalizedValue);
  return Number.isFinite(price) ? price : null;
};

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Método não permitido." }, 405);
    }

    const requestUrl = new URL(request.url);
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin) {
      try {
        if (new URL(requestOrigin).host !== requestUrl.host) {
          return jsonResponse({ error: "Origem não autorizada." }, 403);
        }
      } catch {
        return jsonResponse({ error: "Origem não autorizada." }, 403);
      }
    }

    const token = process.env.FRENET_TOKEN?.trim();
    const sellerCep = onlyDigits(process.env.FRENET_SELLER_CEP);
    if (!token || sellerCep.length !== 8) {
      return jsonResponse({ error: "O cálculo de frete está temporariamente indisponível." }, 503);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Dados da cotação inválidos." }, 400);
    }

    const recipientCep = onlyDigits(body?.cep);
    if (recipientCep.length !== 8) {
      return jsonResponse({ error: "Informe um CEP válido com 8 números." }, 400);
    }

    let items;
    try {
      items = getValidatedItems(body?.itens);
    } catch (error) {
      const message = error.message === "OUT_OF_STOCK"
        ? "A quantidade solicitada é maior que o estoque disponível."
        : "Os produtos informados não estão disponíveis para cotação.";
      return jsonResponse({ error: message }, 400);
    }

    const invoiceValue = Number(items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    ).toFixed(2));

    const quotePayload = {
      SellerCEP: sellerCep,
      RecipientCEP: recipientCep,
      ShipmentInvoiceValue: invoiceValue,
      ShippingItemArray: items.map(({ product, quantity }) => ({
        Weight: product.weight,
        Length: product.length,
        Height: product.height,
        Width: product.width,
        Quantity: quantity,
        SKU: product.sku,
        Category: product.category,
        isFragile: product.fragile
      }))
    };

    try {
      const frenetResponse = await fetch("https://api.frenet.com.br/shipping/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify(quotePayload),
        signal: AbortSignal.timeout(12000)
      });

      const frenetData = await frenetResponse.json().catch(() => ({}));
      if (!frenetResponse.ok) {
        return jsonResponse({ error: "Não foi possível consultar o frete neste momento." }, 502);
      }

      const rawServices = frenetData.ShippingSevicesArray
        || frenetData.ShippingServicesArray
        || [];
      const services = rawServices
        .filter((service) => !service?.Error)
        .map((service) => ({
          carrier: service.Carrier || "Transportadora",
          carrierCode: service.CarrierCode || "",
          serviceCode: service.ServiceCode || "",
          description: service.ServiceDescription || "Entrega",
          deliveryTime: String(service.DeliveryTime || "").trim(),
          price: parsePrice(service.ShippingPrice)
        }))
        .filter((service) => service.price !== null)
        .sort((first, second) => first.price - second.price);

      if (services.length === 0) {
        const serviceMessage = rawServices.find((service) => service?.Msg)?.Msg;
        return jsonResponse({
          error: serviceMessage || "Nenhuma modalidade de entrega foi encontrada para este CEP."
        }, 422);
      }

      return jsonResponse({
        cep: recipientCep,
        services,
        quotedAt: new Date().toISOString(),
        expiresInMinutes: 15
      });
    } catch (error) {
      const message = error?.name === "TimeoutError"
        ? "A consulta de frete demorou mais que o esperado. Tente novamente."
        : "Não foi possível conectar à Frenet neste momento.";
      return jsonResponse({ error: message }, 502);
    }
  }
};
