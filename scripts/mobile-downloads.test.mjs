import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Transpile in memory so Node can load the helpers' extensionless browser imports.
function moduleUrl(fileName, dependencies = {}) {
  const source = readFileSync(new URL(`../src/lib/${fileName}.ts`, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  });
  for (const [specifier, url] of Object.entries(dependencies)) {
    outputText = outputText.replaceAll(`from "${specifier}"`, `from "${url}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const linksUrl = moduleUrl("siteLinks");
const links = await import(linksUrl);
const platform = await import(moduleUrl("clientPlatform"));
const { resolveLatestAndroidDownload, fetchLatestAndroidDownload } = await import(
  moduleUrl("mobileDownloads", { "./siteLinks": linksUrl }),
);
const { ANDROID_REPOSITORY_URL, ANDROID_RELEASES_PAGE_URL, ANDROID_RELEASES_API_URL } = links;

function asset(name = "no-land-android-0.1.17-1401-arm64-debug.apk", overrides = {}) {
  return {
    name,
    browser_download_url: `${ANDROID_REPOSITORY_URL}/releases/download/build-1401/${encodeURIComponent(name)}`,
    state: "uploaded",
    ...overrides,
  };
}

function release(overrides = {}) {
  return {
    name: "Android build 1401",
    tag_name: "build-1401",
    html_url: `${ANDROID_REPOSITORY_URL}/releases/tag/build-1401`,
    draft: false,
    prerelease: false,
    published_at: "2026-10-20T10:00:00Z",
    created_at: "2026-10-19T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
    assets: [asset()],
    ...overrides,
  };
}

function mockNavigator(t, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "navigator", descriptor);
    else delete globalThis.navigator;
  });
}

function mockFetch(t, body) {
  return t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => body }));
}

test("mobile links target the correct repositories and release lists; desktop links stay unchanged", () => {
  assert.equal(links.IOS_REPOSITORY_URL, "https://github.com/FelipeBarrosCode/no_land_mobile_port");
  assert.equal(links.IOS_RELEASES_PAGE_URL, `${links.IOS_REPOSITORY_URL}/releases`);
  assert.equal(ANDROID_REPOSITORY_URL, "https://github.com/FelipeBarrosCode/no_land_android");
  assert.equal(ANDROID_RELEASES_PAGE_URL, `${ANDROID_REPOSITORY_URL}/releases`);
  assert.equal(ANDROID_RELEASES_API_URL, "https://api.github.com/repos/FelipeBarrosCode/no_land_android/releases");
  assert.equal(links.REPOSITORY_URL, "https://github.com/FelipeBarrosCode/no_land");
  assert.equal(links.RELEASES_PAGE_URL, `${links.REPOSITORY_URL}/releases/latest`);
  assert.equal(links.RELEASES_API_URL, "https://api.github.com/repos/FelipeBarrosCode/no_land/releases/latest");
});

test("detects iPhone, iPad, iPod, and Android phones/tablets independently of desktop-like platforms", () => {
  for (const [devicePlatform, userAgent, expected] of [
    ["iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", "iOS"],
    ["iPad", "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", "iOS"],
    ["iPod", "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0)", "iOS"],
    ["Linux armv8l", "Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile", "Android"],
    ["Linux aarch64", "Mozilla/5.0 (Linux; Android 14; Tablet)", "Android"],
    ["Linux x86_64", "Mozilla/5.0 (Linux; Android 14; Emulator)", "Android"],
    ["Android", "", "Android"],
    ["", "IPHONE", "iOS"],
  ]) {
    assert.equal(platform.detectMobileOperatingSystem(devicePlatform, userAgent), expected, userAgent);
  }
});

test("detects desktop-mode iPads only with MacIntel and multiple touch points", () => {
  const macAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
  assert.equal(platform.detectMobileOperatingSystem("MacIntel", macAgent, 5), "iOS");
  assert.equal(platform.detectMobileOperatingSystem("MacIntel", macAgent, 2), "iOS");
  for (const points of [undefined, 0, 1]) {
    assert.equal(platform.detectMobileOperatingSystem("MacIntel", macAgent, points), null);
  }
});

test("Windows touch laptops, desktop Macs/Linux, and unknown browsers are not mobile", () => {
  for (const [devicePlatform, userAgent] of [
    ["Win32", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"],
    ["Win64", "Mozilla/5.0 (Windows NT 10.0; Touch)"],
    ["MacARM", "Mozilla/5.0 (Macintosh; Mac OS X)"],
    ["Linux x86_64", "Mozilla/5.0 (X11; Linux x86_64)"],
    ["", ""],
    ["", "Mobile"],
  ]) {
    assert.equal(platform.detectMobileOperatingSystem(devicePlatform, userAgent, 10), null, devicePlatform);
  }
});

test("navigator mobile detection is safe during SSR", (t) => {
  mockNavigator(t, undefined);
  assert.equal(platform.detectNavigatorMobileOperatingSystem(), null);
  assert.equal(platform.detectNavigatorOperatingSystem(), "Unknown");
});

test("navigator mobile detection passes touch count through for desktop-mode iPads", (t) => {
  mockNavigator(t, { platform: "MacIntel", userAgent: "Macintosh", maxTouchPoints: 5 });
  assert.equal(platform.detectNavigatorMobileOperatingSystem(), "iOS");
});

test("navigator mobile detection handles Android and missing navigator fields", (t) => {
  mockNavigator(t, { userAgent: "Linux; Android 15" });
  assert.equal(platform.detectNavigatorMobileOperatingSystem(), "Android");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
  assert.equal(platform.detectNavigatorMobileOperatingSystem(), null);
});

test("existing desktop detection and navigator exports retain their behavior", (t) => {
  for (const [devicePlatform, userAgent, expected] of [
    ["Win32", "Windows NT 10.0", "Windows"],
    ["MacIntel", "Mac OS X", "macOS"],
    ["Linux x86_64", "X11", "Linux"],
    ["Linux armv8l", "Android", "Unknown"],
    ["iPhone", "iPhone", "Unknown"],
    ["", "", "Unknown"],
  ]) assert.equal(platform.detectDesktopOperatingSystem(devicePlatform, userAgent), expected);
  mockNavigator(t, { platform: "", userAgent: "", userAgentData: { platform: "Windows" } });
  assert.equal(platform.detectNavigatorOperatingSystem(), "Windows");
});

test("returns the complete UI download contract for the verified ARM64 filename, not the emulator APK", () => {
  const phone = asset();
  const emulator = asset("no-land-android-0.1.17-1401-x86_64-debug.apk");
  const data = release({ assets: [emulator, phone] });
  assert.deepEqual(resolveLatestAndroidDownload([data]), {
    url: phone.browser_download_url,
    assetName: phone.name,
    releaseLabel: data.name,
    releaseUrl: data.html_url,
    isPrerelease: false,
  });
});

test("sorts by publication time, accepts prereleases, and does not mutate the input", () => {
  const older = release({ name: "Old stable", updated_at: "2099-01-01T00:00:00Z" });
  const newer = release({
    name: "New prerelease", prerelease: true,
    published_at: "2026-10-21T10:00:00Z", created_at: "2025-01-01T00:00:00Z",
  });
  const releases = Object.freeze([Object.freeze(older), Object.freeze(newer)]);
  assert.equal(resolveLatestAndroidDownload(releases).releaseLabel, "New prerelease");
  assert.equal(resolveLatestAndroidDownload(releases).isPrerelease, true);
  assert.equal(releases[0], older);
});

test("ignores drafts, unpublished releases, and invalid publication dates", () => {
  const eligible = release({ name: "Published" });
  const future = { published_at: "2099-01-01T00:00:00Z", name: "Ineligible" };
  assert.equal(resolveLatestAndroidDownload([
    release({ ...future, draft: true }),
    release({ ...future, published_at: null }),
    release({ ...future, published_at: "" }),
    release({ ...future, published_at: "not-a-date" }),
    release({ ...future, draft: undefined }),
    eligible,
  ]).releaseLabel, "Published");
});

test("universal APKs outrank ARM64 within the same release regardless of asset order", () => {
  const universal = asset("no-land-android-2.0.0-universal-release.apk");
  for (const assets of [[asset(), universal], [universal, asset()]]) {
    assert.equal(resolveLatestAndroidDownload([release({ assets })]).assetName, universal.name);
  }
  const aarch64 = asset("no-land-android-2.0.0-aarch64.apk");
  assert.equal(resolveLatestAndroidDownload([release({ assets: [aarch64] })]).assetName, aarch64.name);
  const armV8 = asset("app-arm64-v8a-release.apk");
  assert.equal(resolveLatestAndroidDownload([release({ assets: [armV8] })]).assetName, armV8.name);
});

test("newest eligible ARM64 release outranks an older universal release", () => {
  const older = release({ name: "Older", assets: [asset("app-universal.apk")] });
  const newer = release({ name: "Newer", published_at: "2026-10-22T00:00:00Z" });
  assert.equal(resolveLatestAndroidDownload([older, newer]).releaseLabel, "Newer");
});

test("skips newer releases without a suitable uploaded phone APK", () => {
  const older = release({ name: "Phone build" });
  for (const assets of [[], null, [asset("app-x86_64-debug.apk")], [asset(undefined, { state: "starter" })]]) {
    assert.equal(resolveLatestAndroidDownload([
      release({ name: "No phone build", published_at: "2026-10-22T00:00:00Z", assets }), older,
    ]).releaseLabel, "Phone build");
  }
});

test("rejects emulator, remote-agent, checksum, bundle, and unsupported architecture assets", () => {
  for (const name of [
    "app-x86_64-debug.apk", "app-x86-debug.apk", "app-x64.apk", "app-amd64.apk",
    "app-universal-x86_64.apk", "app-arm64-emulator.apk", "app-armeabi-v7a.apk",
    "remote-agent-arm64.apk", "no-land-remote_agent-universal.apk",
    "app-arm64.apk.sha256", "app-arm64.apk.sha512", "app-arm64.apk.md5",
    "checksum-arm64.apk", "app-arm64.aab", "app-universal.aab", "app-arm64.zip",
    "app-arm64.apk.asc", "app.apk", "app-notarm64.apk",
  ]) {
    assert.throws(() => resolveLatestAndroidDownload([release({ assets: [asset(name)] })]), /No published Android release/, name);
  }
});

test("rejects download URLs outside the expected GitHub repository or download path", () => {
  const valid = asset();
  for (const url of [
    valid.browser_download_url.replace("github.com", "evil.example"),
    valid.browser_download_url.replace("github.com", "github.com.evil.example"),
    valid.browser_download_url.replace("https://", "http://"),
    valid.browser_download_url.replace("https://", "https://user:password@"),
    valid.browser_download_url.replace("no_land_android/", "no_land/"),
    valid.browser_download_url.replace("no_land_android/", "no_land_android-fork/"),
    valid.browser_download_url.replace("/releases/download/", "/blob/"),
    valid.browser_download_url.replace("/build-1401/", "/build-1401/nested/"),
    `${valid.browser_download_url}?redirect=elsewhere`,
    `${valid.browser_download_url}#fragment`,
    valid.browser_download_url.replace(valid.name, "different-arm64.apk"),
    "javascript:alert(1)", "/relative-arm64.apk", "not a URL",
  ]) {
    assert.throws(() => resolveLatestAndroidDownload([release({
      assets: [asset(undefined, { browser_download_url: url })],
    })]), /No published Android release/, url);
  }
});

