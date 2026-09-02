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
    // Preview noindex, if present in the original response, must not be relaxed.
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
