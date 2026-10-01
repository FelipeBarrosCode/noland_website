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

function capture(event: string, properties: Record<string, string | number>) {
  captureAnalyticsEvent(event, properties);
}

export function LiveMarketplace() {
  const [offers, setOffers] = useState<MarketplaceOffer[]>([]);
  const [countryCode, setCountryCode] = useState("GLOBAL");
  const [storageGb, setStorageGb] = useState(DEFAULT_STORAGE_GB);
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

  const hourlyPriceRange = useMemo(() => {
    const pricedOffers = filteredOffers
      .map((offer) => totalHourlyPrice(offer, storageGb))
      .filter((price) => Number.isFinite(price) && price > 0);
    if (pricedOffers.length === 0) return null;
    return {
      minimum: Math.min(...pricedOffers),
      maximum: Math.max(...pricedOffers),
    };
  }, [filteredOffers, storageGb]);

  const visibleOffers = showAll ? filteredOffers : filteredOffers.slice(0, MAX_VISIBLE_OFFERS);

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

            <div className="live-marketplace__average" aria-live="polite">
              <span>LIVE COST RANGE / HOUR</span>
              <strong>
                {hourlyPriceRange === null
                  ? "—"
                  : `$${hourlyPriceRange.minimum.toFixed(3)}–$${hourlyPriceRange.maximum.toFixed(3)}`}
              </strong>
              <small>Cheapest to most expensive · {filteredOffers.length} offer{filteredOffers.length === 1 ? "" : "s"}</small>
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
          ) : filteredOffers.length === 0 ? (
            <div className="live-marketplace__notice" role="status">
              <strong>No matching instances found.</strong>
              <span>Reduce the storage amount or choose Global to see more live inventory.</span>
            </div>
          ) : (
            <>
              <div className="live-offer-count" aria-live="polite">
                Showing {visibleOffers.length} of {filteredOffers.length} matching instances · lowest estimated price first
              </div>
              <div className="live-offer-grid">
                {visibleOffers.map((offer) => (
                  <OfferCard offer={offer} storageGb={storageGb} key={offer.id} />
                ))}
              </div>
              {filteredOffers.length > MAX_VISIBLE_OFFERS ? (
                <button
                  className="button button--ghost live-marketplace__more"
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                >
                  {showAll ? "Show fewer instances" : `Show all ${filteredOffers.length} instances`}
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

function formatSpeed(speed: number): string {
  return speed > 0 ? `${Math.round(speed)} Mbps` : "n/a";
}

function formatUpdateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
