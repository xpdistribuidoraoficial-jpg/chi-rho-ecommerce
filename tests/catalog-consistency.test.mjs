import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

import { shippingProducts } from "../data/shipping-products.mjs";

const projectRoot = new URL("../", import.meta.url);
const source = fs.readFileSync(new URL("script.js", projectRoot), "utf8");
const styles = fs.readFileSync(new URL("style.css", projectRoot), "utf8");
const homeHtml = fs.readFileSync(new URL("index.html", projectRoot), "utf8");
const catalogEnd = source.indexOf("const toggle");
assert.notEqual(catalogEnd, -1, "Não foi possível localizar o fim da definição do catálogo.");

const context = { console };
vm.runInNewContext(
  `${source.slice(0, catalogEnd)}\nglobalThis.__catalogAudit={catalogProducts,inactiveCatalogSlugs,getProductCartAvailability,clampProductCartQuantity};`,
  context
);

const {
  catalogProducts,
  inactiveCatalogSlugs,
  getProductCartAvailability,
  clampProductCartQuantity
} = context.__catalogAudit;
const activeProducts = catalogProducts.filter((product) => !inactiveCatalogSlugs.has(product.slug));
const orderableProducts = activeProducts.filter((product) => product.testeCarrinho === true);
const assetExists = (assetPath) => fs.existsSync(new URL(assetPath, projectRoot));

test("catálogo ativo não possui slugs duplicados nem imagens quebradas", () => {
  const slugs = activeProducts.map((product) => product.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  activeProducts.forEach((product) => {
    assert.ok(product.imagem, `Imagem principal ausente: ${product.slug}`);
    assert.ok(assetExists(product.imagem), `Imagem principal quebrada: ${product.slug}`);
    (product.imagens || []).forEach((image) => {
      assert.ok(assetExists(image), `Imagem de galeria quebrada: ${product.slug} (${image})`);
    });
  });
});

test("somente produtos com fonte logística entram no fluxo de compra", () => {
  assert.deepEqual(
    Array.from(orderableProducts, (product) => product.slug).sort(),
    Object.keys(shippingProducts).sort()
  );
});

test("preço e estoque do catálogo conferem com carrinho e frete", () => {
  orderableProducts.forEach((product) => {
    const shippingProduct = shippingProducts[product.slug];
    assert.equal(product.preco, shippingProduct.price, `Preço divergente: ${product.slug}`);
    assert.equal(product.estoque, shippingProduct.stock, `Estoque divergente: ${product.slug}`);
    assert.ok(shippingProduct.sku, `SKU ausente: ${product.slug}`);
    for (const field of ["weight", "length", "width", "height"]) {
      assert.ok(Number(shippingProduct[field]) > 0, `${field} inválido: ${product.slug}`);
    }
  });
});

test("catálogo mantém pendências comerciais fora do checkout", () => {
  const missingPrice = activeProducts.filter((product) => typeof product.preco !== "number");
  const zeroPrice = activeProducts.filter((product) => product.preco === 0);
  const duplicateSlugs = activeProducts.filter((product, index) =>
    activeProducts.findIndex((candidate) => candidate.slug === product.slug) !== index
  );

  assert.equal(catalogProducts.length, 73);
  assert.equal(activeProducts.length, 63);
  assert.equal(orderableProducts.length, 2);
  assert.equal(missingPrice.length, 4);
  assert.equal(zeroPrice.length, 0);
  assert.equal(duplicateSlugs.length, 0);
});

test("kit de basculantes é retirado da vitrine sem apagar seu registro", () => {
  const slug = "brinquedo-kit-caminhoes-basculantes";
  assert.ok(catalogProducts.some((product) => product.slug === slug));
  assert.ok(inactiveCatalogSlugs.has(slug));
  assert.ok(!activeProducts.some((product) => product.slug === slug));
  assert.equal(activeProducts.filter((product) => product.brinquedo).length, 11);
  assert.equal(activeProducts.filter((product) => product.brinquedo && product.precoOriginal).length, 10);
  assert.ok(source.includes('catalogProducts.find((item) => item.slug === slug && isProductActive(item))'));
  assert.ok(source.includes('product.slug === initialProductSlug && isProductActive(product)'));
});

test("controle dos cards respeita disponibilidade e limites de estoque", () => {
  const product = orderableProducts[0];
  const pendingProduct = activeProducts.find((item) => item.testeCarrinho !== true);
  const outOfStockProduct = { ...product, estoque: 0 };

  assert.equal(getProductCartAvailability(product).available, true);
  assert.equal(getProductCartAvailability(pendingProduct).available, false);
  assert.equal(getProductCartAvailability(outOfStockProduct).available, false);
  assert.equal(clampProductCartQuantity(product, -5), 1);
  assert.equal(clampProductCartQuantity(product, 1), 1);
  assert.equal(clampProductCartQuantity(product, product.estoque + 10), product.estoque);
  assert.equal(clampProductCartQuantity(product, 0, { allowZero: true }), 0);
});

test("cards reutilizam o carrinho existente com proteção contra clique duplicado", () => {
  assert.match(source, /getProductCardCartMarkup\(product\)/);
  assert.match(source, /data-card-quantity-action="decrease"/);
  assert.match(source, /data-card-quantity-action="increase"/);
  assert.match(source, /data-card-add-cart/);
  assert.match(source, /cardAddButton\.dataset\.processing !== "true"/);
  assert.match(source, /updateTestCartQuantity\(slug, existingQuantity \+ selectedQuantity\)/);
  assert.match(source, /cardAddButton\.innerHTML = cardCartSuccessIcon/);
});

test("controles dos cards permanecem compactos e na mesma linha", () => {
  assert.match(styles, /\.catalog-product-cart\{[^}]*display:grid[^}]*grid-template-columns:minmax\(0,108px\) 42px/);
  assert.match(styles, /\.catalog-card-quantity\{[^}]*grid-template-columns:36px 36px 36px/);
  assert.match(styles, /\.catalog-card-add\{[^}]*width:42px[^}]*height:42px/);
});

