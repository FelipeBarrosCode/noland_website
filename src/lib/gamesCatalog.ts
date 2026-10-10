import type { GameCatalogEntry, GamesCatalogManifest } from "./gameCompatibility";

let catalogPromise: Promise<{ games: GameCatalogEntry[]; manifest: GamesCatalogManifest }> | null = null;

function isCatalogEntry(value: unknown): value is GameCatalogEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<GameCatalogEntry>;
  return Number.isSafeInteger(entry.steamAppId)
    && typeof entry.title === "string"
    && (entry.protonTier === null || typeof entry.protonTier === "string")
    && (entry.protonFetchedAt === null || typeof entry.protonFetchedAt === "string");
}

function isManifest(value: unknown): value is GamesCatalogManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<GamesCatalogManifest>;
  return typeof manifest.catalog === "string"
    && /^[a-zA-Z0-9._-]+\.json$/u.test(manifest.catalog)
    && typeof manifest.publishedAt === "string"
    && Number.isSafeInteger(manifest.gameCount);
}

async function fetchCatalog(): Promise<{ games: GameCatalogEntry[]; manifest: GamesCatalogManifest }> {
  const manifestResponse = await fetch("/games-data/manifest.json", { cache: "no-cache" });
  if (!manifestResponse.ok) throw new Error(`Catalog manifest returned ${manifestResponse.status}`);

  const manifest: unknown = await manifestResponse.json();
  if (!isManifest(manifest)) throw new Error("Catalog manifest has an invalid format");

  const catalogResponse = await fetch(`/games-data/${manifest.catalog}`, { cache: "force-cache" });
  if (!catalogResponse.ok) throw new Error(`Games catalog returned ${catalogResponse.status}`);

  const catalog: unknown = await catalogResponse.json();
  if (!Array.isArray(catalog) || !catalog.every(isCatalogEntry)) {
    throw new Error("Games catalog has an invalid format");
  }

  return { games: catalog, manifest };
}

export function loadGamesCatalog() {
  catalogPromise ??= fetchCatalog();
  return catalogPromise;
}

export function resetGamesCatalog() {
  catalogPromise = null;
}
