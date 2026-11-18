export type CachedReleaseAsset = {
  name: string;
  browser_download_url: string;
  state: "uploaded";
};

export type CachedRelease = {
  name: string | null;
  tag_name: string;
  html_url: string;
  draft: false;
  prerelease: boolean;
  published_at: string;
  assets: CachedReleaseAsset[];
};

export type ReleaseCache = {
  schemaVersion: 1;
  desktop: CachedRelease;
  android: CachedRelease[];
};

export const RELEASE_CACHE_URL = "/downloads/releases.json";
let inFlight: Promise<ReleaseCache> | undefined;

async function loadReleaseCache(): Promise<ReleaseCache> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(RELEASE_CACHE_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Download cache lookup failed with status ${response.status}`);
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || !("schemaVersion" in data)
      || data.schemaVersion !== 1 || !("desktop" in data) || !("android" in data)
      || typeof data.desktop !== "object" || data.desktop === null || !Array.isArray(data.android)) {
      throw new Error("Invalid download cache.");
    }
    return data as ReleaseCache;
  } finally {
    clearTimeout(timeout);
  }
}

/** Share simultaneous desktop/mobile requests. Never fall back to GitHub's API. */
export function fetchReleaseCache(): Promise<ReleaseCache> {
  if (inFlight) return inFlight;
  const pending = loadReleaseCache();
  inFlight = pending;
  const clear = () => { if (inFlight === pending) inFlight = undefined; };
  void pending.then(clear, clear);
  return pending;
}
