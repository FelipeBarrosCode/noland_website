import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const rootDirectory = resolve(import.meta.dirname, "..");
const cacheDirectory = resolve(rootDirectory, process.env.GAMES_CACHE_DIR ?? ".cache/games-data");
const outputDirectory = resolve(rootDirectory, process.env.GAMES_OUTPUT_DIR ?? "public/games-data");
const steamCachePath = resolve(cacheDirectory, "steam-games.json");
const protonCachePath = resolve(cacheDirectory, "protondb-summaries.json");
const manifestPath = resolve(outputDirectory, "manifest.json");

const steamApiKey = process.env.STEAM_WEB_API_KEY;
const requestBudget = readNonNegativeInteger("PROTONDB_REQUEST_BUDGET", 25);
const requestDelayMs = readNonNegativeInteger("PROTONDB_DELAY_MS", 2_000);
const successTtlMs = readNonNegativeInteger("PROTONDB_SUCCESS_TTL_HOURS", 168) * 60 * 60 * 1_000;
const missingTtlMs = readNonNegativeInteger("PROTONDB_MISSING_TTL_HOURS", 24) * 60 * 60 * 1_000;
const priorityAppIds = readPriorityAppIds();

await mkdir(cacheDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });

const previousManifest = await readJson(manifestPath, null);
const previousPublishedCatalog = await readPublishedCatalog(previousManifest);
const cachedSteamState = await readJson(steamCachePath, { updatedAt: null, games: [] });
const previousSteamState = Array.isArray(cachedSteamState.games) && cachedSteamState.games.length > 0
  ? cachedSteamState
  : {
      updatedAt: typeof previousManifest?.publishedAt === "string" ? previousManifest.publishedAt : null,
      games: previousPublishedCatalog.map(({ steamAppId, title }) => ({ steamAppId, title })),
    };
let steamGames;

if (steamApiKey) {
  const refreshStartedAt = new Date();
  const steamUpdates = await fetchSteamGames(previousSteamState.updatedAt);
  steamGames = mergeSteamGames(previousSteamState.games, steamUpdates);

  if (steamGames.length === 0) {
    throw new Error("Steam returned no games; the previous published catalog was left unchanged.");
  }

  await writeJsonAtomically(steamCachePath, {
    updatedAt: refreshStartedAt.toISOString(),
    games: steamGames,
  });
} else if (Array.isArray(previousSteamState.games) && previousSteamState.games.length > 0) {
  steamGames = previousSteamState.games;
  console.warn("STEAM_WEB_API_KEY is not set; reusing the cached Steam catalog without refreshing titles.");
  if (!Array.isArray(cachedSteamState.games) || cachedSteamState.games.length === 0) {
    await writeJsonAtomically(steamCachePath, previousSteamState);
  }
} else {
  throw new Error("STEAM_WEB_API_KEY is required for the first Steam catalog import. Put it in the project-root .env file.");
}

if (steamGames.length === 0) {
  throw new Error("Steam returned no games; the previous published catalog was left unchanged.");
}

const protonCache = await readJson(protonCachePath, {});
seedProtonCache(protonCache, previousPublishedCatalog);
await refreshProtonSummaries(steamGames, protonCache);
await writeJsonAtomically(protonCachePath, protonCache);

const catalog = steamGames
  .map((game) => {
    const summary = protonCache[String(game.steamAppId)];
    return {
      steamAppId: game.steamAppId,
      title: game.title,
      protonTier: summary?.status === "ok" ? summary.tier : null,
      protonFetchedAt: summary?.status === "ok" ? summary.fetchedAt : null,
    };
  })
  .sort((left, right) => left.title.localeCompare(right.title) || left.steamAppId - right.steamAppId);

const catalogJson = `${JSON.stringify(catalog)}\n`;
const contentHash = createHash("sha256").update(catalogJson).digest("hex").slice(0, 16);
const catalogFileName = `catalog.${contentHash}.json`;
const publishedAt = new Date().toISOString();

