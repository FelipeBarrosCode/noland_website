import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const distDirectory = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const reportsDirectory = resolve(fileURLToPath(new URL("../lighthouse-reports/", import.meta.url)));
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
  const port = await listen(server);
  chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox"] });

  const result = await lighthouse(`http://127.0.0.1:${port}/`, {
    logLevel: "error",
    output: "html",
    onlyCategories: categories,
    port: chrome.port,
  });

  if (!result) {
    throw new Error("Lighthouse did not return a report.");
  }

  await mkdir(reportsDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(reportsDirectory, "lighthouse-mobile.report.html"), result.report),
    writeFile(
      resolve(reportsDirectory, "lighthouse-mobile.report.json"),
      `${JSON.stringify(result.lhr, null, 2)}\n`,
    ),
  ]);

  if (result.lhr.runtimeError) {
    throw new Error(result.lhr.runtimeError.message);
  }

  const scores = Object.fromEntries(
    categories.map((category) => [category, result.lhr.categories[category].score ?? 0]),
  );
  const metrics = Object.fromEntries(
    [
      "first-contentful-paint",
      "largest-contentful-paint",
      "speed-index",
      "total-blocking-time",
      "cumulative-layout-shift",
    ].map((audit) => [audit, result.lhr.audits[audit].displayValue]),
  );

  console.log("\nLighthouse mobile scores");
  for (const [category, score] of Object.entries(scores)) {
    console.log(`  ${category.padEnd(16)} ${Math.round(score * 100)}`);
  }

  console.log("\nCore metrics");
  for (const [metric, value] of Object.entries(metrics)) {
    console.log(`  ${metric.padEnd(26)} ${value}`);
  }
  console.log("\nReports: lighthouse-reports/lighthouse-mobile.report.{html,json}");

  const failures = Object.entries(thresholds).filter(
    ([category, minimum]) => scores[category] < minimum,
  );

  if (failures.length > 0) {
    for (const [category, minimum] of failures) {
      console.error(
        `${category} scored ${Math.round(scores[category] * 100)}; expected at least ${Math.round(minimum * 100)}.`,
      );
    }
    process.exitCode = 1;
  }
} finally {
  if (chrome) await chrome.kill();
  await close(server);
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
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

      if (responseBody !== body) {
        headers["Content-Encoding"] = "gzip";
      }

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
