import { getMetadata, pages, productPath, jsonLd } from './seo/metadata.mjs';

// Presentation only. Existing catalog, gallery, filters and cart remain owners of state.
const file = location.pathname.split('/').pop() || 'index.html';
const base = pages[file];
if (base && typeof catalogProducts !== 'undefined') {
  const products = catalogProducts.filter(isProductActive);
  const h1 = document.querySelector('h1');
  const originalHeading = h1?.dataset.baseHeading || h1?.innerHTML;
  let previousKey = '';
  const update = () => {
    document.querySelectorAll('.catalog-product-card').forEach((card) => {
      const heading = card.querySelector('h3');
      const product = products.find((p) => p.slug === card.id);
      if (!product || !heading || heading.querySelector('a')) return;
      const link = document.createElement('a');
      link.href = productPath(product); link.textContent = heading.textContent;
      link.className = 'seo-product-link'; heading.replaceChildren(link);
    });
    const key = location.pathname + location.search;
    if (key === previousKey) return;
    previousKey = key;
    const meta = getMetadata(file, new URLSearchParams(location.search), products);
    document.title = meta.title;
    const values = { 'meta[name="description"]': meta.description, 'meta[property="og:title"]': meta.title, 'meta[property="og:description"]': meta.description, 'meta[property="og:url"]': meta.canonical, 'meta[property="og:image"]': meta.image, 'meta[property="og:image:alt"]': meta.name };
    for (const [selector, value] of Object.entries(values)) document.querySelector(selector)?.setAttribute('content', value);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', meta.canonical);
    const robots = document.querySelector('meta[name="robots"]');
    if (robots && location.hostname === 'www.chirho.com.br') robots.content = meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
    const schema = document.querySelector('#chi-rho-schema');
    if (schema) schema.textContent = jsonLd(meta.schema);
    if (h1) {
      if (meta.heading) h1.textContent = meta.heading;
      else h1.innerHTML = originalHeading;
    }
  };
  update();
  const observer = new MutationObserver(update);
  for (const element of document.querySelectorAll('.catalog-product-grid, #catalog-title, #product-dialog')) observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-product-slug'] });
  window.addEventListener('popstate', update);
  window.addEventListener('hashchange', update);
  window.addEventListener('load', update);
}

// Customer purchases entry.
document.querySelectorAll('a[href="#conta"], a[aria-label="Minhas Compras"]').forEach((anchor) => {
  anchor.href = 'minhas-compras.html';
  const label = anchor.querySelector('span');
  if (label) label.textContent = 'Minhas Compras';
  else anchor.textContent = 'Minhas Compras';
  anchor.setAttribute('aria-label', 'Minhas Compras');
});

// Favorites are stored locally in the shopper's browser and do not affect cart, checkout or inventory.
const FAVORITES_STORAGE_KEY = 'chi-rho-favorites-v1';

const loadFavorites = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter((slug) => typeof slug === 'string') : []);
  } catch {
    return new Set();
  }
};

let favorites = loadFavorites();

const saveFavorites = () => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Favorites continue to work during the current page even if storage is unavailable.
  }
};

const favoriteHeart = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 20.5 4.6 13.4A5.1 5.1 0 0 1 12 6.5a5.1 5.1 0 0 1 7.4 6.9L12 20.5Z" />
  </svg>
