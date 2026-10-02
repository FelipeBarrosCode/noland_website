import { useEffect, useState } from "react";
import { captureAnalyticsEvent } from "../lib/analytics";
import { DOWNLOADS_SECTION_ID } from "../lib/siteLinks";

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
              Download Noland — free <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="/#how-it-works">See how it works <span aria-hidden="true">→</span></a>
          </div>
          <ul className="hero-facts" aria-label="Product highlights">
            <li><strong>{recommendedOffer ? formatHeroPrice(recommendedOffer.price) : "LIVE"}</strong><span>{recommendedOffer ? "best nearby offer" : "checking nearby offers"}</span></li>
            <li><strong>~8 ms</strong><span>latency overhead</span></li>
            <li><strong>300K+</strong><span>games supported</span></li>
          </ul>
        </div>

        <div className="hero-deck" aria-label="Noland cloud gaming video">
          <div className="hero-video-frame">
            <iframe
              className="hero-video"
              src="https://www.youtube-nocookie.com/embed/ng3B5il2am8?autoplay=1&mute=0&loop=1&playlist=ng3B5il2am8&controls=1&vq=hd2160&rel=0&playsinline=1"
              title="Noland cloud gaming demo"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
