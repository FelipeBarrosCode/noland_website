import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const clientHtmlPath = new URL("../dist/index.html", import.meta.url);
const serverOutputPath = new URL("../dist-ssr", import.meta.url);
const robotsPath = new URL("../dist/robots.txt", import.meta.url);
const sitemapPath = new URL("../dist/sitemap.xml", import.meta.url);

try {
  const [serverBundlePath, template] = await Promise.all([
    resolveServerBundlePath(),
    readFile(clientHtmlPath, "utf8"),
  ]);
  const serverEntry = await import(pathToFileURL(serverBundlePath).href);

  const siteUrl = serverEntry.siteUrl;
  const pages = serverEntry.staticPaths.map((pathname) => {
    const metadata = serverEntry.getPageMetadata(pathname);
    if (!metadata) throw new Error(`Missing metadata for static path: ${pathname}`);
    return metadata;
  });

  for (const metadata of pages) {
    const appHtml = serverEntry.render(metadata.path);
    const pageUrl = new URL(metadata.path, `${siteUrl}/`).toString();
    const socialImageUrl = new URL("/brand/noland-social.jpg", `${siteUrl}/`).toString();
    const html = applyPageMetadata(
      template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`),
      metadata,
      pageUrl,
      socialImageUrl,
      siteUrl,
    );
    const outputUrl = metadata.path === "/"
      ? clientHtmlPath
      : new URL(`../dist${metadata.path}index.html`, import.meta.url);

    await mkdir(dirname(outputUrl.pathname), { recursive: true });
    await writeFile(outputUrl, html);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sitemapEntries = pages.map((page) => {
    const pageUrl = new URL(page.path, `${siteUrl}/`).toString();
    return [
      "  <url>",
      `    <loc>${escapeXml(pageUrl)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${page.changeFrequency}</changefreq>`,
      `    <priority>${page.priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  await writeFile(
    sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
  );

  await writeFile(
    robotsPath,
    [
      "User-agent: *",
      "Allow: /",
      "",
      "User-agent: Googlebot",
      "Allow: /",
      "",
      "User-agent: Bingbot",
      "Allow: /",
      "",
      "User-agent: OAI-SearchBot",
      "Allow: /",
      "",
      "User-agent: ChatGPT-User",
      "Allow: /",
      "",
      "User-agent: GPTBot",
      "Disallow: /",
      "",
      "User-agent: PerplexityBot",
      "Allow: /",
      "",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      "",
    ].join("\n"),
  );

  console.log(`Prerendered ${pages.length} routes for ${siteUrl}.`);
} finally {
  await rm(serverOutputPath, { recursive: true, force: true });
}

async function resolveServerBundlePath() {
  const serverOutputDirectory = serverOutputPath.pathname;
  const entryCandidates = [
    join(serverOutputDirectory, "entry-server.js"),
    ...(await findMatchingFiles(join(serverOutputDirectory, "assets"), /^entry-server-.*\.js$/u)),
  ];

  const serverBundlePath = entryCandidates.find(Boolean);
  if (!serverBundlePath) {
    throw new Error(`Could not find SSR entry bundle in ${serverOutputDirectory}`);
  }

  return serverBundlePath;
}

async function findMatchingFiles(directoryPath, pattern) {
  try {
    const fileNames = await readdir(directoryPath);
    return fileNames.filter((fileName) => pattern.test(fileName)).map((fileName) => join(directoryPath, fileName));
  } catch {
    return [];
  }
}

function applyPageMetadata(html, metadata, pageUrl, socialImageUrl, siteUrl) {
  let updatedHtml = html
    .replace(/<title>[^<]*<\/title>/u, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace("<!-- seo:origin -->", `<link rel="canonical" href="${escapeAttribute(pageUrl)}" />\n    <meta property="og:url" content="${escapeAttribute(pageUrl)}" />`)
    .replaceAll("https://no-land.net", siteUrl)
    .replaceAll("https://raw.githubusercontent.com/FelipeBarrosCode/noland_website/main/public/brand/noland-social.jpg", socialImageUrl);

  updatedHtml = replaceMeta(updatedHtml, "name", "description", metadata.description);
  updatedHtml = replaceMeta(updatedHtml, "property", "og:title", metadata.title);
  updatedHtml = replaceMeta(updatedHtml, "property", "og:description", metadata.description);
  updatedHtml = replaceMeta(updatedHtml, "property", "og:image", socialImageUrl);
  updatedHtml = replaceMeta(updatedHtml, "name", "twitter:title", metadata.title);
  updatedHtml = replaceMeta(updatedHtml, "name", "twitter:description", metadata.description);
  return replaceMeta(updatedHtml, "name", "twitter:image", socialImageUrl);
}

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta(?=[^>]*\\b${attribute}="${escapeRegExp(key)}")[^>]*>`, "u");
  return html.replace(pattern, `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`);
}


function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
