import assert from "node:assert/strict";
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

test("preços de brinquedos têm fonte específica e não inventam promoções", () => {
  const priced = toys.filter((product) => typeof product.preco === "number");
  assert.equal(priced.length, 2);
  priced.forEach((product) => {
    assert.ok(product.preco > 0);
    assert.match(product.fontePrecoUrl, /^https:\/\/www\.magazineluiza\.com\.br\/[^ ]+\/p\//);
    assert.equal(product.dataConsultaPreco, "2026-09-01");
    assert.equal(product.precoOriginal, undefined);
    assert.equal(product.precoPromocional, undefined);
  });
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