test("home mobile mantém a grade compacta aprovada sem recriar o carrinho", () => {
  assert.match(homeHtml, /class="container universe-grid"/);
  assert.match(homeHtml, /class="universe-card" id="presentes"/);
  assert.match(homeHtml, /class="universe-copy-mobile">Bíblias, livros e EBD\.<\/span>/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*?\.universe-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.universe-card#infantil\{display:none\}/);
  assert.match(styles, /\.universe-card#presentes\{grid-column:1\/-1/);
  assert.match(styles, /\.featured-books-grid \.catalog-product-image\{aspect-ratio:16\/10/);
  assert.match(source, /updateTestCartQuantity\(slug, existingQuantity \+ selectedQuantity\)/);
});

test("home mobile integra marca, conteúdo e ações ao banner sem trocar os destinos", () => {
  assert.match(homeHtml, /class="header-cart-link" aria-label="Carrinho"/);
  assert.match(homeHtml, /<h1><span>Tudo para sua<\/span><em>casa, sua família<\/em><span>e sua fé\.<\/span><\/h1>/);
  assert.match(homeHtml, /href="#universos" class="btn btn-primary">Comprar agora →<\/a>/);
  assert.match(homeHtml, /href="#ofertas" class="btn btn-outline">Ver ofertas<\/a>/);
  assert.match(homeHtml, /banner-home-mobile\.webp/);
  assert.match(homeHtml, /fetchpriority="high"/);

  const mobileStyles = styles.slice(styles.indexOf("@media(max-width:700px)"), styles.indexOf("@media(max-width:360px)"));
  assert.match(mobileStyles, /grid-template-areas:\s*"menu brand actions"\s*"search search search"/);
  assert.match(mobileStyles, /\.brand\{[^}]*justify-self:center/);
  assert.match(mobileStyles, /\.header-actions \.header-cart-link\{[^}]*display:grid/);
  assert.match(mobileStyles, /\.hero-copy\{[^}]*grid-area:1\/1/);
  assert.match(mobileStyles, /\.hero-media\{[^}]*grid-area:1\/1/);
  assert.match(mobileStyles, /\.hero-media::after\{[\s\S]*?linear-gradient/);
  assert.match(mobileStyles, /\.hero-media img\{[^}]*height:100%[^}]*object-fit:cover/);
  assert.match(mobileStyles, /\.hero-benefits\{[^}]*position:absolute[^}]*top:calc\(100% \+ 14px\)/);
});
