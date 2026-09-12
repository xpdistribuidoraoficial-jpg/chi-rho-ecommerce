const LEGAL_LINKS = [
  ['Política de Privacidade', '/politica-de-privacidade.html'],
  ['Termos de Uso', '/termos-de-uso.html'],
  ['Trocas e Devoluções', '/trocas-e-devolucoes.html'],
  ['Política de Entrega', '/politica-de-entrega.html']
];

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

  // Legal pages do not load the large catalog script, so they need their own menu toggle.
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

const ensureLegalFooterLinks = () => {
  const grid = document.querySelector('.footer .footer-grid');
  if (!grid || grid.querySelector('.footer-policies')) return;
  const block = document.createElement('div');
  block.className = 'footer-policies';
  const title = document.createElement('strong');
  title.textContent = 'Políticas';
  block.appendChild(title);
  LEGAL_LINKS.forEach(([label, href]) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    block.appendChild(link);
  });
  grid.appendChild(block);

  [...grid.children].forEach((column) => {
    const heading = column.querySelector?.(':scope > strong');
    if (heading?.textContent?.trim() === 'Segurança') {
      const note = column.querySelector(':scope > span');
      if (note && /políticas serão adicionados|dados comerciais/i.test(note.textContent || '')) {
        note.textContent = 'Compra protegida, privacidade e políticas de atendimento.';
      }
    }
  });
};

const run = () => {
  ensureStyles();
  ensureMainAndSkipLink();
  enhanceMenuAccessibility();
  enhanceImages();
  ensureLegalFooterLinks();
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', run, { once: true });
}
