import { useEffect, useMemo, useState } from "react";
import { captureAnalyticsEvent } from "../lib/analytics";
import { SectionHeading } from "./SectionHeading";
import "../styles/liveMarketplace.css";

const MIN_STORAGE_GB = 30;
const DEFAULT_STORAGE_GB = 100;
const MAX_VISIBLE_OFFERS = 12;

type VastPriceBreakdown = {
  gpuCostPerHour?: number;
  diskHour?: number;
  totalHour?: number;
  discountedTotalPerHour?: number;
};

type RawVastOffer = {
  id?: number;
  machine_id?: number;
  hostname?: string | null;
  geolocation?: string;
  gpu_name?: string;
  gpu_ram?: number;
  gpu_total_ram?: number;
  num_gpus?: number;
  cpu_name?: string;
  cpu_cores?: number;
  cpu_cores_effective?: number;
  inet_down?: number;
  inet_up?: number;
  reliability?: number;
  reliability2?: number;
  verification?: string;
  datacenter?: boolean;
  static_ip?: boolean;
  has_avx?: boolean | number;
  is_bid?: boolean;
  reserved?: boolean;
  type?: string;
  instance_type?: string;
  rental_type?: string;
  offer_type?: string;
  disk_space?: number;
  storage_cost?: number;
  storage_total_cost?: number;
  dph_base?: number;
  dph_total?: number;
  discounted_dph_total?: number;
  search?: VastPriceBreakdown;
  instance?: VastPriceBreakdown;
};

type OffersResponse = {
  offers?: RawVastOffer[];
  fetchedAt?: string;
  error?: string;
};

type MarketplaceOffer = {
  id: number;
  hostLabel: string;
  location: string;
  countryCode: string;
  gpuName: string;
  gpuRamGb: number;
  gpuCount: number;
  cpuName: string;
  cpuCores: number;
  internetDownMbps: number;
  internetUpMbps: number;
  reliability: number;
  verified: boolean;
  datacenter: boolean;
  staticIp: boolean;
  hasAvx: boolean;
  offerType: string;
  availableStorageGb: number;
  computeHourlyPrice: number;
  storageMonthlyPerGb: number;
  fallbackStorageHourlyPrice: number;
};

type CountryOption = {
  code: string;
  label: string;
  offerCount: number;
};

type DistributionPoint = {
  x: number;
  y: number;
  count: number;
  minimum: number;
  maximum: number;
};

type PriceDistribution = {
  points: DistributionPoint[];
  median: number;
  minimum: number;
  maximum: number;
  offerCount: number;
};

function capture(event: string, properties: Record<string, string | number>) {
  captureAnalyticsEvent(event, properties);
}

