import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "./ExperienceSections";
import { Navigation } from "./Navigation";
import {
  classifyCompatibility,
  compatibilityLabel,
  compatibilityQualification,
  displayProtonTier,
  normalizeGameTitle,
  searchGames,
  type GameCatalogEntry,
  type GamesCatalogManifest,
} from "../lib/gameCompatibility";
import { loadGamesCatalog, resetGamesCatalog } from "../lib/gamesCatalog";
import { checkLiveCompatibility } from "../lib/liveCompatibility";

type LoadState = "loading" | "ready" | "error";

function formatRetrievedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function GameResult({ game, isChecking }: { game: GameCatalogEntry; isChecking: boolean }) {
  const compatibility = classifyCompatibility(game.protonTier);
  const tier = displayProtonTier(game.protonTier);
  const retrievedDate = formatRetrievedDate(game.protonFetchedAt);

  return (
    <article className="game-result">
      <div className="game-result__main">
        <p className="game-result__id">STEAM APP {game.steamAppId}</p>
        <h2>{game.title}</h2>
        <div className="game-result__status">
          <span className={`compatibility-badge compatibility-badge--${compatibility}`}>
            {compatibilityLabel(game.protonTier)}
          </span>
          {tier ? <span className="proton-tier">ProtonDB: <strong>{tier}</strong></span> : null}
        </div>
        {compatibility === "unknown" ? (
          <div className="game-result__unknown">
            <h3>{isChecking ? "Checking the latest ProtonDB rating…" : "Compatibility hasn’t been confirmed."}</h3>
            <p>{isChecking ? "This first lookup may take a moment. Future visitors will use the cached result." : "We found the game, but don’t have a ProtonDB rating for it yet. Check its ProtonDB page for recent reports."}</p>
          </div>
        ) : <p className="game-result__qualification">{compatibilityQualification(game.protonTier)}</p>}
      </div>
      <div className="game-result__meta">
        <div className="game-result__links">
          <a href={`https://www.protondb.com/app/${game.steamAppId}`} target="_blank" rel="noreferrer">View on ProtonDB <span aria-hidden="true">↗</span></a>
          <a href={`https://store.steampowered.com/app/${game.steamAppId}/`} target="_blank" rel="noreferrer">View on Steam <span aria-hidden="true">↗</span></a>
        </div>
        <p>{retrievedDate ? <>{compatibility === "unknown" ? "ProtonDB checked" : "Rating retrieved"} <time dateTime={game.protonFetchedAt ?? undefined}>{retrievedDate}</time></> : "Rating not yet retrieved"}</p>
      </div>
    </article>
  );
}

