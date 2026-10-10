const VAST_BUNDLES_URL = "https://console.vast.ai/api/v0/bundles";
const CACHE_TTL_SECONDS = 300;
const OFFER_LIMIT = 100;
const OFFER_TYPES = ["ondemand", "bid", "reserved"];
const PROTONDB_SUCCESS_TTL_SECONDS = 7 * 24 * 60 * 60;
const PROTONDB_MISSING_TTL_SECONDS = 24 * 60 * 60;

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

function cachedJsonResponse(body, status, ttl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl}`,
    },
  });
}

async function fetchProtonDbSummary(request, ctx) {
  const requestUrl = new URL(request.url);
  const appId = requestUrl.searchParams.get("appId") ?? "";
  if (!/^\d{1,10}$/u.test(appId) || Number(appId) <= 0) {
    return cachedJsonResponse({ error: "A valid Steam App ID is required." }, 400, 0);
  }

  const normalizedUrl = new URL("/api/protondb/summary", requestUrl.origin);
  normalizedUrl.searchParams.set("appId", appId);
  const cacheKey = new Request(normalizedUrl, { method: "GET" });
  const cache = globalThis.caches?.default;
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) return cached;

  let upstream;
  try {
    upstream = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${appId}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "NolandGamesCompatibility/1.0 (https://no-land.net/games/)",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "ProtonDB is temporarily unavailable." }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const checkedAt = new Date().toISOString();
  let response;
  if (upstream.status === 404) {
    response = cachedJsonResponse({ tier: null, checkedAt }, 200, PROTONDB_MISSING_TTL_SECONDS);
  } else if (upstream.ok) {
    try {
      const summary = await upstream.json();
      if (typeof summary?.tier !== "string" || !summary.tier.trim()) throw new Error("Invalid tier");
      response = cachedJsonResponse(
        { tier: summary.tier.trim().toLowerCase(), checkedAt },
        200,
        PROTONDB_SUCCESS_TTL_SECONDS,
      );
    } catch {
      return new Response(JSON.stringify({ error: "ProtonDB returned an invalid summary." }), {
        status: 502,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
  } else {
    const retryAfter = upstream.headers.get("Retry-After");
    response = new Response(JSON.stringify({ error: "ProtonDB lookup failed." }), {
      status: upstream.status === 429 ? 503 : 502,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(retryAfter ? { "Retry-After": retryAfter } : {}),
      },
    });
  }

  if (cache && response.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isOffersRequest =
      url.pathname === "/api/vast/offers" &&
      (request.method === "GET" || request.method === "POST");

    if (url.pathname === "/api/protondb/summary") {
      if (request.method !== "GET") {
        return new Response(null, { status: 405, headers: { Allow: "GET" } });
      }
      return fetchProtonDbSummary(request, ctx);
    }

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
