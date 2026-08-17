const jsonResponse = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  }
});

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return jsonResponse({ error: "Método não permitido." }, 405);
    }

    const requestUrl = new URL(request.url);
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin) {
      try {
        if (new URL(requestOrigin).host !== requestUrl.host) {
          return jsonResponse({ error: "Origem não autorizada." }, 403);
        }
      } catch {
        return jsonResponse({ error: "Origem não autorizada." }, 403);
      }
    }

    const postcode = onlyDigits(requestUrl.searchParams.get("cep"));
    if (postcode.length !== 8) {
      return jsonResponse({ error: "Informe um CEP válido com 8 números." }, 400);
    }

    try {
      const addressResponse = await fetch(`https://viacep.com.br/ws/${postcode}/json/`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      const address = await addressResponse.json().catch(() => ({}));

      if (!addressResponse.ok) {
        return jsonResponse({ error: "Não foi possível consultar este CEP." }, 502);
      }
      if (address?.erro) {
        return jsonResponse({ error: "CEP não encontrado." }, 404);
      }

      return jsonResponse({
        cep: onlyDigits(address.cep) || postcode,
        street: String(address.logradouro || "").trim(),
        district: String(address.bairro || "").trim(),
        city: String(address.localidade || "").trim(),
        state: String(address.uf || "").trim().toUpperCase()
      });
    } catch (error) {
      const message = error?.name === "TimeoutError"
        ? "A consulta do CEP demorou mais que o esperado. Tente novamente."
        : "Não foi possível consultar o CEP neste momento.";
      return jsonResponse({ error: message }, 502);
    }
  }
};