export function GamesPage() {
  const [catalog, setCatalog] = useState<GameCatalogEntry[]>([]);
  const [manifest, setManifest] = useState<GamesCatalogManifest | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [settledQuery, setSettledQuery] = useState("");
  const [liveRatings, setLiveRatings] = useState<Map<number, { tier: string | null; checkedAt: string }>>(new Map());
  const [checkingIds, setCheckingIds] = useState<Set<number>>(new Set());
  const [failedCheckIds, setFailedCheckIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    setLoadState("loading");

    loadGamesCatalog()
      .then(({ games, manifest: loadedManifest }) => {
        if (!active) return;
        setCatalog(games);
        setManifest(loadedManifest);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) setLoadState("error");
      });

    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledQuery(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const catalogResults = useMemo(() => searchGames(catalog, settledQuery), [catalog, settledQuery]);
  const results = useMemo(() => catalogResults.map((game) => {
    const liveRating = liveRatings.get(game.steamAppId);
    return liveRating
      ? { ...game, protonTier: liveRating.tier, protonFetchedAt: liveRating.checkedAt }
      : game;
  }), [catalogResults, liveRatings]);
  const canSearch = loadState === "ready";
  const normalizedQueryLength = normalizeGameTitle(settledQuery).length;
  const hasSearched = canSearch && normalizedQueryLength >= 2;

  useEffect(() => {
    if (!hasSearched) return;

    const gamesToCheck = catalogResults
      .slice(0, 3)
      .filter((game) => game.protonTier === null
        && !liveRatings.has(game.steamAppId)
        && !checkingIds.has(game.steamAppId)
        && !failedCheckIds.has(game.steamAppId));
    if (gamesToCheck.length === 0) return;

    setCheckingIds((current) => new Set([...current, ...gamesToCheck.map((game) => game.steamAppId)]));
    for (const game of gamesToCheck) {
      checkLiveCompatibility(game.steamAppId)
        .then((result) => {
          setLiveRatings((current) => new Map(current).set(game.steamAppId, result));
        })
        .catch(() => {
          setFailedCheckIds((current) => new Set(current).add(game.steamAppId));
        })
        .finally(() => {
          setCheckingIds((current) => {
            const updated = new Set(current);
            updated.delete(game.steamAppId);
            return updated;
          });
        });
    }
  }, [catalogResults, checkingIds, failedCheckIds, hasSearched, liveRatings]);

  const retry = () => {
    resetGamesCatalog();
    setLoadAttempt((attempt) => attempt + 1);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content" className="games-page">
        <section className="games-hero" aria-labelledby="games-title">
          <div className="games-hero__grid" aria-hidden="true" />
          <div className="shell games-hero__inner">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <a href="/">Noland Cloud Gaming</a><span aria-hidden="true">/</span><span>Games</span>
            </nav>
            <p className="eyebrow"><span aria-hidden="true">//</span> GAME COMPATIBILITY</p>
            <h1 id="games-title">Can you play it on <span>No Land?</span></h1>
            <p className="games-hero__lede">Search for a game to check its Linux compatibility using Steam and ProtonDB data.</p>

            <div className="game-search">
              <label htmlFor="game-search-input">Search the Steam catalog</label>
              <div className="game-search__field">
                <span aria-hidden="true">⌕</span>
                <input
                  id="game-search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search games by title…"
                  autoComplete="off"
                  spellCheck="false"
                  aria-describedby="game-search-help game-search-status"
                  disabled={!canSearch}
                />
                {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear game search">CLEAR</button> : null}
              </div>
              <p id="game-search-help">Games run on your remote Linux machine. Your local device’s operating system does not change the game’s Linux compatibility.</p>
              <p id="game-search-status" className="game-search__status" aria-live="polite">
                {loadState === "loading" ? "Loading compatibility catalog…" : null}
                {loadState === "ready" && normalizedQueryLength < 2 ? "Enter at least two characters to search." : null}
                {hasSearched ? `${results.length} ${results.length === 1 ? "result" : "results"} shown.` : null}
              </p>
            </div>
          </div>
        </section>

        <section className="games-results-section" aria-label="Game compatibility results">
          <div className="shell">
            {loadState === "error" ? (
              <div className="games-message games-message--error" role="alert">
                <p className="panel-kicker">CATALOG OFFLINE</p>
                <h2>The compatibility checker is temporarily unavailable.</h2>
                <p>Please try again. This error does not indicate whether your game is supported.</p>
                <button className="button button--primary" type="button" onClick={retry}>Retry <span aria-hidden="true">↻</span></button>
              </div>
            ) : null}

            {hasSearched && results.length === 0 ? (
              <div className="games-message">
                <p className="panel-kicker">NO TITLE MATCHED</p>
                <h2>We couldn’t find that game.</h2>
                <p>That doesn’t mean it won’t work on No Land. Games without incompatible kernel-level anti-cheat may still run, but we haven’t confirmed this title. Check its Linux or Proton compatibility before renting a machine.</p>
              </div>
            ) : null}

            {hasSearched && results.length > 0 ? (
              <div className="games-results">
                <div className="games-results__heading">
                  <div><p className="panel-kicker">SEARCH RESULTS</p><h2>Choose the title you meant</h2></div>
                  <p>Showing up to 10 matches. Ratings never substitute one edition for another.</p>
                </div>
                <div className="games-results__list">{results.map((game) => <GameResult game={game} isChecking={checkingIds.has(game.steamAppId)} key={game.steamAppId} />)}</div>
              </div>
            ) : null}

            {!hasSearched && loadState === "ready" ? (
              <div className="games-empty" aria-hidden="true"><span>01</span><strong>TYPE A TITLE</strong><i>LOCAL CATALOG SEARCH</i></div>
            ) : null}
          </div>
        </section>

        <section className="games-compatibility" aria-labelledby="compatibility-rules-title">
          <div className="shell games-compatibility__layout">
            <div>
              <p className="eyebrow"><span aria-hidden="true">//</span> HOW RATINGS WORK</p>
              <h2 id="compatibility-rules-title">A clear answer, with the caveats intact.</h2>
              <p>Platinum, Gold, Silver, Bronze, and explicitly reported Native titles are included as supported. Silver and Bronze are marked as potentially requiring workarounds. Borked titles are not supported. Missing, pending, or unrecognized ratings remain unknown.</p>
            </div>
            <div className="compatibility-key">
              <div><span className="compatibility-badge compatibility-badge--supported">Supported</span><p>Native, Platinum, Gold, Silver, or Bronze</p></div>
              <div><span className="compatibility-badge compatibility-badge--unsupported">Not supported</span><p>Borked aggregate rating</p></div>
              <div><span className="compatibility-badge compatibility-badge--unknown">Compatibility unknown</span><p>Pending, missing, or unavailable rating</p></div>
            </div>
          </div>
        </section>

        <section className="games-download">
          <div className="shell games-download__inner">
            <div><p className="panel-kicker">READY TO PLAY?</p><h2>Bring your library to your remote Linux machine.</h2></div>
            <a className="button button--primary button--large" href="/#downloads">Download Noland <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <aside className="games-disclaimer">
          <div className="shell">
            <p>Compatibility is based on community reports, not individual testing by No Land. Missing catalog ratings may be checked through a cached edge lookup. Results may vary with the game version, configuration, and selected machine.</p>
            {manifest ? <p>Catalog published <time dateTime={manifest.publishedAt}>{formatRetrievedDate(manifest.publishedAt)}</time> · {manifest.gameCount.toLocaleString("en-US")} searchable titles</p> : null}
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
