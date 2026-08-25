import { shippingProducts } from "./data/shipping-products.mjs";

const CART_STORAGE_KEY = "chi-rho-test-cart-v1";
const SHIPPING_STORAGE_KEY = "chi-rho-test-shipping-v1";
const LAST_ORDER_STORAGE_KEY = "chi-rho-last-order-v1";
const ORDER_ENDPOINT = "https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/create-casa-order";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";
const PAYMENT_ENDPOINT = "/api/mercadopago/create-preference";
let createdOrder = null;
let paymentAvailable = false;

const createRequestId = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
};

const checkoutRequestId = createRequestId();

const formatCurrency = (value) => Number(value).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const isValidTaxId = (value) => {
  const document = onlyDigits(value);
  if (!/^\d{11}$|^\d{14}$/.test(document) || /^(\d)\1+$/.test(document)) return false;
  const digit = (base, factors) => {
    const sum = [...base].reduce((total, number, index) => total + Number(number) * factors[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  if (document.length === 11) {
    const first = digit(document.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = digit(document.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return document.endsWith(`${first}${second}`);
  }
  const first = digit(document.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = digit(document.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return document.endsWith(`${first}${second}`);
};

const formatPostcode = (value) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

const formatWhatsapp = (value) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatDeliveryTime = (value) => {
  const deliveryTime = String(value || "").trim();
  if (!deliveryTime) return "Prazo a confirmar";
  if (/dia/i.test(deliveryTime)) return deliveryTime;
  return `${deliveryTime} ${deliveryTime === "1" ? "dia útil" : "dias úteis"}`;
};

const loadCart = () => {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(storedCart)) return [];
    return storedCart
      .map((item) => {
        const product = shippingProducts[item?.slug];
        const quantity = Number(item?.quantity);
        if (!product || !Number.isInteger(quantity) || quantity < 1) return null;
        return {
          slug: item.slug,
          quantity: Math.min(quantity, product.stock),
          product
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const loadShipping = () => {
  try {
    const storedShipping = JSON.parse(sessionStorage.getItem(SHIPPING_STORAGE_KEY) || "null");
    const service = storedShipping?.service;
    if (
      onlyDigits(storedShipping?.cep).length !== 8
      || typeof service?.carrier !== "string"
      || typeof service?.description !== "string"
      || !Number.isFinite(service?.price)
    ) {
      return null;
    }
    return { cep: onlyDigits(storedShipping.cep), service };
  } catch {
    return null;
  }
};

const fillAddressByPostcode = async (form, postcode) => {
  const status = form.querySelector("[data-address-status]");
  if (!status) return;

  status.textContent = "Buscando endereço pelo CEP…";
  status.className = "checkout-address-status is-loading";

  try {
    const response = await fetch(`/api/cep?cep=${encodeURIComponent(postcode)}`, {
      headers: { Accept: "application/json" }
    });
    const address = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(address.error || "Não foi possível consultar o CEP.");
    }

    const fields = {
      street: address.street,
      district: address.district,
      city: address.city,
      state: address.state
    };

    Object.entries(fields).forEach(([name, value]) => {
      if (value && !form.elements[name].value) {
        form.elements[name].value = value;
      }
    });

    const hasCompleteAddress = address.street && address.district && address.city && address.state;
    status.textContent = hasCompleteAddress
      ? "Endereço localizado. Complete o número e, se necessário, o complemento."
      : "CEP localizado. Complete os campos de endereço que faltam.";
    status.className = "checkout-address-status is-success";
  } catch {
    status.textContent = "Não foi possível preencher automaticamente. Complete o endereço manualmente."
    status.className = "checkout-address-status is-error";
  }
};

const cart = loadCart();
const shipping = loadShipping();
const emptyState = document.querySelector("[data-checkout-empty]");
const checkoutContent = document.querySelector("[data-checkout-content]");

if (cart.length === 0 || !shipping) {
  emptyState.hidden = false;
} else {
  checkoutContent.hidden = false;

  const itemsContainer = document.querySelector("[data-checkout-items]");
  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const total = subtotal + shipping.service.price;

  cart.forEach(({ product, quantity }) => {
    const item = document.createElement("article");
    item.className = "checkout-summary-item";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";

    const copy = document.createElement("div");
    const name = document.createElement("strong");
    const detail = document.createElement("span");
    const price = document.createElement("b");

    name.textContent = product.name;
    detail.textContent = `${quantity} ${quantity === 1 ? "unidade" : "unidades"}`;
    price.textContent = formatCurrency(product.price * quantity);
    copy.append(name, detail);
    item.append(image, copy, price);
    itemsContainer.appendChild(item);
  });

  document.querySelector("[data-checkout-delivery]").innerHTML = `
    <span>ENTREGA SELECIONADA</span>
    <strong>${shipping.service.carrier} • ${shipping.service.description}</strong>
    <small>${formatDeliveryTime(shipping.service.deliveryTime)} para o CEP ${formatPostcode(shipping.cep)}</small>
  `;
  document.querySelector("[data-checkout-postcode]").value = formatPostcode(shipping.cep);
  document.querySelector("[data-checkout-subtotal]").textContent = formatCurrency(subtotal);
  document.querySelector("[data-checkout-shipping-price]").textContent = formatCurrency(shipping.service.price);
  document.querySelector("[data-checkout-total]").textContent = formatCurrency(total);

  fillAddressByPostcode(document.querySelector("#checkout-form"), shipping.cep);
}

document.querySelector("[data-whatsapp-input]")?.addEventListener("input", (event) => {
  event.target.value = formatWhatsapp(event.target.value);
});

document.querySelector("[data-tax-id-input]")?.addEventListener("input", (event) => {
  event.target.value = onlyDigits(event.target.value).slice(0, 14);
});

const paymentButton = document.querySelector("[data-payment-button]");
const paymentStatus = document.querySelector("[data-payment-status]");
const paymentProviderStatus = document.querySelector("[data-payment-provider-status]");

const checkPaymentAvailability = async () => {
  try {
    const response = await fetch(PAYMENT_ENDPOINT, { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    paymentAvailable = response.ok && data.available === true;
  } catch {
    paymentAvailable = false;
  }
  paymentProviderStatus.textContent = paymentAvailable ? "Disponível" : "Em configuração";
  if (createdOrder) {
    paymentButton.hidden = false;
    paymentButton.disabled = !paymentAvailable;
    paymentButton.textContent = paymentAvailable ? "Finalizar pagamento" : "Pagamento em configuração";
  }
};

paymentButton?.addEventListener("click", async () => {
  if (!createdOrder || !paymentAvailable) return;
  paymentButton.disabled = true;
  paymentButton.textContent = "Abrindo Mercado Pago…";
  paymentStatus.textContent = "Validando valores, estoque e frete no servidor…";
  paymentStatus.className = "checkout-form-status";
  try {
    const response = await fetch(PAYMENT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: createdOrder.code, publicToken: createdOrder.publicToken }), signal: AbortSignal.timeout(25000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Não foi possível iniciar o pagamento.");
    const paymentUrl = new URL(data.paymentUrl);
    if (paymentUrl.protocol !== "https:") throw new Error("A URL de pagamento recebida não é segura.");
    window.location.assign(paymentUrl.href);
  } catch (error) {
    paymentStatus.textContent = error?.name === "TimeoutError" ? "O Mercado Pago demorou mais que o esperado. Tente novamente." : error.message;
    paymentStatus.className = "checkout-form-status is-error";
    paymentButton.disabled = !paymentAvailable;
    paymentButton.textContent = "Finalizar pagamento";
  }
});

checkPaymentAvailability();

document.querySelector("#checkout-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-checkout-form-status]");
  const submitButton = form.querySelector(".checkout-submit");
  const whatsapp = onlyDigits(form.elements.whatsapp.value);
  const taxId = onlyDigits(form.elements.taxId.value);

  if (whatsapp.length < 10) {
    form.elements.whatsapp.setCustomValidity("Informe um WhatsApp válido com DDD.");
    form.elements.whatsapp.reportValidity();
    form.elements.whatsapp.setCustomValidity("");
    return;
  }

  if (!isValidTaxId(taxId)) {
    form.elements.taxId.setCustomValidity("Informe um CPF ou CNPJ válido.");
    form.elements.taxId.reportValidity();
    form.elements.taxId.setCustomValidity("");
    return;
  }

  if (cart.length === 0 || !shipping) {
    status.textContent = "O carrinho ou o frete não está mais disponível. Volte ao catálogo e refaça a cotação.";
    status.className = "checkout-form-status is-error";
    return;
  }

  const payload = {
    clientRequestId: checkoutRequestId,
    customer: {
      name: form.elements.name.value,
      email: form.elements.email.value,
      whatsapp,
      phone: whatsapp,
      taxId,
      whatsappMarketing: form.elements.whatsappMarketing.checked
    },
    address: {
      postcode: form.elements.postcode.value,
      street: form.elements.street.value,
      number: form.elements.number.value,
      complement: form.elements.complement.value,
      district: form.elements.district.value,
      city: form.elements.city.value,
      state: form.elements.state.value
    },
    items: cart.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    shipping
  };

  submitButton.disabled = true;
  submitButton.textContent = "Registrando pedido…";
  status.textContent = "Confirmando o frete e salvando o pedido com segurança…";
  status.className = "checkout-form-status";

  try {
    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível registrar o pedido.");
    createdOrder = result.order;

    try {
      sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify({
        ...result.order,
        checkoutSnapshot: {
          items: cart.map((item) => ({
            product_name: item.product.name,
            sku: item.product.sku,
            image_url: item.product.image,
            quantity: item.quantity,
            line_total: Number(item.product.price) * item.quantity
          })),
          subtotal: cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
          shippingPrice: Number(shipping.service.price),
          total: Number(result.order.total),
          shipping: {
            carrier: shipping.service.carrier,
            service: shipping.service.description,
            deliveryTime: shipping.service.deliveryTime
          },
          address: payload.address
        }
      }));
    } catch {
      // O pedido permanece salvo no Supabase mesmo sem armazenamento nesta sessão.
    }
    status.textContent = `Pedido ${result.order.code} registrado. Nenhuma cobrança foi realizada até você abrir o Mercado Pago.`;
    const trackingLink = document.createElement("a");
    trackingLink.href = "pagamento-pendente.html";
    trackingLink.textContent = "Acompanhar pedido";
    status.append(" ", trackingLink);
    status.className = "checkout-form-status is-success";
    submitButton.textContent = "Pedido registrado";
    document.querySelector(".checkout-pilot-note p").innerHTML = `<strong>Pedido salvo no banco.</strong> Código ${result.order.code}. O pagamento só será iniciado pelo botão seguro abaixo.`;
    paymentButton.hidden = false;
    paymentButton.disabled = !paymentAvailable;
    paymentButton.textContent = paymentAvailable ? "Finalizar pagamento" : "Pagamento em configuração";
    form.querySelector(".checkout-payment-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    status.textContent = error?.name === "TimeoutError"
      ? "O registro demorou mais que o esperado. Tente novamente; o mesmo pedido não será duplicado."
      : error.message;
    status.className = "checkout-form-status is-error";
    submitButton.disabled = false;
    submitButton.textContent = "Registrar pedido de teste";
  }
});
