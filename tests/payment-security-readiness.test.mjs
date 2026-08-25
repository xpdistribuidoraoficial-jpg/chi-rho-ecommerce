import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("variáveis financeiras permanecem sem valor no repositório", () => {
  const example = read(".env.example");
  for (const name of [
    "MERCADO_PAGO_ACCESS_TOKEN",
    "MERCADO_PAGO_PUBLIC_KEY",
    "MERCADO_PAGO_WEBHOOK_SECRET",
    "FRENET_PARTNER_TOKEN"
  ]) {
    assert.match(example, new RegExp(`^${name}=$`, "m"));
  }

  const files = [
    "checkout.js",
    "api/mercadopago/create-preference.js",
    "api/mercadopago-webhook.js",
    "supabase/functions/mercadopago-create-preference/index.ts",
    "supabase/functions/mercadopago-webhook/index.ts"
  ];
  const source = files.map(read).join("\n");
  assert.doesNotMatch(source, /\b(?:TEST|APP_USR)-\d{6,}-[A-Za-z0-9_-]{12,}/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'][^"']+["']/);
});

test("preferência fica bloqueada antes da chamada externa sem as três credenciais", () => {
  const source = read("supabase/functions/mercadopago-create-preference/index.ts");
  const gate = source.indexOf("if(!configured)");
  const providerCall = source.indexOf('fetch("https://api.mercadopago.com/checkout/preferences"');
  assert.ok(gate > -1 && providerCall > gate);
  for (const name of ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_PUBLIC_KEY", "MERCADO_PAGO_WEBHOOK_SECRET"]) {
    assert.ok(source.includes(name));
  }
  assert.ok(source.includes("external_reference:order.code"));
  assert.ok(source.includes('"X-Idempotency-Key":order.id'));
});

test("webhook valida HMAC, consulta o pagamento e cobre os status financeiros", () => {
  const source = read("supabase/functions/mercadopago-webhook/index.ts");
  assert.ok(source.includes("x-signature"));
  assert.ok(source.includes("x-request-id"));
  assert.ok(source.includes("HMAC"));
  assert.ok(source.includes("/v1/payments/"));
  for (const mapping of [
    'pending:"aguardando_pagamento"',
    'approved:"pago"',
    'rejected:"recusado"',
    'cancelled:"cancelado"',
    'refunded:"reembolsado"'
  ]) {
    assert.ok(source.includes(mapping), `Mapeamento ausente: ${mapping}`);
  }
  assert.ok(source.includes("apply_order_payment_status"));
});

test("página de sucesso não aprova pagamento pela URL", () => {
  const page = read("pagamento-sucesso.html");
  const behavior = read("pagamento-retorno.js");
  assert.ok(page.includes("Esta página, sozinha, não confirma o pagamento."));
  assert.ok(behavior.includes("public-order-status"));
  assert.ok(behavior.includes("order.financialStatus"));
});

test("checkout não injeta dados de frete ou pedido por HTML", () => {
  assert.doesNotMatch(read("checkout.js"), /\.innerHTML\s*=/);
});

test("páginas usam política CSP sem manipuladores inline", () => {
  const config = JSON.parse(read("vercel.json"));
  const globalHeaders = config.headers.find((entry) => entry.source === "/(.*)")?.headers || [];
  const csp = globalHeaders.find((header) => header.key === "Content-Security-Policy")?.value || "";
  assert.ok(csp.includes("script-src 'self'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
  for (const page of ["index.html", "quem-somos.html"]) {
    assert.doesNotMatch(read(page), /\son[a-z]+\s*=/i, `Manipulador inline encontrado: ${page}`);
  }
});

test("entradas públicas e administrativas mantêm viewport e breakpoints responsivos", () => {
  for (const page of [
    "index.html",
    "catalogo-biblias.html",
    "catalogo-infantil.html",
    "catalogo-casa.html",
    "checkout.html",
    "pagamento-sucesso.html",
    "pagamento-pendente.html",
    "pagamento-falhou.html",
    "admin-pedidos.html"
  ]) {
    assert.match(read(page), /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1(?:\.0)?"/i, `Viewport ausente: ${page}`);
  }

  const publicStyles = read("style.css");
  const adminStyles = read("admin.css");
  for (const breakpoint of ["980px", "900px", "700px", "620px", "560px"]) {
    assert.ok(publicStyles.includes(`max-width:${breakpoint}`), `Breakpoint público ausente: ${breakpoint}`);
  }
  assert.ok(adminStyles.includes("max-width:720px"));
});
