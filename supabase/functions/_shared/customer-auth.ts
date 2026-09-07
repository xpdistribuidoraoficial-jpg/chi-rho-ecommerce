export const OFFICIAL_ORIGIN = "https://www.chirho.com.br";
export const PUBLIC_KEY = "sb_publishable_ipNBmuf0pUOZRzzlpU8kWw_Md1Y5FuE";

const ALLOWED_ORIGINS = new Set([
  OFFICIAL_ORIGIN,
  "https://chirho.com.br",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/chi-rho-ecommerce(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export const allowedOrigin = (origin: string) => (
  ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_ORIGIN.test(origin)
);

export const jsonResponse = (body: unknown, status = 200, origin = OFFICIAL_ORIGIN) => new Response(
  status === 204 ? null : JSON.stringify(body),
  {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin"
    }
  }
);

export const normalizeBrazilianWhatsapp = (value: unknown) => {
  const digits = String(value || "").replace(/\D/g, "");
  const national = /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits;
  if (!/^[1-9]\d[2-9]\d{7,8}$/.test(national)) return null;
  return `55${national}`;
};

export const maskedWhatsapp = (canonical: string) => `(**) *****-${canonical.slice(-4)}`;

export const clientIp = (request: Request) => (
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  || request.headers.get("cf-connecting-ip")
  || request.headers.get("x-real-ip")
  || "unavailable"
);

export const secureFingerprint = async (scope: string, value: string) => {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("AUTH_UNAVAILABLE");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${secret}:chi-rho-customer-auth`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${scope}:${value}`));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const serviceHeaders = () => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("AUTH_UNAVAILABLE");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
};

export const serviceRpc = async (name: string, body: Record<string, unknown>) => {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("AUTH_UNAVAILABLE");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("AUTH_DATABASE_ERROR");
  return response.json().catch(() => null);
};

export const consumeLimit = async (
  scope: "request_phone" | "request_ip" | "verify_phone" | "verify_ip",
  keyHash: string,
  maximumAttempts: number,
  windowSeconds: number,
  cooldownSeconds: number,
  blockSeconds: number
) => {
  const result = await serviceRpc("consume_customer_auth_rate_limit", {
    requested_scope: scope,
    requested_key_hash: keyHash,
    maximum_attempts: maximumAttempts,
    window_seconds: windowSeconds,
    cooldown_seconds: cooldownSeconds,
    block_seconds: blockSeconds
  });
  const row = Array.isArray(result) ? result[0] : result;
  return {
    allowed: row?.allowed === true,
    retryAfter: Number(row?.retry_after_seconds || 0)
  };
};

export const linkVerifiedCustomer = async (authUserId: string, canonical: string) => (
  serviceRpc("link_customer_identity_for_auth", {
    requested_auth_user_id: authUserId,
    requested_whatsapp_e164: canonical
  })
);

export const metaConfigurationAvailable = () => Boolean(
  Deno.env.get("SEND_SMS_HOOK_SECRET")
  && Deno.env.get("META_WHATSAPP_ACCESS_TOKEN")
  && Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID")
  && Deno.env.get("META_WHATSAPP_TEMPLATE_NAME")
  && Deno.env.get("META_WHATSAPP_TEMPLATE_LANGUAGE")
  && Deno.env.get("META_GRAPH_API_VERSION")
);
