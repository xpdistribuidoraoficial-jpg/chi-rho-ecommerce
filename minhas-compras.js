const SUPABASE_URL = 'https://sailabcmcqdzrqhqztqs.supabase.co';
const PUBLIC_KEY = 'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
const FUNCTIONS = `${SUPABASE_URL}/functions/v1`;
const SESSION_KEY = 'chi_rho_customer_access_token';
const WHATSAPP_KEY = 'chi_rho_customer_pending_whatsapp';

const $ = (selector) => document.querySelector(selector);
const requestForm = $('#request-form');
const verifyForm = $('#verify-form');
const ordersSection = $('#orders-section');
const whatsappInput = $('#whatsapp');
const otpInput = $('#otp');
const requestButton = $('#request-button');
const verifyButton = $('#verify-button');
const resendButton = $('#resend-button');
const changeNumberButton = $('#change-number-button');
const logoutButton = $('#logout-button');
const notice = $('#availability-message');
const ordersList = $('#orders-list');

const showNotice = (message, type = '') => {
  notice.textContent = message;
  notice.className = `notice${type ? ` ${type}` : ''}`;
  notice.hidden = false;
};

const hideNotice = () => { notice.hidden = true; };

const digits = (value) => String(value || '').replace(/\D/g, '');
const formatWhatsapp = (value) => {
  let number = digits(value).slice(0, 11);
  if (number.length > 2) number = `(${number.slice(0, 2)}) ${number.slice(2)}`;
  if (number.length > 10) {
    const raw = digits(number);
    number = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  } else if (digits(number).length > 6) {
    const raw = digits(number);
    number = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6, 10)}`;
  }
  return number;
};

const canonicalWhatsapp = (value) => {
  const raw = digits(value);
  const national = raw.startsWith('55') && (raw.length === 12 || raw.length === 13) ? raw.slice(2) : raw;
  if (!/^[1-9]\d[2-9]\d{7,8}$/.test(national)) return null;
  return `55${national}`;
};

const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '';
const label = (value) => String(value || 'Não informado').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

whatsappInput.addEventListener('input', () => { whatsappInput.value = formatWhatsapp(whatsappInput.value); });
otpInput.addEventListener('input', () => { otpInput.value = digits(otpInput.value).slice(0, 10); });

const requestCode = async (whatsapp) => {
  const canonical = canonicalWhatsapp(whatsapp);
  if (!canonical) throw new Error('Informe um WhatsApp válido com DDD.');
  const response = await fetch(`${FUNCTIONS}/customer-auth-request`, {
    method: 'POST',
    headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp: canonical })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Não foi possível enviar o código agora.');
  sessionStorage.setItem(WHATSAPP_KEY, canonical);
  return body;
};

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  requestButton.disabled = true;
  hideNotice();
  try {
    const body = await requestCode(whatsappInput.value);
    showNotice(body?.message || 'Se os dados estiverem aptos para acesso, enviaremos as instruções pelo WhatsApp.', 'success');
    requestForm.hidden = true;
    verifyForm.hidden = false;
    otpInput.focus();
  } catch (error) {
    showNotice(error.message || 'Não foi possível enviar o código agora.', 'error');
  } finally {
    requestButton.disabled = false;
  }
});

verifyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  verifyButton.disabled = true;
  hideNotice();
  const whatsapp = sessionStorage.getItem(WHATSAPP_KEY);
  try {
    const response = await fetch(`${FUNCTIONS}/customer-auth-verify`, {
      method: 'POST',
      headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp, code: otpInput.value })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.accessToken) throw new Error(body?.error || 'Não foi possível validar os dados informados.');
    sessionStorage.setItem(SESSION_KEY, body.accessToken);
    sessionStorage.removeItem(WHATSAPP_KEY);
    verifyForm.hidden = true;
    await loadOrders();
  } catch (error) {
    showNotice(error.message || 'Não foi possível validar os dados informados.', 'error');
  } finally {
    verifyButton.disabled = false;
  }
});

resendButton.addEventListener('click', async () => {
  const whatsapp = sessionStorage.getItem(WHATSAPP_KEY);
  if (!whatsapp) return resetLogin();
  resendButton.disabled = true;
  try {
    const body = await requestCode(whatsapp);
    showNotice(body?.message || 'Se os dados estiverem aptos para acesso, enviaremos as instruções pelo WhatsApp.', 'success');
  } catch (error) {
    showNotice(error.message || 'Aguarde alguns instantes antes de tentar novamente.', 'error');
  } finally {
    resendButton.disabled = false;
  }
});

changeNumberButton.addEventListener('click', () => resetLogin());
logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(WHATSAPP_KEY);
  resetLogin();
});

function resetLogin() {
  ordersSection.hidden = true;
  verifyForm.hidden = true;
  requestForm.hidden = false;
  otpInput.value = '';
  sessionStorage.removeItem(WHATSAPP_KEY);
  hideNotice();
  whatsappInput.focus();
}

function renderOrders(payload) {
  $('#customer-name').textContent = payload?.customer?.firstName || 'cliente';
  ordersList.replaceChildren();
  const orders = Array.isArray(payload?.orders) ? payload.orders : [];
  if (!orders.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma compra disponível para esta conta no momento.';
    ordersList.appendChild(empty);
    return;
  }
  for (const order of orders) {
    const card = document.createElement('article');
    card.className = 'order-card';
    const itemRows = (order.items || []).map((item) => `<div class="order-item"><span>${safe(item.product_name)} × ${Number(item.quantity || 0)}</span><strong>${money(item.line_total)}</strong></div>`).join('');
    const tracking = order.tracking_code
      ? `<a class="tracking-link" href="${safe(order.tracking_url || '#')}" ${order.tracking_url ? 'target="_blank" rel="noopener noreferrer"' : ''}>Rastreio: ${safe(order.tracking_code)} →</a>`
      : '';
    card.innerHTML = `<div class="order-top"><div><div class="order-code">Pedido ${safe(order.code)}</div><div class="order-date">${date(order.created_at)}</div></div></div><div class="status-grid"><div class="status-box"><small>Pagamento</small><strong>${safe(label(order.financial_status))}</strong></div><div class="status-box"><small>Pedido</small><strong>${safe(label(order.operational_status))}</strong></div></div><div class="order-items">${itemRows || '<span>Itens indisponíveis para exibição.</span>'}</div><div class="order-total"><span>Total</span><span>${money(order.grand_total)}</span></div>${tracking}`;
    ordersList.appendChild(card);
  }
}

async function loadOrders() {
  const token = sessionStorage.getItem(SESSION_KEY);
  if (!token) return resetLogin();
  try {
    const response = await fetch(`${FUNCTIONS}/customer-orders`, { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      throw new Error('Sua sessão expirou. Solicite um novo código.');
    }
    if (!response.ok) throw new Error(payload?.error || 'Não foi possível carregar suas compras agora.');
    requestForm.hidden = true;
    verifyForm.hidden = true;
    ordersSection.hidden = false;
    hideNotice();
    renderOrders(payload);
  } catch (error) {
    ordersSection.hidden = true;
    requestForm.hidden = false;
    showNotice(error.message || 'Não foi possível carregar suas compras agora.', 'error');
  }
}

async function checkAvailability() {
  try {
    const response = await fetch(`${FUNCTIONS}/customer-auth-request`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.available !== true) {
      requestButton.disabled = true;
      showNotice('O acesso por WhatsApp está sendo preparado e ainda não está disponível. Nenhum pedido pode ser consultado sem autenticação.', 'error');
      return false;
    }
    return true;
  } catch {
    requestButton.disabled = true;
    showNotice('Não foi possível verificar o serviço de acesso agora. Tente novamente mais tarde.', 'error');
    return false;
  }
}

(async () => {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    await loadOrders();
    return;
  }
  await checkAvailability();
})();
