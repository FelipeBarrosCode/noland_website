#!/usr/bin/env node
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const owner = "FelipeBarrosCode";
const desktopRepository = `${owner}/no_land`;
const androidRepository = `${owner}/no_land_android`;
const api = "https://api.github.com/repos/";
const output = fileURLToPath(new URL("../public/downloads/releases.json", import.meta.url));
const requiredDesktop = [
  /(?:aarch64|arm64).*\.dmg$/iu, /(?:x86_64|x64|amd64).*\.dmg$/iu,
  /_arm64-setup\.exe$/iu, /_x64-setup\.exe$/iu,
  /(?:aarch64|arm64).*\.appimage$/iu, /(?:x86_64|x64|amd64).*\.appimage$/iu,
];

function repositoryUrl(value, repository, prefix) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://github.com" && !url.username && !url.password
      && !url.search && !url.hash && url.pathname.startsWith(`/${repository}${prefix}`) ? url : null;
  } catch {
    return null;
  }
}

function phoneApk(name) {
  return /\.apk$/iu.test(name) && /(?:^|[-_.])(?:universal|arm64|aarch64)(?:[-_.]|$)/iu.test(name)
    && !/(?:^|[-_. ])(?:remote|agent|emulator|checksum|sha\d*|md5|x86(?:[_-]64)?|x64|amd64|i686)(?:[-_. ]|$)/iu.test(name);
}

export function sanitizeRelease(value, repository) {
  if (!value || value.draft !== false || typeof value.tag_name !== "string" || !value.tag_name
    || typeof value.published_at !== "string" || !Number.isFinite(Date.parse(value.published_at))
    || !Array.isArray(value.assets) || typeof value.prerelease !== "boolean") {
    throw new Error(`Invalid published release for ${repository}`);
  }
  const html = repositoryUrl(value.html_url, repository, "/releases/tag/");
  if (!html || decodeURIComponent(html.pathname.slice(`/${repository}/releases/tag/`.length)) !== value.tag_name) {
    throw new Error(`Invalid release URL for ${repository}`);
  }
  const assets = value.assets.flatMap(asset => {
    if (!asset || typeof asset.name !== "string" || asset.state !== "uploaded") return [];
    const relevant = repository === desktopRepository
      ? /\.(?:dmg|exe|appimage|deb|rpm|pkg\.tar\.zst)$/iu.test(asset.name) : phoneApk(asset.name);
    if (!relevant) return [];
    const url = repositoryUrl(asset.browser_download_url, repository, "/releases/download/");
    if (!url) throw new Error(`Unsafe download URL for ${asset.name}`);
    const parts = url.pathname.slice(`/${repository}/releases/download/`.length).split("/");
    if (parts.length !== 2 || decodeURIComponent(parts[0]) !== value.tag_name
      || decodeURIComponent(parts[1]) !== asset.name) throw new Error(`Mismatched download URL for ${asset.name}`);
    return [{ name: asset.name, browser_download_url: url.href, state: "uploaded" }];
  }).sort((a, b) => a.name.localeCompare(b.name, "en"));
  return {
    name: typeof value.name === "string" ? value.name : null,
    tag_name: value.tag_name, html_url: html.href, draft: false,
    prerelease: value.prerelease, published_at: value.published_at, assets,
  };
}

export function buildReleaseCache(desktop, androidReleases) {
  const stable = sanitizeRelease(desktop, desktopRepository);
  if (stable.prerelease || requiredDesktop.some(pattern => !stable.assets.some(asset => pattern.test(asset.name)))) {
    throw new Error("Latest stable desktop release is missing required installers; keeping the last good cache.");
  }
  if (!Array.isArray(androidReleases)) throw new Error("Invalid Android release list");
  const android = androidReleases
    .filter(value => value?.draft === false && value.published_at !== null)
    .map(value => sanitizeRelease(value, androidRepository))
    .filter(value => value.assets.length > 0)
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at) || a.tag_name.localeCompare(b.tag_name, "en"));
  if (!android.length) throw new Error("No published phone APK; keeping the last good cache.");
  return { schemaVersion: 1, desktop: stable, android: android.slice(0, 1) };
}

/** Bounded, authenticated metadata-only reads; never fetch binaries or follow API redirects. */
export async function fetchReleaseCache({ token, fetchImpl = fetch, maxPages = 20 } = {}) {
  if (!token?.trim()) throw new Error("GITHUB_TOKEN is required for authenticated release refreshes.");
  async function get(path) {
    const response = await fetchImpl(`${api}${path}`, {
      headers: {
        Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GitHub metadata refresh failed with status ${response.status}; keeping the last good cache.`);
    return response.json();
  }
  const desktop = await get(`${desktopRepository}/releases/latest`);
  const android = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = await get(`${androidRepository}/releases?per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("Invalid Android release list");
    android.push(...batch);
    if (batch.length < 100) return buildReleaseCache(desktop, android);
  }
  throw new Error("Android release pagination exceeded its safety bound; keeping the last good cache.");
}

export async function publishReleaseCache(snapshot, path = output) {
  const text = `${JSON.stringify(snapshot, null, 2)}\n`;
  try {
    if (await readFile(path, "utf8") === text) return false;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, text, { flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return true;
}

export async function refreshReleaseCache(options = {}) {
  const snapshot = await fetchReleaseCache(options);
  return (options.publish ?? publishReleaseCache)(snapshot);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const changed = await refreshReleaseCache({ token: process.env.GITHUB_TOKEN });
    console.log(changed ? "Published updated desktop and Android download metadata." : "Download cache is already current.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
