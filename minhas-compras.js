const SUPABASE_URL = 'https://sailabcmcqdzrqhqztqs.supabase.co';
const PUBLIC_KEY = 'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
const FUNCTIONS = `${SUPABASE_URL}/functions/v1`;
const SESSION_KEY = 'chi_rho_customer_access_token';
const EMAIL_KEY = 'chi_rho_customer_pending_email';

const $ = (selector) => document.querySelector(selector);
const requestForm = $('#request-form');
const verifyForm = $('#verify-form');
const ordersSection = $('#orders-section');
const emailInput = $('#email');
const otpInput = $('#otp');
const requestButton = $('#request-button');
const verifyButton = $('#verify-button');
const resendButton = $('#resend-button');
const changeEmailButton = $('#change-email-button');
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
const normalizeEmail = (value) => {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
};

const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '';
const dateTime = (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
const label = (value) => String(value || 'Não informado').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

otpInput.addEventListener('input', () => { otpInput.value = digits(otpInput.value).slice(0, 10); });

const requestCode = async (value) => {
  const email = normalizeEmail(value);
  if (!email) throw new Error('Informe um e-mail válido.');
  const response = await fetch(`${FUNCTIONS}/customer-auth-request`, {
    method: 'POST',
    headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Não foi possível enviar o código agora.');
  sessionStorage.setItem(EMAIL_KEY, email);
  return body;
};

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  requestButton.disabled = true;
  hideNotice();
  try {
    const body = await requestCode(emailInput.value);
    showNotice(body?.message || 'Se os dados estiverem aptos para acesso, enviaremos o código por e-mail.', 'success');
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
  const email = sessionStorage.getItem(EMAIL_KEY);
  try {
    const response = await fetch(`${FUNCTIONS}/customer-auth-verify`, {
      method: 'POST',
      headers: { apikey: PUBLIC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otpInput.value })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.accessToken) throw new Error(body?.error || 'Não foi possível validar os dados informados.');
    sessionStorage.setItem(SESSION_KEY, body.accessToken);
    sessionStorage.removeItem(EMAIL_KEY);
    verifyForm.hidden = true;
    await loadOrders();
  } catch (error) {
    showNotice(error.message || 'Não foi possível validar os dados informados.', 'error');
  } finally {
    verifyButton.disabled = false;
  }
});

resendButton.addEventListener('click', async () => {
  const email = sessionStorage.getItem(EMAIL_KEY);
  if (!email) return resetLogin();
  resendButton.disabled = true;
  try {
    const body = await requestCode(email);
    showNotice(body?.message || 'Se os dados estiverem aptos para acesso, enviaremos o código por e-mail.', 'success');
  } catch (error) {
    showNotice(error.message || 'Aguarde alguns instantes antes de tentar novamente.', 'error');
  } finally {
    resendButton.disabled = false;
  }
});

changeEmailButton.addEventListener('click', () => resetLogin());
logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
  resetLogin();
});

function resetLogin() {
  ordersSection.hidden = true;
  verifyForm.hidden = true;
  requestForm.hidden = false;
  otpInput.value = '';
  sessionStorage.removeItem(EMAIL_KEY);
  hideNotice();
  emailInput.focus();
}

function renderOrders(payload) {
  $('#customer-name').textContent = payload?.customer?.firstName || 'cliente';
  ordersList.replaceChildren();
  const orders = Array.isArray(payload?.orders) ? payload.orders : [];
  if (!orders.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<strong>Nenhuma compra encontrada.</strong><span>Use o mesmo e-mail informado no checkout. Se a compra foi recente, aguarde alguns instantes e tente novamente.</span>';
    ordersList.appendChild(empty);
    return;
  }
  for (const order of orders) {
    const card = document.createElement('article');
    card.className = 'order-card';
    const itemRows = (order.items || []).map((item) => `<div class="order-item"><span>${safe(item.product_name)} × ${Number(item.quantity || 0)}</span><strong>${money(item.line_total)}</strong></div>`).join('');
    const tracking = order.tracking_code
      ? `<a class="tracking-link" href="${safe(order.tracking_url || '#')}" ${order.tracking_url ? 'target="_blank" rel="noopener noreferrer"' : ''}>Rastrear pedido: ${safe(order.tracking_code)} →</a>`
      : '<span class="tracking-pending">Rastreio disponível após a postagem.</span>';
    const delivery = [order.shipping_carrier, order.shipping_service].filter(Boolean).map(label).join(' • ');
    const destination = [order.city, order.state].filter(Boolean).join(' - ');
    const history = Array.isArray(order.history) ? order.history : [];
    const historyRows = history.slice(-5).reverse().map((event) => `
      <li>
        <span>${safe(label(event.status))}</span>
        <time>${safe(dateTime(event.created_at))}</time>
        ${event.note ? `<small>${safe(event.note)}</small>` : ''}
      </li>`).join('');
    card.innerHTML = `
      <div class="order-top">
        <div>
          <div class="order-code">Pedido ${safe(order.code)}</div>
          <div class="order-date">Realizado em ${date(order.created_at)}</div>
        </div>
        <span class="order-total-chip">${money(order.grand_total)}</span>
      </div>
      <div class="status-grid">
        <div class="status-box"><small>Pagamento</small><strong>${safe(label(order.financial_status))}</strong></div>
        <div class="status-box"><small>Pedido</small><strong>${safe(label(order.operational_status))}</strong></div>
      </div>
      <div class="order-summary-grid">
        ${order.payment_method ? `<div><small>Forma de pagamento</small><strong>${safe(label(order.payment_method))}</strong></div>` : ''}
        ${delivery ? `<div><small>Entrega</small><strong>${safe(delivery)}</strong></div>` : ''}
        ${destination ? `<div><small>Destino</small><strong>${safe(destination)}</strong></div>` : ''}
        ${order.shipped_at ? `<div><small>Postado em</small><strong>${safe(date(order.shipped_at))}</strong></div>` : ''}
      </div>
      <div class="order-items">${itemRows || '<span>Itens indisponíveis para exibição.</span>'}</div>
      <div class="order-values">
        <div><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div>
        ${Number(order.shipping_price || 0) > 0 ? `<div><span>Frete</span><strong>${money(order.shipping_price)}</strong></div>` : ''}
        ${Number(order.discount || 0) > 0 ? `<div><span>Desconto</span><strong>- ${money(order.discount)}</strong></div>` : ''}
        <div class="order-total"><span>Total</span><span>${money(order.grand_total)}</span></div>
      </div>
      <div class="tracking-area">${tracking}</div>
      ${historyRows ? `<details class="order-history"><summary>Acompanhar histórico do pedido</summary><ol>${historyRows}</ol></details>` : ''}
    `;
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
      showNotice('O acesso por e-mail ainda não está disponível. Nenhum pedido pode ser consultado sem autenticação.', 'error');
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
