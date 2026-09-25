import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOrderFilters, PAGE_SIZE } from "../supabase/functions/admin-orders/order-filters.mjs";
const build = values => buildOrderFilters(new URLSearchParams(values));
test("combina busca, pagamento, etapa, entrega e arquivados",()=>{
  const {params}=build({q:"José CHR-123",financial:"cancelado",operational:"cancelado",delivery:"pickup",archive:"archived"});
  assert.equal(params.get("financial_status"),"eq.cancelado");
  assert.equal(params.get("operational_status"),"eq.cancelado");
  assert.equal(params.get("shipping_carrier_code"),"eq.PICKUP_VENDOR");
  assert.equal(params.get("admin_order_archives"),"not.is.null");
  assert.match(params.get("and"),/José CHR-123/);
});
test("padrão exclui arquivados e pagina sem truncar a consulta",()=>{
  assert.equal(build({}).params.get("admin_order_archives"),"is.null");
  assert.equal(build({page:"2"}).params.get("offset"),String(PAGE_SIZE));
  assert.equal(build({}).params.get("limit"),String(PAGE_SIZE+1));
  assert.equal(build({archive:"all"}).params.has("admin_order_archives"),false);
});
test("período inclusivo usa horário de Brasília",()=>{
  const {params}=build({from:"2026-09-01",to:"2026-09-24"});
  assert.deepEqual(params.getAll("created_at"),["gte.2026-09-01T00:00:00-03:00","lt.2026-09-25T03:00:00.000Z"]);
});
test("rejeita datas e filtros inválidos",()=>{
  for(const values of [{from:"2026-02-30"},{from:"2026-10-01",to:"2026-09-01"},{financial:"in.(pago)"},{archive:"delete"},{delivery:"bad"},{page:"0"},{page:"-1"}]) assert.throws(()=>build(values));
});
test("busca não aceita operadores PostgREST e combina transportadora",()=>{
  const {params}=build({q:'abc*,()_%".id.eq.1',delivery:"shipping"});
  assert.equal(params.get("and"),"(or(code.ilike.*abc id eq 1*,customer_name.ilike.*abc id eq 1*))");
  assert.ok(params.has("or"));
});
test("arquivamento passa pela autorização existente antes de chamar RPC",()=>{
  const source=readFileSync(new URL("../supabase/functions/admin-orders/index.ts",import.meta.url),"utf8");
  assert.ok(source.indexOf('if(!admin)')<source.indexOf('searchParams.get("action")==="archive"'));
  assert.match(source,/actor_user_id:admin.id/);
  assert.match(source,/typeof body\?\.archived!=="boolean"/);
});
test("arquivar não altera pedidos ou estoque, restringe execução e registra auditoria",()=>{
  const source=readFileSync(new URL("../supabase/migrations/20260925024355_admin_order_archives.sql",import.meta.url),"utf8");
  assert.match(source,/enable row level security/i);
  assert.match(source,/security invoker/i);
  assert.match(source,/from public,anon,authenticated/i);
  assert.match(source,/ORDER_NOT_CANCELLED/);
  assert.match(source,/insert into public.admin_audit_log/);
  assert.doesNotMatch(source,/(update|delete from) public\.(orders|inventory|payment_events)/i);
});
