import { getMetadata, pages, productPath, jsonLd } from './seo/metadata.mjs';

const INVENTORY_ENDPOINT = 'https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/inventory-status';
const INVENTORY_PUBLIC_KEY = 'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
const COLLAR_SLUG = 'colarinho-clerical-palheta-pastores-pacote-7';
const COLLAR_IMAGE = 'data:image/webp;base64,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';

if (typeof catalogProducts !== 'undefined') {
  const collar = catalogProducts.find((product) => product.slug === 'brinquedo-kit-caminhoes-basculantes');
  if (collar) {
    Object.assign(collar, {
      id: COLLAR_SLUG,
      slug: COLLAR_SLUG,
      nome: 'Colarinho Clerical Palheta para Pastores (24x3 cm) — Pacote com 7',
      categoria: 'Acessórios Ministeriais',
      categoriaSlug: 'acessorios-ministeriais',
      imagem: COLLAR_IMAGE,
      imagens: [COLLAR_IMAGE],
      descricao: 'Pacote com 7 palhetas de colarinho clerical no tamanho 24 × 3 cm, indicado para uso com camisa clerical por pastores e ministros.',
      perfil: 'Uso ministerial',
      marca: null,
      preco: 28.00,
      precoOriginal: null,
      estoque: 0,
      testeCarrinho: false,
      fontePreco: 'Mercado Livre — preço informado pelo lojista e confirmado na busca',
      fontePrecoUrl: 'https://lista.mercadolivre.com.br/colarinho-clerical-palheta',
      dataConsultaPreco: '2026-09-12',
      destaque: false,
      maisVendido: false,
      destaqueInfantil: false,
      infantil: false,
      brinquedo: false,
      casa: false
    });
  }
  if (typeof faithCategorySlugs !== 'undefined') faithCategorySlugs.add('acessorios-ministeriais');
}

const refreshReleasedCatalog = async () => {
  if (typeof catalogProducts === 'undefined') return;
  try {
    const response = await fetch(INVENTORY_ENDPOINT, {
      headers: { apikey: INVENTORY_PUBLIC_KEY },
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.inventory)) return;

    const inventory = new Map(data.inventory.map((item) => [item.slug, item]));
    catalogProducts.forEach((product) => {
      const item = inventory.get(product.slug);
      if (!item || !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) return;
      product.preco = Number(item.unitPrice);
      product.estoque = Number.isInteger(item.available) ? Math.max(0, item.available) : 0;
      product.testeCarrinho = true;
    });

    if (typeof renderProducts === 'function') {
      renderProducts('#featured-products', catalogProducts.filter((product) => product.destaque && isProductActive(product)).slice(0, 4));
      renderProducts(
        '#featured-books',
        catalogProducts
          .filter((product) => product.maisVendidoLivro && isProductActive(product))
          .sort((first, second) => (first.ordemLivro ?? 999) - (second.ordemLivro ?? 999))
          .slice(0, 5)
      );
      renderProducts('#popular-products', catalogProducts.filter((product) => product.maisVendido && isProductActive(product)).slice(0, 4));
      renderProducts('#children-products', catalogProducts.filter((product) => product.infantil && isProductActive(product)).slice(0, 4));
      renderProducts('#toy-products', catalogProducts.filter((product) => product.destaqueInfantil && isProductActive(product)).slice(0, 4));
    }

    if (typeof catalogGrid !== 'undefined' && catalogGrid && typeof setCatalogFilter === 'function') {
      const activeFilter = document.querySelector('.catalog-filter.is-active')?.dataset.filter;
      setCatalogFilter(activeFilter || requestedCategory, requestedQuery);
    }
    if (typeof renderTestCart === 'function') renderTestCart();
  } catch {
  }
};

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
      link.href = productPath(product);
      link.textContent = heading.textContent;
      link.className = 'seo-product-link';
      heading.replaceChildren(link);
    });
    const key = location.pathname + location.search;
    if (key === previousKey) return;
    previousKey = key;
    const meta = getMetadata(file, new URLSearchParams(location.search), products);
    document.title = meta.title;
    const values = {
      'meta[name="description"]': meta.description,
      'meta[property="og:title"]': meta.title,
      'meta[property="og:description"]': meta.description,
      'meta[property="og:url"]': meta.canonical,
      'meta[property="og:image"]': meta.image,
      'meta[property="og:image:alt"]': meta.name
    };
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
  for (const element of document.querySelectorAll('.catalog-product-grid, #catalog-title, #product-dialog')) {
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-product-slug'] });
  }
  window.addEventListener('popstate', update);
  window.addEventListener('hashchange', update);
  window.addEventListener('load', update);
}