export function LiveMarketplace() {
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [countryCode, setCountryCode] = useState("GLOBAL");
  const [storageGb, setStorageGb] = useState(DEFAULT_STORAGE_GB);
  const [selectedPriceBucket, setSelectedPriceBucket] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/vast/offers", {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as OffersResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load live Vast.ai offers.");
        }
        return payload;
      })
      .then((payload) => {
        const normalized = (payload.offers ?? [])
          .map(normalizeOffer)
          .filter((offer): offer is MarketplaceOffer => offer !== null);
        setOffers(normalized);
        setFetchedAt(payload.fetchedAt ?? null);
        setLoadState("ready");
        capture("live_marketplace_loaded", { offer_count: normalized.length });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadState("error");
        capture("live_marketplace_load_failed", {
          error: error instanceof Error ? error.message : "unknown",
        });
      });

    return () => controller.abort();
  }, []);

  const storageMaximum = useMemo(() => {
    const largestOffer = offers.reduce((maximum, offer) => Math.max(maximum, offer.availableStorageGb), 0);
    return Math.max(DEFAULT_STORAGE_GB, Math.min(10_000, Math.floor(largestOffer || 1_000)));
  }, [offers]);

  const storageCompatibleOffers = useMemo(
    () => offers.filter((offer) => offer.availableStorageGb >= storageGb),
    [offers, storageGb],
  );

  const countries = useMemo<CountryOption[]>(() => {
    const counts = new Map<string, number>();
    for (const offer of storageCompatibleOffers) {
      if (offer.countryCode.length !== 2) continue;
      counts.set(offer.countryCode, (counts.get(offer.countryCode) ?? 0) + 1);
    }

    const options = [...counts.entries()]
      .map(([code, offerCount]) => ({ code, label: countryLabel(code), offerCount }))
      .sort((left, right) => left.label.localeCompare(right.label));

    return [
      { code: "GLOBAL", label: "Global", offerCount: storageCompatibleOffers.length },
      ...options,
    ];
  }, [storageCompatibleOffers]);

  const filteredOffers = useMemo(() => {
    const matching = countryCode === "GLOBAL"
      ? storageCompatibleOffers
      : storageCompatibleOffers.filter((offer) => offer.countryCode === countryCode);

    return [...matching].sort(
      (left, right) => totalHourlyPrice(left, storageGb) - totalHourlyPrice(right, storageGb),
    );
  }, [countryCode, storageCompatibleOffers, storageGb]);

  const priceDistribution = useMemo(() => {
    const prices = filteredOffers
      .map((offer) => totalHourlyPrice(offer, storageGb))
      .filter((price) => Number.isFinite(price) && price > 0)
      .sort((left, right) => left - right);
    if (prices.length === 0) return null;

    const bucketCount = Math.min(18, Math.max(6, Math.ceil(Math.sqrt(prices.length) * 2)));
    const minimum = prices[0];
    const maximum = prices[prices.length - 1];
    const counts = Array.from({ length: bucketCount }, () => 0);
    const range = maximum - minimum;
    const bucketWidth = range === 0 ? 0 : range / bucketCount;

    for (const price of prices) {
      const bucketIndex = maximum === minimum
        ? Math.floor(bucketCount / 2)
        : Math.min(bucketCount - 1, Math.floor((price - minimum) / bucketWidth));
      counts[bucketIndex] += 1;
    }

    const kernel = [0.12, 0.32, 0.5, 0.32, 0.12];
    const density = counts.map((_, index) => kernel.reduce(
      (sum, weight, kernelIndex) => sum + (counts[index + kernelIndex - 2] ?? 0) * weight,
      0,
    ));
    const maximumDensity = Math.max(...density, 1);

    const middle = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0
      ? (prices[middle - 1] + prices[middle]) / 2
      : prices[middle];

    return {
      points: counts.map((count, index) => ({
        x: (index / (bucketCount - 1)) * 100,
        y: 82 - (density[index] / maximumDensity) * 57,
        count,
        minimum: range === 0 ? minimum : minimum + index * bucketWidth,
        maximum: range === 0 ? maximum : minimum + (index + 1) * bucketWidth,
      })),
      median,
      minimum,
      maximum,
      offerCount: prices.length,
    } satisfies PriceDistribution;
  }, [filteredOffers, storageGb]);

  const activePriceBucket = selectedPriceBucket === null
    ? null
    : priceDistribution?.points[selectedPriceBucket] ?? null;
  const priceFilteredOffers = useMemo(() => {
    if (!activePriceBucket) return filteredOffers;
    return filteredOffers.filter((offer) => {
      const price = totalHourlyPrice(offer, storageGb);
      const isLastBucket = activePriceBucket === priceDistribution?.points[priceDistribution.points.length - 1];
      return price >= activePriceBucket.minimum && (isLastBucket ? price <= activePriceBucket.maximum : price < activePriceBucket.maximum);
    });
  }, [activePriceBucket, filteredOffers, priceDistribution, storageGb]);
  const visibleOffers = showAll ? priceFilteredOffers : priceFilteredOffers.slice(0, MAX_VISIBLE_OFFERS);

  return (
    <section className="section live-marketplace-section" aria-labelledby="live-marketplace-title">
      <div className="shell">
        <SectionHeading
          eyebrow="LIVE VAST.AI INVENTORY"
          title={<span id="live-marketplace-title">See what is available. <em>Estimate the real hourly cost.</em></span>}
          description="Live rentable single-GPU VM offers from Vast.ai, combined across on-demand, interruptible, and reserved inventory. Choose a country and storage amount to update availability and estimated pricing."
        />

        <div className="live-marketplace">
          <div className="live-marketplace__toolbar">
            <div className="live-marketplace__status">
              <i aria-hidden="true" />
              <div>
                <strong>LIVE_OFFER_BROWSER</strong>
                <span>{loadState === "loading" ? "Loading current inventory…" : `${offers.length} joined offers fetched`}</span>
              </div>
            </div>
            {fetchedAt ? <time dateTime={fetchedAt}>Updated {formatUpdateTime(fetchedAt)}</time> : null}
          </div>

          <div className="live-marketplace__controls">
            <label htmlFor="live-market-country">
              <span>COUNTRY</span>
              <select
                id="live-market-country"
                value={countryCode}
                disabled={loadState !== "ready"}
                onChange={(event) => {
                  const nextCountry = event.target.value;
                  setCountryCode(nextCountry);
                  setSelectedPriceBucket(null);
                  setShowAll(false);
                  capture("live_marketplace_filter_changed", {
                    filter: "country",
                    country: nextCountry,
                    storage_gb: storageGb,
                  });
                }}
              >
                {countries.map((country) => (
                  <option value={country.code} key={country.code}>
                    {country.label} ({country.offerCount})
                  </option>
                ))}
              </select>
            </label>

            <label className="live-marketplace__storage" htmlFor="live-market-storage">
              <span>STORAGE</span>
              <output htmlFor="live-market-storage">{storageGb.toLocaleString()} GB</output>
              <input
                id="live-market-storage"
                type="range"
                min={MIN_STORAGE_GB}
                max={storageMaximum}
                step="10"
                value={Math.min(storageGb, storageMaximum)}
                disabled={loadState !== "ready"}
                onChange={(event) => {
                  setStorageGb(Number(event.target.value));
                  setSelectedPriceBucket(null);
                  setShowAll(false);
                }}
                onPointerUp={() => capture("live_marketplace_filter_changed", {
                  filter: "storage",
                  country: countryCode,
                  storage_gb: storageGb,
                })}
              />
              <small><span>{MIN_STORAGE_GB} GB</span><span>{storageMaximum.toLocaleString()} GB</span></small>
            </label>

            <div
              className="live-marketplace__average"
              aria-live="polite"
              aria-label={priceDistribution === null
                ? "No price distribution available"
                : `Price distribution across ${priceDistribution.offerCount} offers. Median ${priceDistribution.median.toFixed(3)} dollars per hour.`}
            >
              <span>LIVE PRICE DISTRIBUTION</span>
              <PriceDistributionGraph
                distribution={priceDistribution}
                selectedIndex={selectedPriceBucket}
                onSelect={(index) => {
                  const nextIndex = selectedPriceBucket === index ? null : index;
                  setSelectedPriceBucket(nextIndex);
                  setShowAll(false);
                  const bucket = index === null ? null : priceDistribution?.points[index];
                  if (bucket && nextIndex !== null) {
                    capture("live_marketplace_price_bucket_selected", {
                      minimum_price: bucket.minimum,
                      maximum_price: bucket.maximum,
                      offer_count: bucket.count,
                    });
                  }
                }}
              />
              <strong>
                {activePriceBucket
                  ? `${formatDistributionPrice(activePriceBucket.minimum)}–${formatDistributionPrice(activePriceBucket.maximum)}/hr`
                  : priceDistribution === null ? "—" : `$${priceDistribution.median.toFixed(3)}/hr`}
              </strong>
              <small>
                {activePriceBucket
                  ? `Selected range · ${priceFilteredOffers.length} offer${priceFilteredOffers.length === 1 ? "" : "s"} · click again to clear`
                  : `Median · ${priceDistribution?.offerCount ?? 0} offer${priceDistribution?.offerCount === 1 ? "" : "s"}`}
              </small>
            </div>
          </div>

          {loadState === "error" ? (
            <div className="live-marketplace__notice" role="alert">
              <strong>Live inventory is temporarily unavailable.</strong>
              <span>Vast.ai availability changes continuously. Try again shortly or open the Noland app to browse offers.</span>
            </div>
          ) : loadState === "loading" ? (
            <div className="live-marketplace__loading" role="status">
              <i aria-hidden="true" /><span>Joining Vast.ai offer categories…</span>
            </div>
          ) : priceFilteredOffers.length === 0 ? (
            <div className="live-marketplace__notice" role="status">
              <strong>No matching instances found.</strong>
              <span>Reduce the storage amount or choose Global to see more live inventory.</span>
            </div>
          ) : (
            <>
              <div className="live-offer-count" aria-live="polite">
                Showing {visibleOffers.length} of {priceFilteredOffers.length} matching instances · lowest estimated price first
              </div>
              <div className="live-offer-grid">
                {visibleOffers.map((offer) => (
                  <OfferCard offer={offer} storageGb={storageGb} key={offer.id} />
                ))}
              </div>
              {priceFilteredOffers.length > MAX_VISIBLE_OFFERS ? (
                <button
                  className="button button--ghost live-marketplace__more"
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                >
                  {showAll ? "Show fewer instances" : `Show all ${priceFilteredOffers.length} instances`}
                  <span aria-hidden="true">{showAll ? "↑" : "↓"}</span>
                </button>
              ) : null}
            </>
          )}

          <p className="live-marketplace__estimate-note">
            Estimates include compute and selected storage across the matching live {countryCode === "GLOBAL" ? "global" : countryLabel(countryCode)} inventory. The final Vast.ai price can change before rental.
          </p>
        </div>
      </div>
    </section>
  );
}