`;

const updateFavoriteButton = (button) => {
  const slug = button.dataset.favoriteSlug;
  const active = favorites.has(slug);
  button.classList.toggle('is-favorite', active);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
  button.title = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
};

const updateFavoriteHeader = () => {
  document.querySelectorAll('a[href="#favoritos"], a[data-favorites-link]').forEach((link) => {
    link.dataset.favoritesLink = 'true';
    let badge = link.querySelector('.favorites-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'favorites-count';
      badge.setAttribute('aria-label', 'Itens nos favoritos');
      link.appendChild(badge);
    }
    badge.textContent = String(favorites.size);
    badge.hidden = favorites.size === 0;
  });
};

const isFavoritesView = () => new URLSearchParams(location.search).get('favoritos') === '1';

const applyFavoritesView = () => {
  if (!isFavoritesView()) return;
  const cards = [...document.querySelectorAll('#catalog-products .catalog-product-card')];
  if (!cards.length) return;
  let visible = 0;
  cards.forEach((card) => {
    const show = favorites.has(card.id);
    card.hidden = !show;
    if (show) visible += 1;
  });
  const count = document.querySelector('#catalog-result-count');
  if (count) count.textContent = `${visible} ${visible === 1 ? 'produto favorito' : 'produtos favoritos'}`;
  const title = document.querySelector('#catalog-title');
  if (title) title.textContent = 'Meus Favoritos';
};

const decorateFavoriteCards = () => {
  document.querySelectorAll('.catalog-product-card').forEach((card) => {
    const image = card.querySelector('.catalog-product-image');
    if (!image || image.querySelector('[data-favorite-slug]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'catalog-favorite-button';
    button.dataset.favoriteSlug = card.id;
    button.innerHTML = favoriteHeart;
    updateFavoriteButton(button);
    image.appendChild(button);
  });
  updateFavoriteHeader();
  applyFavoritesView();
};

if (!document.querySelector('#chi-rho-favorites-style')) {
  const style = document.createElement('style');
  style.id = 'chi-rho-favorites-style';
  style.textContent = `
    .catalog-product-image{position:relative}
    .catalog-favorite-button{position:absolute;top:10px;right:10px;z-index:3;width:38px;height:38px;border:1px solid rgba(9,58,82,.18);border-radius:50%;background:rgba(255,255,255,.94);display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.10);transition:transform .18s ease,background .18s ease,border-color .18s ease}
    .catalog-favorite-button:hover{transform:scale(1.06)}
    .catalog-favorite-button svg{width:21px;height:21px;fill:none;stroke:#0b4a68;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .catalog-favorite-button.is-favorite{background:#fff3f3;border-color:#c54a54}
    .catalog-favorite-button.is-favorite svg{fill:#c54a54;stroke:#c54a54}
    .favorites-count{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;margin-left:3px;border-radius:999px;background:#c54a54;color:#fff;font-size:11px;font-weight:700;line-height:1}
    .favorites-count[hidden]{display:none!important}
    #catalog-products .catalog-product-card[hidden]{display:none!important}
    @media (max-width:600px){.catalog-favorite-button{top:8px;right:8px;width:34px;height:34px}.catalog-favorite-button svg{width:19px;height:19px}}
  `;
  document.head.appendChild(style);
}

document.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite-slug]');
  if (favoriteButton) {
    event.preventDefault();
    event.stopPropagation();
    const slug = favoriteButton.dataset.favoriteSlug;
    if (favorites.has(slug)) favorites.delete(slug);
    else favorites.add(slug);
    saveFavorites();
    document.querySelectorAll(`[data-favorite-slug="${CSS.escape(slug)}"]`).forEach(updateFavoriteButton);
    updateFavoriteHeader();
    applyFavoritesView();
    return;
  }

  const favoritesLink = event.target.closest('a[href="#favoritos"], a[data-favorites-link]');
  if (favoritesLink) {
    event.preventDefault();
    const catalog = document.querySelector('#catalog-products');
    if (catalog) {
      const url = new URL(location.href);
      url.searchParams.set('favoritos', '1');
      url.hash = 'catalogo';
      history.replaceState(null, '', url);
      applyFavoritesView();
      document.querySelector('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      location.href = 'catalogo-biblias.html?favoritos=1#catalogo';
    }
  }
});

decorateFavoriteCards();
const favoritesObserver = new MutationObserver(decorateFavoriteCards);
document.querySelectorAll('.catalog-product-grid, #catalog-products, #featured-products, #featured-books, #popular-products, #children-products, #toy-products').forEach((container) => {
  favoritesObserver.observe(container, { childList: true, subtree: true });
});
window.addEventListener('storage', (event) => {
  if (event.key !== FAVORITES_STORAGE_KEY) return;
  favorites = loadFavorites();
  document.querySelectorAll('[data-favorite-slug]').forEach(updateFavoriteButton);
  updateFavoriteHeader();
  applyFavoritesView();
});