await writeFile(resolve(outputDirectory, catalogFileName), catalogJson);
if (previousManifest?.catalog !== catalogFileName) {
  await writeJsonAtomically(manifestPath, {
    catalog: catalogFileName,
    publishedAt,
    gameCount: catalog.length,
  });
}
await removeStaleCatalogs(catalogFileName, previousManifest?.catalog);

console.log(previousManifest?.catalog === catalogFileName
  ? `Catalog content is unchanged (${catalog.length.toLocaleString("en-US")} games).`
  : `Published ${catalog.length.toLocaleString("en-US")} games as ${catalogFileName}.`);

async function readPublishedCatalog(manifest) {
  if (!manifest || typeof manifest.catalog !== "string" || !/^catalog\.[a-f0-9]{16}\.json$/u.test(manifest.catalog)) return [];
  const catalog = await readJson(resolve(outputDirectory, manifest.catalog), []);
  return Array.isArray(catalog) ? catalog.filter((game) => (
    Number.isSafeInteger(game?.steamAppId)
    && typeof game?.title === "string"
  )) : [];
}

function seedProtonCache(cache, publishedCatalog) {
  for (const game of publishedCatalog) {
    const key = String(game.steamAppId);
    if (
      !cache[key]
      && typeof game.protonTier === "string"
      && game.protonTier
      && typeof game.protonFetchedAt === "string"
    ) {
      cache[key] = { status: "ok", tier: game.protonTier, fetchedAt: game.protonFetchedAt };
    }
  }
}

async function removeStaleCatalogs(currentCatalog, previousCatalog) {
  const retained = new Set([currentCatalog, previousCatalog].filter(Boolean));
  const entries = await readdir(outputDirectory);
  await Promise.all(entries
    .filter((entry) => /^catalog\.[a-f0-9]{16}\.json$/u.test(entry) && !retained.has(entry))
    .map((entry) => unlink(resolve(outputDirectory, entry))));
}

