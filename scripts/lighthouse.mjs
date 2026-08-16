import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const distDirectory = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const reportsDirectory = resolve(fileURLToPath(new URL("../lighthouse-reports/", import.meta.url)));
const sitemapPath = resolve(distDirectory, "sitemap.xml");
const categories = ["performance", "accessibility", "best-practices", "seo"];
const thresholds = {
  performance: 0.95,
  accessibility: 1,
  "best-practices": 1,
  seo: 1,
};

const server = createStaticServer();
let chrome;

try {
  const auditPaths = await readAuditPaths();
  const port = await listen(server);
  chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox"] });
  await rm(reportsDirectory, { recursive: true, force: true });
  await mkdir(reportsDirectory, { recursive: true });

  const failures = [];

  for (const pathname of auditPaths) {
    const result = await lighthouse(`http://127.0.0.1:${port}${pathname}`, {
      logLevel: "error",
      output: "html",
      onlyCategories: categories,
      port: chrome.port,
    });

    if (!result) throw new Error(`Lighthouse did not return a report for ${pathname}.`);

    const reportName = pathname === "/"
      ? "home"
      : pathname.replace(/^\/+|\/+$/gu, "").replaceAll("/", "-");

    await Promise.all([
      writeFile(resolve(reportsDirectory, `${reportName}.report.html`), result.report),
      writeFile(
        resolve(reportsDirectory, `${reportName}.report.json`),
        `${JSON.stringify(result.lhr, null, 2)}\n`,
      ),
    ]);

    if (result.lhr.runtimeError) throw new Error(result.lhr.runtimeError.message);

    const scores = Object.fromEntries(
      categories.map((category) => [category, result.lhr.categories[category].score ?? 0]),
    );
    const metrics = Object.fromEntries(
      [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
      ].map((audit) => [audit, result.lhr.audits[audit].displayValue]),
    );

    console.log(`\n${pathname}`);
    console.log(
      categories.map((category) => `${category}: ${Math.round(scores[category] * 100)}`).join(" | "),
    );
    console.log(
      `FCP ${metrics["first-contentful-paint"]} | LCP ${metrics["largest-contentful-paint"]} | TBT ${metrics["total-blocking-time"]} | CLS ${metrics["cumulative-layout-shift"]}`,
    );

    for (const [category, minimum] of Object.entries(thresholds)) {
      if (scores[category] < minimum) {
        failures.push({ pathname, category, score: scores[category], minimum });
      }
    }
  }

  console.log(`\nAudited ${auditPaths.length} sitemap routes with Lighthouse's mobile profile.`);
  console.log("Reports: lighthouse-reports/*.report.{html,json}");

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(
        `${failure.pathname} ${failure.category} scored ${Math.round(failure.score * 100)}; expected at least ${Math.round(failure.minimum * 100)}.`,
      );
    }
    process.exitCode = 1;
  }
} finally {
  if (chrome) await chrome.kill();
  await close(server);
}

async function readAuditPaths() {
  const sitemap = await readFile(sitemapPath, "utf8");
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => new URL(match[1]).pathname);
  if (paths.length === 0) throw new Error("No URLs were found in dist/sitemap.xml.");
  return paths;
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      const relativePath = pathname.endsWith("/")
        ? `${pathname.replace(/^\/+/, "")}index.html`
        : pathname.replace(/^\/+/, "");
      const filePath = resolve(distDirectory, relativePath);

      if (filePath !== distDirectory && !filePath.startsWith(`${distDirectory}${sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const body = await readFile(filePath);
      const contentType = getContentType(filePath);
      const canCompress = /^(application\/(javascript|json|xml)|text\/)/u.test(contentType);
      const acceptsGzip = request.headers["accept-encoding"]?.includes("gzip") ?? false;
      const responseBody = canCompress && acceptsGzip ? gzipSync(body, { level: 9 }) : body;
      const headers = {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
        "Vary": "Accept-Encoding",
      };

      if (responseBody !== body) headers["Content-Encoding"] = "gzip";

      response.writeHead(200, headers);
      response.end(responseBody);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
}

function getContentType(filePath) {
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".xml": "application/xml; charset=utf-8",
  }[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function listen(httpServer) {
  return new Promise((resolvePort, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", () => {
      const address = httpServer.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to resolve the audit server port."));
        return;
      }
      resolvePort(address.port);
    });
  });
}

function close(httpServer) {
  return new Promise((resolveClose, reject) => {
    if (!httpServer.listening) {
      resolveClose();
      return;
    }
    httpServer.close((error) => error ? reject(error) : resolveClose());
  });
}
