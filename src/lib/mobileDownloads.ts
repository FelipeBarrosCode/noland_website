import { ANDROID_RELEASES_API_URL, ANDROID_RELEASES_PAGE_URL, ANDROID_REPOSITORY_URL } from "./siteLinks";

export type AndroidDownload = {
  url: string;
  assetName: string;
  releaseLabel: string;
  releaseUrl: string;
  isPrerelease: boolean;
};

const FETCH_TIMEOUT_MS = 10_000;
const RELEASES_PER_PAGE = 100;
const repository = new URL(ANDROID_REPOSITORY_URL);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function repositoryUrl(value: unknown, pathPrefix: string): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === repository.origin
      && !url.username && !url.password && !url.search && !url.hash
      && url.pathname.startsWith(`${repository.pathname}${pathPrefix}`)
      ? url : null;
  } catch {
    return null;
  }
}

function apkPriority(name: string): number {
  const normalized = name.toLowerCase();
  if (!normalized.endsWith(".apk")
    || /(?:^|[-_. ])(?:remote|agent|emulator|checksum|sha\d*|md5|x86(?:[_-]64)?|x64|amd64|i686)(?:[-_. ]|$)/u.test(normalized)) {
    return 0;
  }
  if (/(?:^|[-_.])universal(?:[-_.]|$)/u.test(normalized)) return 2;
  if (/(?:^|[-_.])(?:arm64|aarch64)(?:[-_.]|$)/u.test(normalized)) return 1;
  return 0;
}

function resolveAsset(value: unknown): { url: string; assetName: string; priority: number } | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  if (value.state !== undefined && value.state !== "uploaded") return null;
  const priority = apkPriority(value.name);
  if (!priority) return null;
  const url = repositoryUrl(value.browser_download_url, "/releases/download/");
  if (!url) return null;

  const path = url.pathname.slice(`${repository.pathname}/releases/download/`.length).split("/");
  try {
    if (path.length !== 2 || !path[0] || decodeURIComponent(path[1]) !== value.name) return null;
  } catch {
    return null;
  }
  return { url: url.href, assetName: value.name, priority };
}

/** Resolves by publication time, not API order, tag version, or release update time. */
export function resolveLatestAndroidDownload(releases: unknown): AndroidDownload {
  if (!Array.isArray(releases)) throw new Error("Invalid GitHub releases response: expected a list.");

  const published = releases.flatMap((release: unknown) => {
    if (!isRecord(release) || release.draft !== false || typeof release.published_at !== "string") return [];
    const publishedAt = Date.parse(release.published_at);
    if (!Number.isFinite(publishedAt)) return [];
    return [{ release, publishedAt }];
  }).sort((left, right) => right.publishedAt - left.publishedAt);

  for (const { release } of published) {
    if (!Array.isArray(release.assets)) continue;
    const assets = release.assets.flatMap((asset: unknown) => {
      const resolved = resolveAsset(asset);
      return resolved ? [resolved] : [];
    }).sort((left, right) => right.priority - left.priority);
    const asset = assets[0];
    if (!asset) continue;

    const name = typeof release.name === "string" ? release.name.trim() : "";
    const tag = typeof release.tag_name === "string" ? release.tag_name : "";
    return {
      url: asset.url,
      assetName: asset.assetName,
      releaseLabel: name || tag,
      releaseUrl: repositoryUrl(release.html_url, "/releases/tag/")?.href ?? ANDROID_RELEASES_PAGE_URL,
      isPrerelease: release.prerelease === true,
    };
  }

  throw new Error("No published Android release contains a universal or ARM64 phone APK.");
}

export async function fetchLatestAndroidDownload(): Promise<AndroidDownload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const releases: unknown[] = [];
    // GitHub lists by creation time; collect every page before sorting by publication time.
    for (let page = 1; ; page += 1) {
      const url = new URL(ANDROID_RELEASES_API_URL);
      url.searchParams.set("per_page", String(RELEASES_PER_PAGE));
      url.searchParams.set("page", String(page));
      const response = await fetch(url.href, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`GitHub Android release lookup failed with status ${response.status}`);
      const batch: unknown = await response.json();
      if (!Array.isArray(batch)) throw new Error("Invalid GitHub releases response: expected a list.");
      releases.push(...batch);
      if (batch.length < RELEASES_PER_PAGE) break;
    }
    return resolveLatestAndroidDownload(releases);
  } finally {
    clearTimeout(timeout);
  }
}
