import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  PUBLIC_KEY,
  allowedOrigin,
  clientIp,
  consumeLimit,
  jsonResponse,
  normalizeEmail,
  secureFingerprint
} from "../_shared/customer-auth.ts";

const genericSuccess = {
  message: "Se os dados estiverem aptos para acesso, enviaremos o código por e-mail."
};

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "https://www.chirho.com.br";
  if (!allowedOrigin(origin)) return jsonResponse({ error: "Origem não autorizada." }, 403);
  if (request.method === "OPTIONS") return jsonResponse({}, 204, origin);
  if (request.method === "GET") {
    return jsonResponse({ available: true, provider: "supabase_email_otp", passwordless: true }, 200, origin);
  }
  if (request.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405, origin);
  if (request.headers.get("apikey") !== PUBLIC_KEY) return jsonResponse({ error: "Não autorizado." }, 401, origin);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 3000) return jsonResponse({ error: "Dados inválidos." }, 413, origin);

  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    if (!email) return jsonResponse({ error: "Informe um e-mail válido." }, 400, origin);

    const [emailHash, ipHash] = await Promise.all([
      secureFingerprint("email", email),
      secureFingerprint("ip", clientIp(request))
    ]);
    const [emailLimit, ipLimit] = await Promise.all([
      consumeLimit("request_email", emailHash, 3, 900, 60, 900),
      consumeLimit("request_ip", ipHash, 12, 900, 0, 900)
    ]);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(emailLimit.retryAfter, ipLimit.retryAfter, 60);
      return new Response(JSON.stringify({ error: "Aguarde alguns instantes antes de tentar novamente." }), {
        status: 429,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(retryAfter),
          "Vary": "Origin"
        }
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anonKey) throw new Error("AUTH_UNAVAILABLE");

    const authResponse = await fetch(`${url}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
      signal: AbortSignal.timeout(15000)
    });
    if (!authResponse.ok) {
      console.error("Customer email OTP delivery failed", authResponse.status);
      return jsonResponse({ error: "Não foi possível enviar o código agora. Tente novamente em alguns instantes." }, 503, origin);
    }

    return jsonResponse(genericSuccess, 202, origin);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("Customer email OTP request failed", code);
    return jsonResponse({ error: "Não foi possível enviar o código agora. Tente novamente em alguns instantes." }, 503, origin);
  }
});
