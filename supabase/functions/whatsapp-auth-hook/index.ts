import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { metaConfigurationAvailable, normalizeBrazilianWhatsapp } from "../_shared/customer-auth.ts";

const statusResponse = () => new Response(JSON.stringify({
  available: metaConfigurationAvailable(),
  provider: "meta_whatsapp_cloud_api",
  templateType: "authentication"
}), {
  status: 200,
  headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
});

Deno.serve(async (request: Request) => {
  if (request.method === "GET") return statusResponse();
  if (request.method !== "POST") return new Response("{}", { status: 405 });

  const configuredSecret = Deno.env.get("SEND_SMS_HOOK_SECRET") || "";
  const hookSecret = configuredSecret.replace(/^v1,whsec_/, "");
  if (!metaConfigurationAvailable() || !hookSecret) {
    console.error("WhatsApp authentication hook is not configured");
    return new Response("{}", { status: 503 });
  }

  try {
    const rawPayload = await request.text();
    const webhook = new Webhook(hookSecret);
    const event = webhook.verify(rawPayload, Object.fromEntries(request.headers)) as any;
    const canonical = normalizeBrazilianWhatsapp(event?.user?.phone);
    const otp = String(event?.sms?.otp || "");
    if (!canonical || !/^\d{6,10}$/.test(otp)) throw new Error("INVALID_AUTH_HOOK_PAYLOAD");

    const graphVersion = Deno.env.get("META_GRAPH_API_VERSION")!;
    const phoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID")!;
    const metaResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("META_WHATSAPP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: canonical,
        type: "template",
        template: {
          name: Deno.env.get("META_WHATSAPP_TEMPLATE_NAME"),
          language: { code: Deno.env.get("META_WHATSAPP_TEMPLATE_LANGUAGE") },
          components: [
            { type: "body", parameters: [{ type: "text", text: otp }] },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: otp }]
            }
          ]
        }
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!metaResponse.ok) {
      const failure = await metaResponse.json().catch(() => ({}));
      console.error("Meta WhatsApp delivery failed", metaResponse.status, failure?.error?.code || "unknown");
      return new Response("{}", { status: 503 });
    }
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("WhatsApp authentication hook rejected", code);
    return new Response("{}", { status: 401 });
  }
});
