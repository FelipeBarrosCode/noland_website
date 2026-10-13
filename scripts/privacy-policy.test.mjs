import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = new URL("../dist/", import.meta.url);

test("privacy policy is prerendered with its own metadata and substantive content", () => {
  const html = readFileSync(new URL("privacy-policy/index.html", dist), "utf8");
  assert.ok(html.includes("<title>Privacy Policy — No Land</title>"));
  assert.ok(html.includes('rel="canonical" href="https://no-land.net/privacy-policy/"'));
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(html.includes("developer-operated provisioning backend"));
  assert.ok(html.includes("Running locally does not mean"));
  for (const topic of ["Vast.ai", "Shared Storage", "Cloudflare", "PostHog", "felipe.ba.moura@gmail.com"]) {
    assert.ok(html.includes(topic), topic);
  }
});

test("privacy policy is included in the generated sitemap", () => {
  const sitemap = readFileSync(new URL("sitemap.xml", dist), "utf8");
  assert.ok(sitemap.includes("<loc>https://no-land.net/privacy-policy/</loc>"));
});

test("every prerendered page includes the privacy policy in its footer", () => {
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (entry.name === "index.html") {
        const html = readFileSync(path, "utf8");
        const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
        assert.ok(footer?.includes('href="/privacy-policy/"'), path);
      }
    }
  }
  inspect(fileURLToPath(dist));
});