test("invalid high-priority assets cannot hide a valid ARM64 APK", () => {
  assert.equal(resolveLatestAndroidDownload([release({ assets: [
    asset("app-universal.apk", { browser_download_url: "https://evil.example/app-universal.apk" }),
    asset(),
  ] })]).assetName, asset().name);
});

test("uses the tag for blank release names and safely falls back for invalid release URLs", () => {
  for (const html_url of [undefined, "", "https://evil.example/release", `${ANDROID_REPOSITORY_URL}/blob/main`]) {
    const result = resolveLatestAndroidDownload([release({ name: "  ", html_url })]);
    assert.equal(result.releaseLabel, "build-1401");
    assert.equal(result.releaseUrl, ANDROID_RELEASES_PAGE_URL);
  }
  assert.equal(resolveLatestAndroidDownload([release({ name: "  Named release  " })]).releaseLabel, "Named release");
});

test("throws for empty or malformed release lists, ignoring malformed individual entries", () => {
  for (const value of [null, {}, { message: "API rate limit exceeded" }, "bad"]) {
    assert.throws(() => resolveLatestAndroidDownload(value), /expected a list/);
  }
  assert.throws(() => resolveLatestAndroidDownload([]), /No published Android release/);
  assert.throws(() => resolveLatestAndroidDownload([
    null, 1, {}, release({ assets: [null, {}, { name: 7 }, asset(undefined, { browser_download_url: null })] }),
  ]), /No published Android release/);
  assert.equal(resolveLatestAndroidDownload([null, {}, release()]).assetName, asset().name);
});

