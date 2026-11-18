import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildReleaseCache, fetchReleaseCache, refreshReleaseCache } from "./update-release-cache.mjs";

const owner = "https://github.com/FelipeBarrosCode";
const installers = ["app_aarch64.dmg", "app_x64.dmg", "app_arm64-setup.exe", "app_x64-setup.exe",
  "app_aarch64.AppImage", "app_amd64.AppImage"];
function release(repository = "no_land", names = installers, overrides = {}) {
  return {
    name: "v1.0.0", tag_name: "v1.0.0", html_url: `${owner}/${repository}/releases/tag/v1.0.0`,
    draft: false, prerelease: false, published_at: "2026-11-18T00:00:00Z",
    assets: names.map(name => ({
      name, state: "uploaded", browser_download_url: `${owner}/${repository}/releases/download/v1.0.0/${name}`,
    })),
    ...overrides,
  };
}
const desktop = () => release();
const android = (overrides = {}) => release("no_land_android", ["app-arm64.apk"], { prerelease: true, ...overrides });
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });

test("cache contains only metadata and stable installers plus the newest published phone APK", () => {
  const older = android({ name: "Older", published_at: "2026-11-10T00:00:00Z" });
  const newer = android({ name: "Newer", published_at: "2026-11-12T00:00:00Z" });
  const noPhone = release("no_land_android", ["app-x86_64.apk"], { published_at: "2026-11-19T00:00:00Z" });
  const snapshot = buildReleaseCache(desktop(), [older, noPhone, newer]);
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.desktop.assets.length, 6);
  assert.equal(snapshot.android.length, 1);
  assert.equal(snapshot.android[0].name, "Newer");
  assert.equal(snapshot.android[0].prerelease, true);
  assert.deepEqual(buildReleaseCache(desktop(), [newer, noPhone, older]), snapshot);
  assert.ok(!JSON.stringify(snapshot).includes("Authorization"));
});

test("drafts, prerelease desktop builds and incomplete installer uploads cannot replace good links", () => {
  for (const data of [
    desktopWith({ draft: true }), desktopWith({ prerelease: true }),
    desktopWith({ assets: desktop().assets.slice(1) }),
    desktopWith({ assets: desktop().assets.map(asset => ({ ...asset, state: "starter" })) }),
  ]) assert.throws(() => buildReleaseCache(data, [android()]));
  assert.throws(() => buildReleaseCache(desktop(), []), /No published phone APK/);
  const draft = android({ draft: true, published_at: "2099-01-01T00:00:00Z" });
  assert.equal(buildReleaseCache(desktop(), [draft, android()]).android[0].published_at, android().published_at);
});
function desktopWith(overrides) { return { ...desktop(), ...overrides }; }

test("download URLs must match the repository, release tag, and filename", () => {
  for (const url of [
    "javascript:alert(1)", "https://evil.example/app_aarch64.dmg",
    `${owner}/no_land-fork/releases/download/v1.0.0/app_aarch64.dmg`,
    `${owner}/no_land/releases/download/v0.9.0/app_aarch64.dmg`,
    `${owner}/no_land/releases/download/v1.0.0/wrong.dmg`,
    `${owner}/no_land/releases/download/v1.0.0/app_aarch64.dmg?redirect=bad`,
  ]) {
    const data = desktop();
    data.assets[0].browser_download_url = url;
    assert.throws(() => buildReleaseCache(data, [android()]));
  }
});

test("updater uses authenticated bounded metadata requests and follows every Android page", async () => {
  const calls = [];
  const snapshot = await fetchReleaseCache({
    token: "fixture-token",
    async fetchImpl(url, options) {
      calls.push({ url, options });
      if (url.endsWith("/latest")) return response(desktop());
      return response(url.endsWith("page=1") ? Array.from({ length: 100 }, () => android({ name: "Older" }))
        : [android({ name: "Published later", published_at: "2026-11-19T00:00:00Z" })]);
    },
  });
  assert.equal(snapshot.android[0].name, "Published later");
  assert.equal(calls.length, 3);
  for (const { url, options } of calls) {
    assert.ok(url.startsWith("https://api.github.com/repos/FelipeBarrosCode/"));
    assert.equal(options.headers.Authorization, "Bearer fixture-token");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    assert.ok(!/\.(exe|dmg|apk)$/u.test(url), "never download installers");
  }
});

test("rate limits, outages, malformed results and incomplete releases never publish over the last cache", async () => {
  for (const problem of [403, 429, 500, "network", "malformed", "incomplete"]) {
    let published = false;
    await assert.rejects(refreshReleaseCache({
      token: "fixture",
      async fetchImpl() {
        if (problem === "network") throw new Error("network unavailable");
        if (problem === "malformed") return response({ error: "bad payload" });
        if (problem === "incomplete") return response(desktopWith({ assets: [] }));
        return response(null, problem);
      },
      async publish() { published = true; },
    }));
    assert.equal(published, false);
  }
});

test("pagination and authentication fail closed before publication", async () => {
  let calls = 0;
  await assert.rejects(fetchReleaseCache({ fetchImpl() { calls++; } }), /GITHUB_TOKEN/);
  assert.equal(calls, 0);
  await assert.rejects(fetchReleaseCache({
    token: "fixture", maxPages: 1,
    async fetchImpl(url) { return response(url.endsWith("/latest") ? desktop() : Array.from({ length: 100 }, () => android())); },
  }), /pagination exceeded/);
});

test("workflow publishes metadata on a schedule with no visitor API fallback or recurring installs", () => {
  const workflow = readFileSync(new URL("../.github/workflows/update-release-cache.yml", import.meta.url), "utf8");
  assert.match(workflow, /13,43 \* \* \* \*/u);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /GITHUB_TOKEN: \$\{\{ github.token \}\}/u);
  assert.match(workflow, /CATALOG_UPDATE_TOKEN/u);
  const refresh = workflow.split("\n  refresh:\n")[1];
  assert.doesNotMatch(refresh, /npm ci|npm install|npm run build/u);
  assert.match(refresh, /git pull --rebase origin main/u);
  for (const file of ["releaseDownloads.ts", "mobileDownloads.ts"]) {
    const source = readFileSync(new URL(`../src/lib/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /API_URL|api\.github\.com|fetch\(/u);
    assert.match(source, /fetchReleaseCache\(\)/u);
  }
});