function PriceDistributionGraph({
  distribution,
  selectedIndex,
  onSelect,
}: {
  distribution: PriceDistribution | null;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const points = distribution?.points ?? [];
  const activeIndex = hoveredIndex ?? selectedIndex;
  const hoveredPoint = activeIndex === null ? null : points[activeIndex];
  const linePath = smoothWavePath(points);
  const bucketWidth = points.length > 0 ? 100 / points.length : 0;
  const areaPath = points.length > 0
    ? `${linePath} L 100 84 L 0 84 Z`
    : "";

  return (
    <div className="live-price-wave" aria-label={distribution ? "Select a segment of the price curve to filter instances by hourly price." : "No price distribution available."}>
      <svg viewBox="0 0 100 88" preserveAspectRatio="none" role="img" aria-label="Live hourly price distribution">
        <defs>
          <linearGradient id="live-price-wave-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#23e7ff" stopOpacity=".36" />
            <stop offset="1" stopColor="#b8ff3d" stopOpacity=".03" />
          </linearGradient>
        </defs>
        {points.map((point, index) => (
          <rect
            className={`live-price-wave__bucket${selectedIndex === index ? " is-selected" : ""}`}
            x={index * bucketWidth}
            y="0"
            width={bucketWidth}
            height="84"
            key={`bucket-${point.minimum}-${index}`}
            role="button"
            tabIndex={point.count > 0 ? 0 : -1}
            aria-disabled={point.count === 0}
            aria-pressed={selectedIndex === index}
            aria-label={`${point.count} instance${point.count === 1 ? "" : "s"} from ${formatDistributionPrice(point.minimum)} to ${formatDistributionPrice(point.maximum)} per hour`}
            onBlur={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => { if (point.count > 0) onSelect(index); }}
            onKeyDown={(event) => {
              if (point.count > 0 && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onSelect(index);
              }
            }}
          />
        ))}
        <path className="live-price-wave__area" d={areaPath} />
        <path className="live-price-wave__line" d={linePath} />
      </svg>
      {hoveredPoint ? (
        <div className="live-price-wave__tooltip" style={{ left: `clamp(110px, ${hoveredPoint.x}%, calc(100% - 110px))` }} role="status">
          <strong>{hoveredPoint.count} instance{hoveredPoint.count === 1 ? "" : "s"}</strong>
          <span>{formatDistributionPrice(hoveredPoint.minimum)}–{formatDistributionPrice(hoveredPoint.maximum)}/hr</span>
        </div>
      ) : null}
      <div className="live-price-wave__scale" aria-hidden="true">
        <span>{distribution ? formatDistributionPrice(distribution.minimum) : "—"}</span>
        <span>{distribution ? formatDistributionPrice(distribution.maximum) : "—"}</span>
      </div>
    </div>
  );
}

function smoothWavePath(points: DistributionPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midpoint = (previous.x + current.x) / 2;
    path += ` Q ${previous.x} ${previous.y} ${midpoint} ${(previous.y + current.y) / 2}`;
  }
  const last = points[points.length - 1];
  path += ` Q ${last.x} ${last.y} ${last.x} ${last.y}`;
  return path;
}

