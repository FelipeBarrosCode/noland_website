import { readFile, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const siteUrl = normalizeSiteUrl(process.env.SITE_URL);
const clientHtmlPath = new URL("../dist/index.html", import.meta.url);
const serverBundlePath = new URL("../dist-ssr/entry-server.js", import.meta.url);
const serverOutputPath = new URL("../dist-ssr", import.meta.url);
const robotsPath = new URL("../dist/robots.txt", import.meta.url);
const sitemapPath = new URL("../dist/sitemap.xml", import.meta.url);
const fallbackSocialImage = "https://raw.githubusercontent.com/FelipeBarrosCode/noland_website/main/public/brand/noland-social.jpg";

try {
  const [{ render }, template] = await Promise.all([
    import(pathToFileURL(serverBundlePath.pathname).href),
    readFile(clientHtmlPath, "utf8"),
  ]);

  const appHtml = render();
  let html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  );

  if (siteUrl) {
    const pageUrl = `${siteUrl}/`;
    const socialImageUrl = `${siteUrl}/brand/noland-social.jpg`;
    html = html
      .replace(
        "<!-- seo:origin -->",
        `<link rel="canonical" href="${escapeAttribute(pageUrl)}" />\n    <meta property="og:url" content="${escapeAttribute(pageUrl)}" />`,
      )
      .replaceAll(fallbackSocialImage, socialImageUrl);

    const today = new Date().toISOString().slice(0, 10);
    await writeFile(
      sitemapPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(pageUrl)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
    );

    const robots = await readFile(robotsPath, "utf8");
    await writeFile(robotsPath, `${robots.trim()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  } else {
    html = html.replace("<!-- seo:origin -->", "");
    console.warn("SITE_URL is not set; canonical URL and sitemap generation were skipped.");
  }

  await writeFile(clientHtmlPath, html);
} finally {
  await rm(serverOutputPath, { recursive: true, force: true });
}

function normalizeSiteUrl(value) {
  if (!value) return null;

  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("SITE_URL must use http or https.");
  }

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/u, "");
  return url.toString().replace(/\/$/u, "");
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
