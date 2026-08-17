import { shippingProducts } from "./data/shipping-products.mjs";

const CART_STORAGE_KEY = "chi-rho-test-cart-v1";
const SHIPPING_STORAGE_KEY = "chi-rho-test-shipping-v1";

const formatCurrency = (value) => Number(value).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

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

document.querySelector("#checkout-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-checkout-form-status]");
  const whatsapp = onlyDigits(form.elements.whatsapp.value);

  if (whatsapp.length < 10) {
    form.elements.whatsapp.setCustomValidity("Informe um WhatsApp válido com DDD.");
    form.elements.whatsapp.reportValidity();
    form.elements.whatsapp.setCustomValidity("");
    return;
  }

  status.textContent = "Dados validados. A conexão com o Mercado Pago será liberada na próxima etapa.";
  status.classList.add("is-success");
  form.querySelector(".checkout-payment-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
});
