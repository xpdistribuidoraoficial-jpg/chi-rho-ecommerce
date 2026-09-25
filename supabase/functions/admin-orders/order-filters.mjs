export const PAGE_SIZE = 50;
export function buildOrderFilters(input) {
  const params = new URLSearchParams();
  const financial = input.get("financial") || "";
  const operational = input.get("operational") || "";
  const delivery = input.get("delivery") || "";
  const archive = input.get("archive") || "active";
  if (financial && !["aguardando_pagamento","pago","recusado","cancelado","reembolsado"].includes(financial)) throw Error("Pagamento inválido.");
  if (operational && !["novo","em_separacao","pronto_para_envio","enviado","entregue","cancelado"].includes(operational)) throw Error("Etapa inválida.");
  if (!["","pickup","shipping"].includes(delivery) || !["active","archived","all"].includes(archive)) throw Error("Filtro inválido.");
  if (financial) params.set("financial_status", "eq." + financial);
  if (operational) params.set("operational_status", "eq." + operational);
  if (archive !== "all") params.set("admin_order_archives", archive === "archived" ? "not.is.null" : "is.null");
  if (delivery === "pickup") params.set("shipping_carrier_code","eq.PICKUP_VENDOR");
  if (delivery === "shipping") params.set("or","(shipping_carrier_code.neq.PICKUP_VENDOR,shipping_carrier_code.is.null)");
  const q = (input.get("q") || "").trim();
  if (q.length > 100) throw Error("Busca muito longa.");
  // Remove PostgREST grammar/wildcards, leaving literal words, spaces and hyphens.
  const term = q.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g," ").trim();
  if (term) params.set("and", "(or(code.ilike.*" + term + "*,customer_name.ilike.*" + term + "*))");
  const from = input.get("from") || "", to = input.get("to") || "";
  for (const day of [from,to]) {
    if (day && (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0,10) !== day)) throw Error("Data inválida.");
  }
  if (from && to && from > to) throw Error("A data inicial deve ser anterior à final.");
  if (from) params.append("created_at", "gte." + from + "T00:00:00-03:00");
  if (to) {
    const end = new Date(to + "T00:00:00-03:00");
    end.setUTCDate(end.getUTCDate()+1);
    params.append("created_at", "lt." + end.toISOString());
  }
  const pageText = input.get("page") || "1";
  if (!/^[1-9]\d{0,5}$/.test(pageText)) throw Error("Página inválida.");
  const page = Number(pageText);
  params.set("order","created_at.desc,id.desc");
  params.set("limit", String(PAGE_SIZE+1));
  params.set("offset", String((page-1)*PAGE_SIZE));
  return { params, page };
}
