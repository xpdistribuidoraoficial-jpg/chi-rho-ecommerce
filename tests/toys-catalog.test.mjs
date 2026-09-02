import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = fs.readFileSync(new URL("script.js", root), "utf8");
const context = {};
vm.runInNewContext(`${source.slice(0, source.indexOf("const toggle"))};this.audit={catalogProducts,getProductCartAvailability};`, context);
const { catalogProducts, getProductCartAvailability } = context.audit;
const toys = catalogProducts.filter((product) => product.brinquedo);
const before = JSON.parse(fs.readFileSync(new URL("audits/toys-before-2026-09-01.json", root), "utf8"));

test("auditoria de brinquedos preserva todos os registros e seus estoques", () => {
  assert.equal(toys.length, before.toys.length);
  before.toys.forEach((original) => {
    const current = toys.find((product) => product.slug === original.slug);
    assert.ok(current, original.slug);
    assert.equal(current.id, original.id);
    assert.equal(current.estoque, original.estoque);
    assert.equal(current.categoriaSlug, original.categoriaSlug);
    assert.equal(current.testeCarrinho, original.testeCarrinho);
    assert.equal(getProductCartAvailability(current).available, false);
  });
});

const approvedPrices = {
  "brinquedo-caminhao-bombeiro-resgate": [2699, 2294],
  "brinquedo-caminhao-bau-46cm": [3899, 3314],
  "brinquedo-caminhao-boi-4-bois": [2696, 2292],
  "brinquedo-caminhao-bombeiro-escada": [2990, 2542],
  "brinquedo-trator-pa-carregadeira": [3390, 2882],
  "brinquedo-jeep-trilha": [2798, 2378],
  "brinquedo-trator-grande-articulado": [5826, 4952],
  "brinquedo-carreta-basculante-24cm": [2290, 1947],
  "brinquedo-onibus-speed-bus": [3990, 3392],
  "brinquedo-kit-carretas-boiadeiro": [6990, 5942]
};

test("dez brinquedos recebem preços cheios aprovados e 15% com arredondamento em centavos", () => {
  const priced = toys.filter((product) => typeof product.preco === "number");
  assert.equal(priced.length, 10);
  priced.forEach((product) => {
    const [fullCents, discountedCents] = approvedPrices[product.slug];
    assert.equal(product.precoOriginal, fullCents / 100);
    assert.equal(product.preco, discountedCents / 100);
    assert.equal(discountedCents, Math.round(fullCents * 85 / 100));
    assert.equal(product.fontePrecoUrl, "https://lista.mercadolivre.com.br/brinquedos-hobbies/_CustId_222722705");
    assert.match(product.fontePreco, /aprovado pelo lojista.*capturas.*15%/);
    assert.equal(product.dataConsultaPreco, "2026-09-02");
    assert.equal(product.precoPromocional, undefined);
  });
});

test("versões não identificadas não recebem preço ou desconto de outro produto", () => {
  const pending = toys.filter((product) => !approvedPrices[product.slug]);
  assert.deepEqual(Array.from(pending, (p) => p.slug).sort(), [
    "brinquedo-blocos-104-pecas", "brinquedo-kit-caminhoes-basculantes"
  ]);
  pending.forEach((product) => {
    assert.equal(product.preco, null);
    assert.equal(product.precoOriginal, undefined);
  });
});

test("desconto preserva outras categorias e todos os campos não comerciais dos brinquedos", () => {
  const priceFields = new Set(["preco", "precoOriginal", "fontePreco", "fontePrecoUrl", "dataConsultaPreco"]);
  const unchanged = JSON.parse(JSON.stringify(catalogProducts)).map((product) => product.brinquedo
    ? Object.fromEntries(Object.entries(product).filter(([key]) => !priceFields.has(key)))
    : product);
  assert.equal(createHash("sha256").update(JSON.stringify(unchanged)).digest("hex"),
    "72c19b111d57422b31b80a72eda215ae29a1a2e29b6a924bb221aa374f27828b");
});

test("preço cheio e promocional usam a mesma renderização nos cards e nos detalhes", () => {
  const prices = {};
  vm.runInNewContext(source.slice(source.indexOf("const formatProductPrice"), source.indexOf("const getProductMeta"))
    + ";this.markup=getProductPriceMarkup;", prices);
  toys.filter((product) => approvedPrices[product.slug]).forEach((product) => {
    const markup = prices.markup(product);
    const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    assert.ok(markup.includes(`<del class="product-price-original">De: ${money(product.precoOriginal)}</del>`));
    assert.ok(markup.includes(`Por: ${money(product.preco)}`));
  });
  assert.ok(source.includes('<div class="catalog-product-price" aria-label="Preço">${getProductPriceMarkup(product)}</div>'));
  const elements = new Map();
  const dialogContext = {
    getProductPriceMarkup: prices.markup,
    productDialogElement: { querySelector: (selector) => elements.get(selector) }
  };
  vm.runInNewContext(source.slice(source.indexOf("const setProductDialogPrice"), source.indexOf("const setBookDialogUrl"))
    + ";this.render=setProductDialogPrice;", dialogContext);
  for (const selector of ["#product-dialog-status", "#product-dialog-simple-status"]) {
    const element = { innerHTML: "" };
    elements.set(selector, element);
    for (const product of toys) {
      dialogContext.render(selector, product);
      assert.equal(element.innerHTML, prices.markup(product));
    }
    assert.ok(source.includes(`setProductDialogPrice("${selector}", product);`));
  }
});

test("imagens dos brinquedos são locais e galeria não repete arquivos", () => {
  toys.forEach((product) => {
    const images = product.imagens || [product.imagem];
    assert.equal(images[0], product.imagem);
    assert.equal(new Set(images).size, images.length);
    images.forEach((path) => {
      assert.match(path, /^assets\/products\/brinquedo-/);
      assert.ok(fs.statSync(new URL(path, root)).size > 1000);
    });
  });
  assert.equal(toys.find((p) => p.slug === "brinquedo-trator-pa-carregadeira").imagens.length, 2);
});

test("GTIN confirmado passa no dígito verificador e medidas distinguem embalagem", () => {
  toys.filter((product) => product.isbn).forEach((product) => {
    assert.match(product.isbn, /^\d{13}$/);
    const digits = [...product.isbn].map(Number);
    const sum = digits.slice(0, 12).reduce((total, digit, i) => total + digit * (i % 2 ? 3 : 1), 0);
    assert.equal((10 - sum % 10) % 10, digits[12]);
  });
  assert.match(toys.find((p) => p.slug === "brinquedo-onibus-speed-bus").dimensoes, /embalagem/);
  assert.match(toys.find((p) => p.slug === "brinquedo-trator-grande-articulado").dimensoes, /produto/);
});
