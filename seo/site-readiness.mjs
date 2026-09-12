import { COMPANY, COMPANY_ADDRESS_DISPLAY } from './company.mjs';

const LEGAL_LINKS = [
  ['Política de Privacidade', '/politica-de-privacidade.html'],
  ['Termos de Uso', '/termos-de-uso.html'],
  ['Trocas e Devoluções', '/trocas-e-devolucoes.html'],
  ['Política de Entrega', '/politica-de-entrega.html']
];

const RETIRED_PRODUCT_SLUGS = new Set([
  'biblia-arc-harpa',
  'biblia-king-james-estudo-holman',
  'cute-jesus-and-disciples'
]);

const SEARCH_URL = '/catalogo-biblias.html';
const FAVORITES_URL = '/catalogo-biblias.html?favoritos=1#catalogo';

const ensureStyles = () => {
  if (document.querySelector('link[data-readiness-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/readiness.css';
  link.dataset.readinessStyles = 'true';
  document.head.appendChild(link);
};

const ensureMainAndSkipLink = () => {
  const main = document.querySelector('main');
  if (!main) return;
  if (!main.id) main.id = 'main-content';
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = `#${main.id}`;
    skip.textContent = 'Pular para o conteúdo';
    document.body.prepend(skip);
  }
};

const enhanceMenuAccessibility = () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-row');
  if (!toggle || !nav) return;
  if (!nav.id) nav.id = 'primary-navigation';
  toggle.setAttribute('aria-controls', nav.id);
  toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');

  if (!toggle.dataset.readinessAriaBound) {
    toggle.dataset.readinessAriaBound = 'true';
    toggle.addEventListener('click', () => {
      requestAnimationFrame(() => {
        toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
      });
    });
  }

  const hasCatalogScript = Boolean(document.querySelector('script[src$="script.js"]'));
  if (!hasCatalogScript && !toggle.dataset.readinessToggleBound) {
    toggle.dataset.readinessToggleBound = 'true';
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    });
  }
};

const enhanceImages = () => {
  document.querySelectorAll('main img').forEach((image) => {
    if (image.closest('.hero,.catalog-hero')) return;
    if (!image.hasAttribute('loading')) image.loading = 'lazy';
    if (!image.hasAttribute('decoding')) image.decoding = 'async';
  });
};

const ensureHeaderUtilities = () => {
  document.querySelectorAll('form.search').forEach((form) => {
    form.action = `${SEARCH_URL}#catalogo`;
    form.method = 'get';
    const input = form.querySelector('input[type="search"]');
    if (input) {
      input.name = 'q';
      if (!input.hasAttribute('aria-label')) input.setAttribute('aria-label', 'Buscar produtos e categorias');
    }
    const button = form.querySelector('button');
    if (button) button.type = 'submit';
  });

  document.querySelectorAll('a[href$="#favoritos"], a[data-favorites-link]').forEach((link) => {
    link.href = FAVORITES_URL;
    link.dataset.favoritesLink = 'true';
    link.setAttribute('aria-label', 'Favoritos');
  });
};

const bindHeaderUtilities = () => {
  if (document.documentElement.dataset.headerUtilitiesBound === 'true') return;
  document.documentElement.dataset.headerUtilitiesBound = 'true';

  document.addEventListener('submit', (event) => {
    const form = event.target instanceof Element ? event.target.closest('form.search') : null;
    if (!form) return;
    const input = form.querySelector('input[type="search"]');
    const query = input?.value.trim() || '';
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!query) {
      input?.focus();
      return;
    }
    location.assign(`${SEARCH_URL}?categoria=todas&q=${encodeURIComponent(query)}#catalogo`);
  }, true);

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element
      ? event.target.closest('a[href$="#favoritos"], a[data-favorites-link]')
      : null;
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(FAVORITES_URL);
  }, true);
};

const makeFooterLink = (label, href) => {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  return link;
};

const makeFooterHeading = (label) => {
  const heading = document.createElement('strong');
  heading.textContent = label;
  return heading;
};

const footerColumnHeading = (column) => column?.querySelector?.(':scope > strong')?.textContent?.trim() || '';

