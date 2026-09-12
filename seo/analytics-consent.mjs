const GA_MEASUREMENT_ID = 'G-F8ZXRVDB72';
const CONSENT_KEY = 'chi-rho-consent-v1';
const CONSENT_VERSION = 1;

const readConsent = () => {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    if (!value || value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean') return null;
    return value;
  } catch {
    return null;
  }
};

const saveConsent = (analytics) => {
  const value = { version: CONSENT_VERSION, analytics: Boolean(analytics), updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    // Consent remains valid for this page load even if localStorage is unavailable.
  }
  return value;
};

const ensureGtag = () => {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
};

const setDefaultConsent = () => {
  ensureGtag();
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });
};

const loadGoogleAnalytics = () => {
  if (document.querySelector(`script[data-ga4-id="${GA_MEASUREMENT_ID}"]`)) return;
  ensureGtag();
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  script.dataset.ga4Id = GA_MEASUREMENT_ID;
  document.head.appendChild(script);
};

const disableAnalytics = () => {
  ensureGtag();
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
};

const closeBanner = () => document.querySelector('.cookie-consent')?.remove();

const applyConsent = (analytics, { persist = true } = {}) => {
  if (persist) saveConsent(analytics);
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = !analytics;
  if (analytics) loadGoogleAnalytics();
  else disableAnalytics();
  closeBanner();
};

const createPreferencesDialog = () => {
  let dialog = document.querySelector('#cookie-preferences-dialog');
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.id = 'cookie-preferences-dialog';
  dialog.className = 'cookie-preferences-dialog';
  dialog.innerHTML = `
    <form method="dialog" class="cookie-preferences-card">
      <div class="cookie-preferences-heading">
        <span>PRIVACIDADE</span>
        <h2>Preferências de cookies</h2>
        <p>Os recursos essenciais permanecem ativos para o funcionamento da loja. Você pode escolher se permite a medição de audiência pelo Google Analytics.</p>
      </div>
      <label class="cookie-preference-row">
        <span><strong>Necessários</strong><small>Usados para recursos essenciais, segurança, sessão e preferências da loja.</small></span>
        <input type="checkbox" checked disabled aria-label="Cookies necessários sempre ativos" />
      </label>
      <label class="cookie-preference-row">
        <span><strong>Analytics</strong><small>Ajuda a CHI RHO a entender visitas e uso do site. Só é ativado com sua autorização.</small></span>
        <input id="cookie-analytics-toggle" type="checkbox" />
      </label>
      <div class="cookie-preferences-actions">
        <button type="button" class="cookie-secondary" data-cookie-cancel>Cancelar</button>
        <button type="button" class="cookie-primary" data-cookie-save>Salvar preferências</button>
      </div>
    </form>`;
  document.body.appendChild(dialog);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector('[data-cookie-cancel]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-cookie-save]')?.addEventListener('click', () => {
    const analytics = Boolean(dialog.querySelector('#cookie-analytics-toggle')?.checked);
    applyConsent(analytics);
    dialog.close();
  });
  return dialog;
};

const openPreferences = () => {
  const dialog = createPreferencesDialog();
  const stored = readConsent();
  const toggle = dialog.querySelector('#cookie-analytics-toggle');
  if (toggle) toggle.checked = stored?.analytics === true;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
};

const createBanner = () => {
  if (document.querySelector('.cookie-consent')) return;
  const banner = document.createElement('section');
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Preferências de privacidade e cookies');
  banner.innerHTML = `
    <div class="cookie-consent-copy">
      <strong>Sua privacidade importa</strong>
      <p>Usamos recursos necessários para a loja funcionar. Com sua autorização, usamos Google Analytics para entender visitas e melhorar a experiência. <a href="/politica-de-privacidade.html">Política de Privacidade</a>.</p>
    </div>
    <div class="cookie-consent-actions">
      <button type="button" class="cookie-text" data-cookie-preferences>Preferências</button>
      <button type="button" class="cookie-secondary" data-cookie-necessary>Somente necessários</button>
      <button type="button" class="cookie-primary" data-cookie-accept>Aceitar Analytics</button>
    </div>`;
  document.body.appendChild(banner);
  banner.querySelector('[data-cookie-preferences]')?.addEventListener('click', openPreferences);
  banner.querySelector('[data-cookie-necessary]')?.addEventListener('click', () => applyConsent(false));
  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => applyConsent(true));
};

const bindPreferenceLinks = () => {
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-cookie-settings]') : null;
    if (!button) return;
    event.preventDefault();
    openPreferences();
  });
};

const init = () => {
  setDefaultConsent();
  bindPreferenceLinks();
  const stored = readConsent();
  if (stored) {
    applyConsent(stored.analytics, { persist: false });
    return;
  }
  createBanner();
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}
