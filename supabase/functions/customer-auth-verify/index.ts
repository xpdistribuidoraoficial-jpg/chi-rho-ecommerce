import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  PUBLIC_KEY,
  allowedOrigin,
  clientIp,
  consumeLimit,
  jsonResponse,
  linkVerifiedCustomer,
  normalizeBrazilianWhatsapp,
  secureFingerprint,
  serviceRpc
} from "../_shared/customer-auth.ts";

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "https://www.chirho.com.br";
  if (!allowedOrigin(origin)) return jsonResponse({ error: "Origem não autorizada." }, 403);
  if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
  if (request.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405, origin);
  if (request.headers.get("apikey") !== PUBLIC_KEY) return jsonResponse({ error: "Não autorizado." }, 401, origin);

  try {
    const body = await request.json();
    const canonical = normalizeBrazilianWhatsapp(body?.whatsapp);
    const token = String(body?.code || "").replace(/\D/g, "");
    if (!canonical || !/^\d{6,10}$/.test(token)) {
      return jsonResponse({ error: "Não foi possível validar os dados informados." }, 400, origin);
    }

    const [phoneHash, ipHash] = await Promise.all([
      secureFingerprint("phone", canonical),
      secureFingerprint("ip", clientIp(request))
    ]);
    const [phoneLimit, ipLimit] = await Promise.all([
      consumeLimit("verify_phone", phoneHash, 5, 900, 0, 1800),
      consumeLimit("verify_ip", ipHash, 20, 900, 0, 1800)
    ]);
    if (!phoneLimit.allowed || !ipLimit.allowed) {
      return jsonResponse({ error: "Não foi possível validar os dados informados." }, 429, origin);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("AUTH_UNAVAILABLE");
    const authResponse = await fetch(`${url}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ phone: `+${canonical}`, token, type: "sms" }),
      signal: AbortSignal.timeout(12000)
    });
    const session = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || !session?.access_token || !session?.user?.id) {
      return jsonResponse({ error: "Não foi possível validar os dados informados." }, 400, origin);
    }

    await linkVerifiedCustomer(session.user.id, canonical);
    await serviceRpc("reset_customer_auth_rate_limits", {
      requested_phone_hash: phoneHash,
      requested_ip_hash: ipHash
    });

    return jsonResponse({
      accessToken: session.access_token,
      expiresIn: Number(session.expires_in || 3600),
      tokenType: "bearer"
    }, 200, origin);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("Customer OTP verification failed", code);
    return jsonResponse({ error: "Não foi possível validar os dados informados." }, 503, origin);
  }
});