function OfferCard({ offer, storageGb }: { offer: MarketplaceOffer; storageGb: number }) {
  const hourlyPrice = totalHourlyPrice(offer, storageGb);

  return (
    <article className="live-offer-card">
      <div className="live-offer-card__heading">
        <div>
          <span>{offer.hostLabel}</span>
          <h3>{offer.gpuName}</h3>
        </div>
        <strong><small>TOTAL</small>{formatHourlyPrice(hourlyPrice)}</strong>
      </div>

      <div className="live-offer-card__badges">
        {offer.verified ? <span className="is-verified">✓ Verified</span> : null}
        <span>{offer.datacenter ? "Datacenter" : "Community host"}</span>
        <span className="is-type">{offer.offerType}</span>
        {offer.staticIp ? <span>Static IP</span> : null}
        {offer.hasAvx ? <span>AVX</span> : null}
      </div>

      <dl>
        <div><dt>Location</dt><dd>{offer.location || "Not listed"}</dd></div>
        <div><dt>VRAM</dt><dd>{offer.gpuRamGb.toFixed(1)} GB</dd></div>
        <div><dt>GPU count</dt><dd>{offer.gpuCount}</dd></div>
        <div><dt>Storage</dt><dd>{storageGb.toLocaleString()} GB</dd></div>
        <div><dt>CPU</dt><dd>{offer.cpuName || "Not listed"}</dd></div>
        <div><dt>Cores</dt><dd>{offer.cpuCores > 0 ? offer.cpuCores.toFixed(1) : "n/a"}</dd></div>
        <div><dt>Download</dt><dd>{formatSpeed(offer.internetDownMbps)}</dd></div>
        <div><dt>Upload</dt><dd>{formatSpeed(offer.internetUpMbps)}</dd></div>
        <div><dt>Reliability</dt><dd>{(offer.reliability * 100).toFixed(1)}%</dd></div>
        <div><dt>Max storage</dt><dd>{offer.availableStorageGb.toLocaleString()} GB</dd></div>
      </dl>
    </article>
  );
}