test("fetches the releases list (not latest) with GitHub headers and an abort signal", async (t) => {
  const fetchMock = mockFetch(t, [release({ prerelease: true })]);
  const clearTimer = t.mock.method(globalThis, "clearTimeout");
  const result = await fetchLatestAndroidDownload();
  assert.equal(result.isPrerelease, true);
  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  const requested = new URL(url);
  assert.equal(`${requested.origin}${requested.pathname}`, ANDROID_RELEASES_API_URL);
  assert.equal(requested.searchParams.get("per_page"), "100");
  assert.equal(requested.searchParams.get("page"), "1");
  assert.equal(options.headers.Accept, "application/vnd.github+json");
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(clearTimer.mock.callCount(), 1);
});

test("paginates before selecting by publication time and shares one timeout signal", async (t) => {
  const firstPage = Array.from({ length: 100 }, () => release());
  const secondPage = [release({ name: "Published later", published_at: "2026-10-22T00:00:00Z", prerelease: true })];
  const fetchMock = t.mock.method(globalThis, "fetch", async (url) => ({
    ok: true,
    json: async () => new URL(url).searchParams.get("page") === "1" ? firstPage : secondPage,
  }));
  assert.equal((await fetchLatestAndroidDownload()).releaseLabel, "Published later");
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(new URL(fetchMock.mock.calls[1].arguments[0]).searchParams.get("page"), "2");
  assert.equal(fetchMock.mock.calls[0].arguments[1].signal, fetchMock.mock.calls[1].arguments[1].signal);
});

