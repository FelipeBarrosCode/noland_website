import { useEffect, useState, type CSSProperties } from "react";
import { captureAnalyticsEvent } from "../lib/analytics";
import { DOWNLOADS_SECTION_ID } from "../lib/siteLinks";

const architectureNodes = [
  { label: "YOU", detail: "Noland client", tone: "cyan" },
  { label: "NOLAND", detail: "orchestration", tone: "pink" },
  { label: "P2P / DIRECT", detail: "stream route", tone: "lime" },
  { label: "RENTED RTX PC", detail: "Vast provider", tone: "yellow" },
];

const bootSteps = ["Select", "Provision", "Connect", "Play"];

type HeroOffer = {
  countryCode: string;
  price: number;
};

type HeroRawOffer = {
  geolocation?: string;
  dph_total?: number;
  dph_base?: number;
  search?: { gpuCostPerHour?: number; diskHour?: number };
  instance?: { gpuCostPerHour?: number; diskHour?: number };
};

type HeroOffersResponse = {
  offers?: HeroRawOffer[];
};

function getBrowserCountry(): string {
  if (typeof navigator === "undefined") return "GLOBAL";

  try {
    return new Intl.Locale(navigator.language).region?.toUpperCase() ?? "GLOBAL";
  } catch {
    return "GLOBAL";
  }
}

function normalizeHeroOffer(raw: HeroRawOffer): HeroOffer | null {
  const locationParts = raw.geolocation?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  const country = locationParts[locationParts.length - 1]?.toUpperCase() ?? "";
  const price = Number(raw.dph_total)
    || Number(raw.dph_base)
    || Number(raw.search?.gpuCostPerHour) + Number(raw.search?.diskHour)
    || Number(raw.instance?.gpuCostPerHour) + Number(raw.instance?.diskHour);

  return /^[A-Z]{2}$/u.test(country) && Number.isFinite(price) && price > 0
    ? { countryCode: country, price }
    : null;
}

function selectHeroOffer(offers: HeroOffer[], countryCode: string): HeroOffer | null {
  const nearby = offers.filter((offer) => offer.countryCode === countryCode);
  const candidates = nearby.length > 0 ? nearby : offers;
  if (candidates.length === 0) return null;

  const prices = candidates.map((offer) => offer.price).sort((left, right) => left - right);
  const bucketCount = Math.min(18, Math.max(6, Math.ceil(Math.sqrt(prices.length) * 2)));
  const minimum = prices[0];
  const maximum = prices[prices.length - 1] ?? minimum;
  const bucketWidth = maximum === minimum ? 0 : (maximum - minimum) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, () => [] as HeroOffer[]);

  for (const offer of candidates) {
    const index = maximum === minimum
      ? Math.floor(bucketCount / 2)
      : Math.min(bucketCount - 1, Math.floor((offer.price - minimum) / bucketWidth));
    buckets[index].push(offer);
  }

  const kernel = [0.12, 0.32, 0.5, 0.32, 0.12];
  const density = buckets.map((_, index) => kernel.reduce(
    (sum, weight, kernelIndex) => sum + (buckets[index + kernelIndex - 2]?.length ?? 0) * weight,
    0,
  ));
  const mostAvailableIndex = density.reduce(
    (bestIndex, value, index) => value > density[bestIndex] ? index : bestIndex,
    0,
  );
  const mostAvailableBucket = buckets[mostAvailableIndex] ?? [];
  return [...mostAvailableBucket].sort((left, right) => left.price - right.price)[0] ?? null;
}

function formatHeroPrice(price: number): string {
  return `$${price.toFixed(price < 1 ? 2 : 0)}/hr`;
}

export function Hero() {
  const [recommendedOffer, setRecommendedOffer] = useState<HeroOffer | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const countryCode = getBrowserCountry();

    fetch("/api/vast/offers", { headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => response.json() as Promise<HeroOffersResponse>)
      .then((payload) => {
        const offers = (payload.offers ?? [])
          .map(normalizeHeroOffer)
          .filter((offer): offer is HeroOffer => offer !== null);
        setRecommendedOffer(selectHeroOffer(offers, countryCode));
      })
      .catch(() => {
        // The static value proposition remains useful if live inventory is unavailable.
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-grid shell">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">//</span> PAY-AS-YOU-GO CLOUD GAMING</p>
          <h1 id="hero-title">Rent a cloud gaming PC. <span>Pay about the price of a hot dog.</span></h1>
          <p className="hero-lede">
            Pick a GPU, launch your cloud PC, and pay only while you use it—for the hardware you choose. Noland handles the setup.
          </p>
          <div className="hero-actions">
            <a
              className="button button--primary button--large"
              href={`/#${DOWNLOADS_SECTION_ID}`}
              onClick={() => captureAnalyticsEvent("download_cta_clicked", { source: "hero" })}
            >
              Get Noland <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="/#how-it-works">See how it works <span aria-hidden="true">→</span></a>
          </div>
          <ul className="hero-facts" aria-label="Product highlights">
            <li><strong>{recommendedOffer ? formatHeroPrice(recommendedOffer.price) : "LIVE"}</strong><span>{recommendedOffer ? "best nearby offer" : "checking nearby offers"}</span></li>
            <li><strong>10–15 min</strong><span>average provisioning</span></li>
            <li><strong>300K+</strong><span>games supported</span></li>
          </ul>
        </div>

        <div className="hero-deck" aria-label="Noland connection architecture">
          <div className="deck-frame">
            <div className="deck-topbar">
              <div>
                <span className="deck-label">NOLAND // CONTROL DECK</span>
                <span className="deck-id">LINK_01</span>
              </div>
              <div className="signal" role="status" aria-label="System ready"><i /><i /><i /><i /></div>
            </div>

            <div className="deck-screen">
              <div className="deck-screen__grid" aria-hidden="true" />
              <div className="architecture-flow">
                {architectureNodes.map((node, index) => (
                  <div className="architecture-segment" key={node.label}>
                    <div className={`architecture-node architecture-node--${node.tone}`}>
                      <span className="architecture-node__index">0{index + 1}</span>
                      <span className="architecture-node__label">{node.label}</span>
                      <small>{node.detail}</small>
                    </div>
                    {index < architectureNodes.length - 1 ? (
                      <span className="architecture-link" aria-hidden="true"><i /><i /><i /></span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="route-readout">
                <span>ROUTE</span>
                <strong>CLIENT ↔ PROVIDER</strong>
                <em>SESSION DATA: DIRECT PATH</em>
              </div>
            </div>

            <div className="boot-sequence" aria-label="Connection sequence">
              {bootSteps.map((step, index) => (
                <div className="boot-step" key={step} style={{ "--step-delay": `${index * 0.72}s` } as CSSProperties}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                  <i aria-hidden="true" />
                </div>
              ))}
            </div>

            <div className="deck-controls" aria-hidden="true">
              <div className="dial"><span /></div>
              <div className="control-copy"><span>NETWORK</span><strong>P2P READY</strong></div>
              <div className="led-row"><i /><i /><i /></div>
              <div className="deck-key">START</div>
            </div>
          </div>
          <div className="hero-art-stamp">
            <img src="/brand/noland-icon.webp" alt="" width="74" height="74" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}