const CUSTOMER_PURCHASES_URL = 'https://www.chirho.com.br/minhas-compras.html';
document.querySelectorAll('.mobile-purchases-link, .mobile-header-actions').forEach((element) => element.remove());
document.querySelectorAll('a[href$="#conta"], a[aria-label="Minhas Compras"]').forEach((anchor) => {
  anchor.href = CUSTOMER_PURCHASES_URL;
  const label = anchor.querySelector('span');
  if (label) label.textContent = 'Minhas Compras';
  else anchor.textContent = 'Minhas Compras';
  anchor.setAttribute('aria-label', 'Minhas Compras');
});

if (!document.querySelector('#chi-rho-mobile-account-style')) {
  const mobileAccountStyle = document.createElement('style');
  mobileAccountStyle.id = 'chi-rho-mobile-account-style';
  mobileAccountStyle.textContent = `
    @media (max-width:700px){
      .header-row{grid-template-columns:44px minmax(0,1fr) 92px!important}
      .header-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:4px!important}
      .header-actions a{display:none!important}
      .header-actions a[aria-label="Minhas Compras"],
      .header-actions .header-cart-link,
      .header-actions a[href$="#carrinho"]{
        width:44px!important;
        height:44px!important;
        display:grid!important;
        place-items:center!important;
        padding:0!important;
        margin:0!important;
        font-size:24px!important;
        line-height:1!important;
        color:var(--navy)!important;
        text-decoration:none!important;
      }
      .header-actions a[aria-label="Minhas Compras"] span,
      .header-actions .header-cart-link span,
      .header-actions a[href$="#carrinho"] span{display:none!important}
    }
    @media (max-width:340px){
      .header-row{grid-template-columns:40px minmax(0,1fr) 84px!important;gap:6px 8px!important}
      .brand img{width:52px!important;height:52px!important;flex-basis:52px!important}
      .brand strong{font-size:19px!important}
      .header-actions a[aria-label="Minhas Compras"],
      .header-actions .header-cart-link,
      .header-actions a[href$="#carrinho"]{width:40px!important;height:40px!important;font-size:22px!important}
    }
  `;
  document.head.appendChild(mobileAccountStyle);
}

document.addEventListener('submit', (event) => {
  const form = event.target instanceof Element ? event.target.closest('.search') : null;
  if (!form) return;
  const query = form.querySelector('input[type="search"]')?.value.trim();
  if (!query) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  location.href = `catalogo-biblias.html?categoria=todas&q=${encodeURIComponent(query)}#catalogo`;
}, true);

const FAVORITES_STORAGE_KEY = 'chi-rho-favorites-v1';
const activeFavoriteSlugs = typeof catalogProducts !== 'undefined' && typeof isProductActive === 'function'
  ? new Set(catalogProducts.filter(isProductActive).map((product) => product.slug))
  : null;

const loadFavorites = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    const slugs = Array.isArray(stored) ? stored.filter((slug) => typeof slug === 'string') : [];
    return new Set(activeFavoriteSlugs ? slugs.filter((slug) => activeFavoriteSlugs.has(slug)) : slugs);
  } catch {
    return new Set();
  }
};

let favorites = loadFavorites();

const saveFavorites = () => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
  }
};

if (activeFavoriteSlugs) saveFavorites();

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
  document.querySelectorAll('a[href$="#favoritos"], a[data-favorites-link]').forEach((link) => {
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

  const favoritesLink = event.target.closest('a[href$="#favoritos"], a[data-favorites-link]');
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

refreshReleasedCatalog();
