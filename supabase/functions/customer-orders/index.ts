import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  allowedOrigin,
  jsonResponse,
  linkVerifiedCustomerByEmail,
  maskedEmail,
  normalizeEmail
} from "../_shared/customer-auth.ts";

const userHeaders = (token: string, anonKey: string) => ({
  apikey: anonKey,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
});

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "https://www.chirho.com.br";
  if (!allowedOrigin(origin)) return jsonResponse({ error: "Origem não autorizada." }, 403);
  if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
  if (request.method !== "GET") return jsonResponse({ error: "Método não permitido." }, 405, origin);

  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token) return jsonResponse({ error: "Sessão inválida." }, 401, origin);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("AUTH_UNAVAILABLE");

    const userResponse = await fetch(`${url}/auth/v1/user`, {
      headers: userHeaders(token, anonKey),
      signal: AbortSignal.timeout(8000)
    });
    const user = await userResponse.json().catch(() => ({}));
    const email = normalizeEmail(user?.email);
    if (!userResponse.ok || !user?.id || !email || !user?.email_confirmed_at) {
      return jsonResponse({ error: "Sessão inválida." }, 401, origin);
    }

    await linkVerifiedCustomerByEmail(user.id, email);

    const orderSelect = [
      "id", "code", "customer_name", "created_at", "subtotal", "shipping_price", "discount", "grand_total",
      "financial_status", "operational_status", "payment_method", "shipping_carrier", "shipping_service",
      "shipping_delivery_time", "tracking_code", "tracking_url", "shipped_at", "city", "state"
    ].join(",");
    const ordersResponse = await fetch(
      `${url}/rest/v1/orders?select=${orderSelect}&order=created_at.desc&limit=50`,
      { headers: userHeaders(token, anonKey), signal: AbortSignal.timeout(8000) }
    );
    if (!ordersResponse.ok) throw new Error("ORDER_QUERY_FAILED");
    const orders = await ordersResponse.json();

    if (!orders.length) {
      return jsonResponse({
        customer: { firstName: "cliente", email: maskedEmail(email) },
        orders: []
      }, 200, origin);
    }

    const ids = orders.map((order: { id: string }) => order.id).join(",");
    const [itemsResponse, historyResponse] = await Promise.all([
      fetch(`${url}/rest/v1/order_items?select=id,order_id,product_slug,sku,product_name,category,image_url,unit_price,quantity,line_total,created_at&order=id.asc&order_id=in.(${ids})`, {
        headers: userHeaders(token, anonKey), signal: AbortSignal.timeout(8000)
      }),
      fetch(`${url}/rest/v1/order_status_history?select=id,order_id,previous_status,status,note,created_at,status_type&order=created_at.asc&order_id=in.(${ids})`, {
        headers: userHeaders(token, anonKey), signal: AbortSignal.timeout(8000)
      })
    ]);
    if (!itemsResponse.ok || !historyResponse.ok) throw new Error("ORDER_DETAIL_QUERY_FAILED");
    const [items, history] = await Promise.all([itemsResponse.json(), historyResponse.json()]);

    const firstName = String(orders[0]?.customer_name || "cliente").trim().split(/\s+/)[0];
    return jsonResponse({
      customer: { firstName, email: maskedEmail(email) },
      orders: orders.map((order: { id: string }) => ({
        ...order,
        items: items.filter((item: { order_id: string }) => item.order_id === order.id),
        history: history.filter((event: { order_id: string }) => event.order_id === order.id)
      }))
    }, 200, origin);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("Customer order query failed", code);
    return jsonResponse({ error: "Não foi possível carregar suas compras agora." }, 503, origin);
  }
});
