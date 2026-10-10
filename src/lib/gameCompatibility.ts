export type Compatibility = "supported" | "unsupported" | "unknown";

export interface GameCatalogEntry {
  steamAppId: number;
  title: string;
  protonTier: string | null;
  protonFetchedAt: string | null;
}

export interface GamesCatalogManifest {
  catalog: string;
  publishedAt: string;
  gameCount: number;
}

export interface RankedGame extends GameCatalogEntry {
  matchRank: number;
}

const SUPPORTED_TIERS = new Set([
  "native",
  "platinum",
  "gold",
  "silver",
  "bronze",
]);

const KNOWN_TIERS = new Set([...SUPPORTED_TIERS, "borked", "pending"]);

export function normalizeGameTitle(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function classifyCompatibility(rawTier: unknown): Compatibility {
  if (typeof rawTier !== "string") return "unknown";

  const tier = rawTier.trim().toLowerCase();
  if (tier === "borked") return "unsupported";
  if (SUPPORTED_TIERS.has(tier)) return "supported";
  return "unknown";
}

export function displayProtonTier(rawTier: unknown): string | null {
  if (typeof rawTier !== "string") return null;
  const tier = rawTier.trim().toLowerCase();
  if (!KNOWN_TIERS.has(tier)) return null;
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;
}

export function compatibilityLabel(rawTier: unknown): string {
  const tier = typeof rawTier === "string" ? rawTier.trim().toLowerCase() : "";
  if (tier === "borked") return "Not supported";
  if (tier === "native") return "Supported — native Linux";
  if (tier === "silver" || tier === "bronze") return "Supported — may require workarounds";
  if (tier === "platinum" || tier === "gold") return "Supported";
  return "Compatibility unknown";
}

export function compatibilityQualification(rawTier: unknown): string {
  const tier = typeof rawTier === "string" ? rawTier.trim().toLowerCase() : "";
  if (tier === "native") return "Native Linux version reported by the source";
  if (tier === "silver" || tier === "bronze") return "May require workarounds";
  if (tier === "platinum" || tier === "gold") return "Strong community compatibility rating";
  if (tier === "borked") return "Rated Borked by ProtonDB";
  return "No aggregate ProtonDB rating is available";
}

function levenshteinDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previous = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const current = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        previous + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[right.length];
}

function fuzzyWordsMatch(queryWords: string[], titleWords: string[]): boolean {
  return queryWords.every((queryWord) => titleWords.some((titleWord) => {
    if (titleWord.startsWith(queryWord) || titleWord.includes(queryWord)) return true;
    if (queryWord.length < 4) return false;
    return levenshteinDistance(queryWord, titleWord) <= Math.max(1, Math.floor(queryWord.length * 0.25));
  }));
}

function getMatchRank(normalizedTitle: string, normalizedQuery: string): number | null {
  if (normalizedTitle === normalizedQuery) return 0;
  if (normalizedTitle.startsWith(normalizedQuery)) return 1;

  const queryWords = normalizedQuery.split(" ");
  if (queryWords.every((word) => normalizedTitle.includes(word))) return 2;
  if (normalizedTitle.includes(normalizedQuery)) return 3;
  if (fuzzyWordsMatch(queryWords, normalizedTitle.split(" "))) return 3;
  return null;
}

export function searchGames(catalog: GameCatalogEntry[], query: string, limit = 10): RankedGame[] {
  const normalizedQuery = normalizeGameTitle(query);
  if (normalizedQuery.length < 2) return [];

  return catalog
    .map((game) => {
      const matchRank = getMatchRank(normalizeGameTitle(game.title), normalizedQuery);
      return matchRank === null ? null : { ...game, matchRank };
    })
    .filter((game): game is RankedGame => game !== null)
    .sort((left, right) => (
      left.matchRank - right.matchRank
      || left.title.length - right.title.length
      || left.title.localeCompare(right.title)
    ))
    .slice(0, limit);
}
