const VAST_BUNDLES_URL = "https://console.vast.ai/api/v0/bundles";
const CACHE_TTL_SECONDS = 300;
const OFFER_LIMIT = 100;
const OFFER_TYPES = ["ondemand", "bid", "reserved"];

function vastQuery(type) {
  return {
    limit: OFFER_LIMIT,
    type,
    rentable: { eq: true },
    rented: { eq: false },
    reliability: { gte: 0.8 },
    gpu_arch: { eq: "nvidia" },
    vms_enabled: { eq: true },
    num_gpus: { eq: 1 },
    allocated_storage: 30,
    order: [["dph_total", "asc"]],
  };
}

async function fetchOffers(type) {
  const response = await fetch(VAST_BUNDLES_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vastQuery(type)),
  });

  if (!response.ok) {
    throw new Error(`Vast ${type} request failed with ${response.status}`);
  }

  const payload = await response.json();
  const offers = Array.isArray(payload) ? payload : payload?.offers;

  if (!Array.isArray(offers)) {
    throw new Error(`Vast ${type} response did not contain offers`);
  }

  return offers;
}

function cacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isOffersRequest =
      url.pathname === "/api/vast/offers" &&
      (request.method === "GET" || request.method === "POST");

    if (!isOffersRequest) {
      return env.ASSETS.fetch(request);
    }

    const cache = globalThis.caches?.default;
    const key = cacheKey(request);

    if (cache) {
      const cached = await cache.match(key);
      if (cached) return cached;
    }

    const results = await Promise.allSettled(OFFER_TYPES.map(fetchOffers));
    const successful = results.filter((result) => result.status === "fulfilled");

    if (successful.length === 0) {
      return new Response(
        JSON.stringify({ offers: [], fetchedAt: new Date().toISOString() }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const offersById = new Map();
    for (const result of successful) {
      for (const offer of result.value) {
        if (offer?.id != null) {
          const id = String(offer.id);
          if (!offersById.has(id)) offersById.set(id, offer);
        }
      }
    }

    const response = jsonResponse({
      offers: [...offersById.values()],
      fetchedAt: new Date().toISOString(),
    });

    if (cache) {
      ctx.waitUntil(cache.put(key, response.clone()));
    }

    return response;
  },
};
