import './site-readiness.mjs';

const REMOVED_TOY_SLUG = 'brinquedo-kit-caminhoes-basculantes';
const REPLACEMENT_TOY_SLUG = 'brinquedo-caminhao-bombeiro-escada';

const applyHomepageToySelection = () => {
  try {
    if (
      typeof catalogProducts === 'undefined'
      || typeof renderProducts !== 'function'
      || typeof isProductActive !== 'function'
    ) return;

    const removedToy = catalogProducts.find((product) => product.slug === REMOVED_TOY_SLUG);
    if (removedToy) removedToy.destaqueInfantil = false;

    const replacementToy = catalogProducts.find((product) => product.slug === REPLACEMENT_TOY_SLUG);
    if (replacementToy) replacementToy.destaqueInfantil = true;

    if (typeof document !== 'undefined' && document.querySelector('#toy-products')) {
      renderProducts(
        '#toy-products',
        catalogProducts
          .filter((product) => product.destaqueInfantil && isProductActive(product))
          .slice(0, 4)
      );
    }
  } catch {
    // Merchandising da home não deve bloquear o restante do catálogo.
  }
};

const cleanDuplicateTopNavigation = () => {
  try {
    if (typeof document === 'undefined') return;
    document
      .querySelectorAll('.nav-row a[href*="categoria=brinquedos-infantis"]')
      .forEach((link) => link.remove());
  } catch {
    // A limpeza visual do menu não deve bloquear a navegação principal.
  }
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  applyHomepageToySelection();
  cleanDuplicateTopNavigation();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyHomepageToySelection();
      cleanDuplicateTopNavigation();
    }, { once: true });
  }

  window.addEventListener('load', () => {
    applyHomepageToySelection();
    cleanDuplicateTopNavigation();
  }, { once: true });
}