const ensureFooterLayout = () => {
  const grid = document.querySelector('.footer .footer-grid');
  if (!grid) return;

  const columns = [...grid.children];
  const brand = grid.querySelector(':scope > .footer-brand') || columns[0] || null;
  let institutional = columns.find((column) => footerColumnHeading(column) === 'Institucional') || null;
  let categories = columns.find((column) => footerColumnHeading(column) === 'Categorias') || null;
  let policies = grid.querySelector(':scope > .footer-policies');
  const security = columns.find((column) => footerColumnHeading(column) === 'Segurança') || null;

  if (!institutional) institutional = document.createElement('div');
  institutional.classList.add('footer-institutional');
  institutional.replaceChildren(
    makeFooterHeading('Institucional'),
    makeFooterLink('Quem somos', '/quem-somos.html'),
    makeFooterLink('Contato', '/#contato'),
    makeFooterLink('Minhas Compras', '/minhas-compras.html')
  );

  if (!categories) categories = document.createElement('div');
  categories.classList.add('footer-categories');
  categories.replaceChildren(
    makeFooterHeading('Categorias'),
    makeFooterLink('Fé', '/catalogo-biblias.html'),
    makeFooterLink('Casa', '/catalogo-casa.html#catalogo'),
    makeFooterLink('Infantil', '/catalogo-infantil.html#catalogo')
  );

  if (!policies) {
    policies = security || document.createElement('div');
    policies.classList.add('footer-policies');
  }
  policies.replaceChildren(makeFooterHeading('Políticas'));
  LEGAL_LINKS.forEach(([label, href]) => policies.appendChild(makeFooterLink(label, href)));
  const securityNote = document.createElement('span');
  securityNote.className = 'footer-security-note';
  securityNote.textContent = 'Compra protegida, privacidade e políticas de atendimento.';
  policies.appendChild(securityNote);

  if (security && security !== policies) security.remove();
  grid.querySelectorAll(':scope > .footer-policies').forEach((column) => {
    if (column !== policies) column.remove();
  });

  [brand, institutional, categories, policies].filter(Boolean).forEach((column) => grid.appendChild(column));
  [...grid.children].forEach((column) => {
    if (![brand, institutional, categories, policies].includes(column)) column.remove();
  });
};

const ensureCompanyIdentity = () => {
  document.querySelectorAll('.legal-card').forEach((card) => {
    if (card.querySelector('.legal-company-identity')) return;
    const section = document.createElement('section');
    section.className = 'legal-company-identity';
    section.setAttribute('aria-label', 'Identificação do fornecedor');

    const heading = document.createElement('h2');
    heading.textContent = 'Identificação do fornecedor';
    section.appendChild(heading);

    [
      ['Razão social', COMPANY.legalName],
      ['CNPJ', COMPANY.cnpj],
      ['Responsável', COMPANY.responsible],
      ['Endereço', COMPANY_ADDRESS_DISPLAY],
      ['Atendimento', COMPANY.phoneDisplay]
    ].forEach(([label, value]) => {
      const paragraph = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      paragraph.append(strong, document.createTextNode(value));
      section.appendChild(paragraph);
    });

    const updated = card.querySelector('.legal-updated');
    if (updated) updated.after(section);
    else card.prepend(section);
  });

  const footer = document.querySelector('.footer');
  const grid = footer?.querySelector('.footer-grid');
  if (!footer || !grid || footer.querySelector('.footer-company-identity')) return;
  const companyLine = document.createElement('div');
  companyLine.className = 'footer-company-identity';
  companyLine.textContent = `${COMPANY.legalName} • CNPJ ${COMPANY.cnpj} • ${COMPANY_ADDRESS_DISPLAY} • Atendimento ${COMPANY.phoneDisplay}`;
  grid.insertAdjacentElement('afterend', companyLine);
};

const removeRetiredProducts = () => {
  const directProduct = new URLSearchParams(location.search).get('produto');
  if (directProduct && RETIRED_PRODUCT_SLUGS.has(directProduct)) {
    location.replace('/catalogo-biblias.html#catalogo');
    return;
  }

  let changed = false;
  RETIRED_PRODUCT_SLUGS.forEach((slug) => {
    document.getElementById(slug)?.remove();
    document.querySelectorAll(`a[href*="produto=${encodeURIComponent(slug)}"]`).forEach((link) => {
      const card = link.closest('.catalog-product-card');
      if (card) card.remove();
      else link.remove();
      changed = true;
    });
  });
  if (changed) {
    const grid = document.querySelector('#catalog-products');
    const count = document.querySelector('#catalog-result-count');
    if (grid && count) count.textContent = `${grid.querySelectorAll('.catalog-product-card').length} produtos selecionados`;
  }
};

const run = () => {
  ensureStyles();
  ensureMainAndSkipLink();
  enhanceMenuAccessibility();
  enhanceImages();
  ensureHeaderUtilities();
  ensureFooterLayout();
  ensureCompanyIdentity();
  removeRetiredProducts();
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  bindHeaderUtilities();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', run, { once: true });
  const observer = new MutationObserver(() => {
    enhanceImages();
    ensureHeaderUtilities();
    ensureCompanyIdentity();
    removeRetiredProducts();
  });
  document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector('main');
    if (main) observer.observe(main, { childList: true, subtree: true });
  }, { once: true });
}