async function fetchSteamGames(updatedAt) {
  const games = [];
  let lastAppId;

  do {
    const url = new URL("https://api.steampowered.com/IStoreService/GetAppList/v1/");
    url.searchParams.set("key", steamApiKey);
    url.searchParams.set("include_games", "true");
    url.searchParams.set("include_dlc", "false");
    url.searchParams.set("include_software", "false");
    url.searchParams.set("include_videos", "false");
    url.searchParams.set("include_hardware", "false");
    url.searchParams.set("max_results", "50000");
    if (updatedAt) url.searchParams.set("if_modified_since", String(Math.floor(new Date(updatedAt).getTime() / 1_000)));
    if (lastAppId) url.searchParams.set("last_appid", String(lastAppId));

    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Steam catalog request failed with HTTP ${response.status}; published data was not changed.`);

    const body = await response.json();
    const page = body?.response;
    if (!page || !Array.isArray(page.apps)) throw new Error("Steam returned an invalid catalog response; published data was not changed.");

    for (const app of page.apps) {
      if (Number.isSafeInteger(app.appid) && typeof app.name === "string" && app.name.trim()) {
        games.push({ steamAppId: app.appid, title: app.name.trim() });
      }
    }

    lastAppId = page.have_more_results && Number.isSafeInteger(page.last_appid) ? page.last_appid : undefined;
  } while (lastAppId);

  return games;
}

function mergeSteamGames(previousGames, updates) {
  const merged = new Map();
  for (const game of previousGames) {
    if (Number.isSafeInteger(game?.steamAppId) && typeof game?.title === "string") merged.set(game.steamAppId, game);
  }
  for (const game of updates) merged.set(game.steamAppId, game);
  return [...merged.values()];
}

async function refreshProtonSummaries(games, cache) {
  const now = Date.now();
  let updatesSinceCheckpoint = 0;
  const priorityOrder = new Map(priorityAppIds.map((appId, index) => [appId, index]));
  const eligible = games
    .filter((game) => {
      const record = cache[String(game.steamAppId)];
      if (!record || typeof record.fetchedAt !== "string") return true;
      const age = now - new Date(record.fetchedAt).getTime();
      return !Number.isFinite(age) || age >= (record.status === "missing" ? missingTtlMs : successTtlMs);
    })
    .sort((left, right) => {
      const leftPriority = priorityOrder.get(left.steamAppId);
      const rightPriority = priorityOrder.get(right.steamAppId);
      if (leftPriority !== undefined || rightPriority !== undefined) {
        if (leftPriority === undefined) return 1;
        if (rightPriority === undefined) return -1;
        return leftPriority - rightPriority;
      }

      const leftRecord = cache[String(left.steamAppId)];
      const rightRecord = cache[String(right.steamAppId)];
      const cacheRank = (record) => !record ? 0 : record.status === "ok" ? 1 : 2;
      return cacheRank(leftRecord) - cacheRank(rightRecord);
    })
    .slice(0, requestBudget);

  if (eligible.length === 0) {
    console.log("No ProtonDB summaries are eligible within this run's budget and TTLs.");
    return;
  }

  console.log(`Refreshing up to ${eligible.length} ProtonDB summaries sequentially.`);
  for (let index = 0; index < eligible.length; index += 1) {
    const game = eligible[index];
    const result = await fetchProtonSummary(game.steamAppId);
    if (result.record) {
      cache[String(game.steamAppId)] = result.record;
      updatesSinceCheckpoint += 1;
    }
    if (result.stop || updatesSinceCheckpoint >= 25) {
      await writeJsonAtomically(protonCachePath, cache);
      updatesSinceCheckpoint = 0;
    }
    if (result.stop) break;
    if (index < eligible.length - 1) await sleep(requestDelayMs);
  }
}

function readPriorityAppIds() {
  const fromEnvironment = (process.env.PROTONDB_APP_IDS ?? "").split(",");
  const fromArguments = process.argv.slice(2).flatMap((argument) => {
    if (argument.startsWith("--app-ids=")) return argument.slice("--app-ids=".length).split(",");
    return /^\d+$/u.test(argument) ? [argument] : [];
  });

  return [...new Set([...fromEnvironment, ...fromArguments]
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isSafeInteger(value) && value > 0))];
}

async function fetchProtonSummary(steamAppId) {
  let response;
  try {
    response = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${steamAppId}.json`, {
      headers: { Accept: "application/json", "User-Agent": "NolandGamesCatalog/1.0 (https://no-land.net/games/)" },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.warn(`ProtonDB ${steamAppId}: request failed; retaining cached data.`, error instanceof Error ? error.message : error);
    return {};
  }

  if (response.status === 404) {
    return { record: { status: "missing", tier: null, fetchedAt: new Date().toISOString() } };
  }
  if (response.status === 429) {
    console.warn(`ProtonDB rate limited the batch${response.headers.get("retry-after") ? ` (Retry-After: ${response.headers.get("retry-after")})` : ""}; stopping.`);
    return { stop: true };
  }
  if (response.status === 403) {
    console.warn("ProtonDB denied access; stopping without trying alternate hosts or proxies.");
    return { stop: true };
  }
  if (!response.ok) {
    console.warn(`ProtonDB ${steamAppId}: HTTP ${response.status}; retaining cached data.`);
    return {};
  }

  try {
    const summary = await response.json();
    if (typeof summary?.tier !== "string" || !summary.tier.trim()) {
      console.warn(`ProtonDB ${steamAppId}: invalid summary schema; retaining cached data.`);
      return {};
    }
    return { record: { status: "ok", tier: summary.tier.trim().toLowerCase(), fetchedAt: new Date().toISOString() } };
  } catch {
    console.warn(`ProtonDB ${steamAppId}: invalid JSON; retaining cached data.`);
    return {};
  }
}

function readNonNegativeInteger(name, fallback) {
  const rawValue = process.env[name];
  if (rawValue === undefined) return fallback;
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer.`);
  return value;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return fallback;
    throw new Error(`Could not read ${path}: ${error instanceof Error ? error.message : error}`);
  }
}

async function writeJsonAtomically(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporaryPath, path);
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}
