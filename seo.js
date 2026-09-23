import { getMetadata, pages, productPath, jsonLd } from './seo/metadata.mjs';

const INVENTORY_ENDPOINT = 'https://sailabcmcqdzrqhqztqs.supabase.co/functions/v1/inventory-status';
const INVENTORY_PUBLIC_KEY = 'sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE';
const COLLAR_SLUG = 'colarinho-clerical-palheta-pastores-pacote-7';
const COLLAR_IMAGE = 'assets/products/colarinho-clerical-palheta-pastores-pacote-7.webp';

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
document.querySelectorAll('a[href$="#conta"], a[aria-label="Meus Pedidos"]').forEach((anchor) => {
  anchor.href = CUSTOMER_PURCHASES_URL;
  const label = anchor.querySelector('span');
  if (label) label.textContent = 'Meus Pedidos';
  else anchor.textContent = 'Meus Pedidos';
  anchor.setAttribute('aria-label', 'Meus Pedidos');
});

if (!document.querySelector('#chi-rho-mobile-account-style')) {
  const mobileAccountStyle = document.createElement('style');
  mobileAccountStyle.id = 'chi-rho-mobile-account-style';
  mobileAccountStyle.textContent = `
    @media (max-width:700px){
      .header-row{grid-template-columns:44px minmax(0,1fr) 92px!important}
      .header-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:4px!important}
      .header-actions a{display:none!important}
      .header-actions a[aria-label="Meus Pedidos"],
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
      .header-actions a[aria-label="Meus Pedidos"] span,
      .header-actions .header-cart-link span,
      .header-actions a[href$="#carrinho"] span{display:none!important}
    }
    @media (max-width:340px){
      .header-row{grid-template-columns:40px minmax(0,1fr) 84px!important;gap:6px 8px!important}
      .brand img{width:52px!important;height:52px!important;flex-basis:52px!important}
      .brand strong{font-size:19px!important}
      .header-actions a[aria-label="Meus Pedidos"],
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
