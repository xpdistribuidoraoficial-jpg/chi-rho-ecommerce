import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("painel ignora respostas antigas ao trocar filtros rapidamente", () => {
  const source = read("admin-pedidos.js");
  assert.ok(source.includes("ordersRequestSequence=0"));
  assert.ok(source.includes("const requestSequence=++ordersRequestSequence"));
  assert.ok(source.match(/requestSequence!==ordersRequestSequence/g)?.length >= 2);
});

test("painel usa somente funções administrativas autenticadas", () => {
  const source = read("admin-pedidos.js");
  assert.ok(source.includes("/functions/v1/admin-orders"));
  assert.ok(source.includes("/functions/v1/admin-shipping-label"));
  assert.ok(source.includes("Authorization:`Bearer ${session.access_token}`"));
  assert.ok(source.includes('sessionStorage.setItem(SESSION_KEY'));
  assert.ok(!source.includes("SUPABASE_SERVICE_ROLE_KEY"));
});