function normalizeOffer(raw: RawVastOffer): MarketplaceOffer | null {
  const id = positiveNumber(raw.id);
  if (id === 0) return null;

  const location = raw.geolocation?.trim() ?? "";
  const locationParts = location.split(",").map((part) => part.trim()).filter(Boolean);
  const possibleCountryCode = locationParts[locationParts.length - 1]?.toUpperCase() ?? "";
  const storageMonthlyPerGb = positiveNumber(raw.storage_cost);

  return {
    id,
    hostLabel: raw.hostname?.trim() || (raw.machine_id ? `Host-${raw.machine_id}` : "Vast host"),
    location,
    countryCode: /^[A-Z]{2}$/u.test(possibleCountryCode) ? possibleCountryCode : "",
    gpuName: raw.gpu_name?.trim() || "Unknown GPU",
    gpuRamGb: positiveNumber(raw.gpu_ram ?? raw.gpu_total_ram) / 1024,
    gpuCount: positiveNumber(raw.num_gpus) || 1,
    cpuName: raw.cpu_name?.trim() || "",
    cpuCores: positiveNumber(raw.cpu_cores_effective ?? raw.cpu_cores),
    internetDownMbps: positiveNumber(raw.inet_down),
    internetUpMbps: positiveNumber(raw.inet_up),
    reliability: positiveNumber(raw.reliability ?? raw.reliability2),
    verified: raw.verification?.toLowerCase() === "verified",
    datacenter: raw.datacenter === true,
    staticIp: raw.static_ip === true,
    hasAvx: raw.has_avx === true || positiveNumber(raw.has_avx) > 0,
    offerType: normalizeOfferType(raw),
    availableStorageGb: Math.round(positiveNumber(raw.disk_space) || 50),
    computeHourlyPrice: firstPositive(raw.search?.gpuCostPerHour, raw.dph_base, raw.instance?.gpuCostPerHour),
    storageMonthlyPerGb,
    fallbackStorageHourlyPrice: firstPositive(raw.search?.diskHour, raw.storage_total_cost, raw.instance?.diskHour),
  };
}

function totalHourlyPrice(offer: MarketplaceOffer, storageGb: number): number {
  const storageHourlyPrice = offer.storageMonthlyPerGb > 0
    ? (offer.storageMonthlyPerGb * storageGb) / (30 * 24)
    : offer.fallbackStorageHourlyPrice;
  return offer.computeHourlyPrice + storageHourlyPrice;
}

function normalizeOfferType(raw: RawVastOffer): string {
  const value = [raw.type, raw.instance_type, raw.rental_type, raw.offer_type]
    .find((candidate) => typeof candidate === "string" && candidate.trim().length > 0)
    ?.toLowerCase() ?? "";
  if (value.includes("bid") || value.includes("interrupt") || raw.is_bid) return "interruptible";
  if (value.includes("reserve") || raw.reserved) return "reserved";
  return "on-demand";
}

function firstPositive(...values: Array<number | undefined>): number {
  return values.map(positiveNumber).find((value) => value > 0) ?? 0;
}

function positiveNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function countryLabel(code: string): string {
  if (code === "GLOBAL") return "Global";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function formatHourlyPrice(price: number): string {
  return price > 0 && Number.isFinite(price) ? `$${price.toFixed(4)}/hr` : "n/a";
}

function formatDistributionPrice(price: number): string {
  return `$${price.toFixed(3)}`;
}

function formatSpeed(speed: number): string {
  return speed > 0 ? `${Math.round(speed)} Mbps` : "n/a";
}

function formatUpdateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
