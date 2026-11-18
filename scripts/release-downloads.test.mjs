import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(file, dependencies = {}) {
  let { outputText } = ts.transpileModule(
    readFileSync(new URL(`../src/lib/${file}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } },
  );
  for (const [from, to] of Object.entries(dependencies)) {
    outputText = outputText.replaceAll(`from "${from}"`, `from "${to}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
const links = moduleUrl("siteLinks");
const cache = moduleUrl("releaseCache");
const desktop = await import(moduleUrl("releaseDownloads", { "./siteLinks": links, "./releaseCache": cache }));
const mobile = await import(moduleUrl("mobileDownloads", { "./siteLinks": links, "./releaseCache": cache }));
const snapshot = JSON.parse(readFileSync(new URL("../public/downloads/releases.json", import.meta.url), "utf8"));

test("desktop and Android share one cache request and retain direct GitHub asset links", async t => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => snapshot };
  });
  const [release, android] = await Promise.all([
    desktop.fetchLatestReleaseDownloads(), mobile.fetchLatestAndroidDownload(),
  ]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/downloads/releases.json");
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.equal(release.releaseLabel, snapshot.desktop.name);
  assert.equal(android.releaseLabel, snapshot.android[0].name);
  for (const id of ["macos-arm64-dmg", "macos-x64-dmg", "windows-arm64-exe",
    "windows-x64-exe", "linux-arm64-appimage", "linux-x64-appimage"]) {
    const option = release.options.find(value => value.id === id);
    assert.ok(option, id);
    assert.ok(option.url.startsWith("https://github.com/FelipeBarrosCode/no_land/releases/download/"));
  }
});

test("a cache outage makes no per-visitor GitHub API fallback", async t => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async url => {
    requests.push(url);
    return { ok: false, status: 503 };
  });
  await assert.rejects(desktop.fetchLatestReleaseDownloads(), /status 503/);
  assert.deepEqual(requests, ["/downloads/releases.json"]);
});

test("failed lookups do not poison the in-flight request slot", async t => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return requests === 1 ? { ok: false, status: 500 } : { ok: true, json: async () => snapshot };
  });
  await assert.rejects(desktop.fetchLatestReleaseDownloads(), /status 500/);
  assert.equal((await desktop.fetchLatestReleaseDownloads()).releaseUrl, snapshot.desktop.html_url);
  assert.equal(requests, 2);
});

test("incompatible cache schema is rejected rather than fetching upstream", async t => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ schemaVersion: 999 }) }));
  await assert.rejects(desktop.fetchLatestReleaseDownloads(), /Invalid download cache/);
});