test("throws on HTTP failures rather than returning a fallback or cached result", async (t) => {
  for (const status of [403, 404, 429, 500]) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status }));
    await assert.rejects(fetchLatestAndroidDownload(), new RegExp(`status ${status}`));
    fetchMock.mock.restore();
  }
});

test("propagates network failures and cleans up the timeout", async (t) => {
  const failure = new Error("Network unavailable");
  t.mock.method(globalThis, "fetch", async () => { throw failure; });
  const clearTimer = t.mock.method(globalThis, "clearTimeout");
  await assert.rejects(fetchLatestAndroidDownload(), (error) => error === failure);
  assert.equal(clearTimer.mock.callCount(), 1);
});

test("throws on invalid JSON, invalid payloads, and no matching downloads", async (t) => {
  const failure = new SyntaxError("Invalid JSON");
  const invalidJson = t.mock.method(globalThis, "fetch", async () => ({
    ok: true, json: async () => { throw failure; },
  }));
  await assert.rejects(fetchLatestAndroidDownload(), (error) => error === failure);
  invalidJson.mock.restore();
  for (const [body, message] of [[{}, /expected a list/], [[], /No published Android release/]]) {
    const fetchMock = mockFetch(t, body);
    await assert.rejects(fetchLatestAndroidDownload(), message);
    fetchMock.mock.restore();
  }
});

test("aborts a stalled fetch after the bounded timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let signal;
  t.mock.method(globalThis, "fetch", (_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal;
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  const rejected = assert.rejects(fetchLatestAndroidDownload(), { name: "AbortError" });
  t.mock.timers.tick(9_999);
  assert.equal(signal.aborted, false);
  t.mock.timers.tick(1);
  await rejected;
  assert.equal(signal.aborted, true);
});
