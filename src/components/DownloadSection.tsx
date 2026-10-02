import { useEffect, useMemo, useRef, useState } from "react";
import { captureAnalyticsEvent } from "../lib/analytics";
import { detectDesktopOperatingSystem } from "../lib/clientPlatform";
import { fetchLatestReleaseDownloads, type DownloadOption, type DownloadPlatform, type ReleaseDownloads } from "../lib/releaseDownloads";
import { DOWNLOADS_SECTION_ID, RELEASES_PAGE_URL } from "../lib/siteLinks";
import { SectionHeading } from "./SectionHeading";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: ReleaseDownloads }
  | { status: "error"; message: string };

type ClientOS = DownloadPlatform | "Unknown";
type ClientArchitecture = DownloadOption["architecture"] | null;
type ClientPlatform = {
  os: ClientOS;
  architecture: ClientArchitecture;
};

type PlatformButton = {
  id: string;
  label: string;
  url: string;
  assetName: string;
  description?: string;
  architecture?: "arm64" | "x64";
  format?: string;
};

type UserAgentDataDetails = {
  architecture?: string;
  bitness?: string;
  platform?: string;
};

type UserAgentData = {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<UserAgentDataDetails>;
};

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: UserAgentData;
  share?: (data: ShareData) => Promise<void>;
};

type DownloadTarget = {
  url: string;
  label: string;
  platform: string;
  downloadId: string;
  assetName?: string;
};

function capture(event: string, properties: Record<string, string | number | null>) {
  captureAnalyticsEvent(event, properties);
}

const platformDescriptions: Record<DownloadPlatform, string> = {
  macOS: "DMG installers for Apple Silicon and Intel Macs.",
  Linux: "AppImage, Debian, and RPM packages.",
  Windows: "Installers for Windows x64 and ARM64."
};

export function DownloadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>({ os: "Unknown", architecture: null });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shouldLoadDownloads, setShouldLoadDownloads] = useState(false);
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [savedLinkMessage, setSavedLinkMessage] = useState<string | null>(null);
  const [platformChooserOpen, setPlatformChooserOpen] = useState(false);
  const downloadSectionViewedRef = useRef(false);
  const downloadIntentRef = useRef(false);
  const frictionSurveyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMobileClient(isMobileBrowser());
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) {
      setShouldLoadDownloads(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadDownloads(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoadDownloads) return;

    let active = true;

    fetchLatestReleaseDownloads()
      .then((payload) => {
        if (active) {
          setState({ status: "ready", payload });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const message = error instanceof Error ? error.message : "Unable to resolve the latest release right now.";
          capture("download_lookup_failed", { error: message });
          setState({
            status: "error",
            message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [shouldLoadDownloads]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const recordSectionView = () => {
      if (downloadSectionViewedRef.current) return;
      downloadSectionViewedRef.current = true;

      const detectedPlatform = detectClientPlatform();
      const isMobile = isMobileBrowser();
      capture("download_section_viewed", {
        detected_platform: detectedPlatform.os,
        architecture: detectedPlatform.architecture,
        is_mobile: isMobile ? 1 : 0,
      });

      if (isMobile) {
        frictionSurveyTimerRef.current = window.setTimeout(() => {
          if (!downloadIntentRef.current) {
            capture("mobile_download_friction_survey_eligible", {
              detected_platform: detectedPlatform.os,
              architecture: detectedPlatform.architecture,
              wait_seconds: 20,
            });
          }
        }, 20_000);
      }
    };

    if (!("IntersectionObserver" in window)) {
      recordSectionView();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          recordSectionView();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      if (frictionSurveyTimerRef.current !== null) {
        window.clearTimeout(frictionSurveyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    refineClientPlatform().then((platform) => {
      if (active) {
        setClientPlatform(platform);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const macOptions = useMemo(() => getOptionsForPlatform(state, "macOS"), [state]);
  const linuxOptions = useMemo(() => getOptionsForPlatform(state, "Linux"), [state]);
  const windowsOptions = useMemo(() => getOptionsForPlatform(state, "Windows"), [state]);
  const recommendedDownload = useMemo(
    () => getRecommendedDownload(clientPlatform, state),
    [clientPlatform, state],
  );
  const resolvedReleaseUrl = state.status === "ready" ? state.payload.releaseUrl : RELEASES_PAGE_URL;
  const resolvedReleaseLabel = state.status === "ready" ? state.payload.releaseLabel : "latest GitHub release";
  const releaseFlavor = state.status === "ready" ? (state.payload.isPrerelease ? "rolling prerelease" : "stable release") : null;
  const directDownloadPending = state.status === "loading" && clientPlatform.os !== "Unknown";
  const openDownloadOptions = (source: "download_recommendation" | "download_other_platforms") => {
    if (!optionsOpen) {
      capture("download_options_opened", { source });
    }
    setOptionsOpen(true);
  };

  const recordDownloadIntent = () => {
    downloadIntentRef.current = true;
    if (frictionSurveyTimerRef.current !== null) {
      window.clearTimeout(frictionSurveyTimerRef.current);
      frictionSurveyTimerRef.current = null;
    }
  };

  const saveDesktopDownloadLink = async (download: DownloadOption) => {
    recordDownloadIntent();
    setPlatformChooserOpen(false);
    setSavedLinkMessage(null);

    const properties = {
      intended_platform: download.platform,
      architecture: download.architecture,
      download_id: download.id,
      asset_name: download.assetName,
      source: "mobile_download_section",
    };
    const browserNavigator = navigator as NavigatorWithUserAgentData;

    if (browserNavigator.share) {
      try {
        await browserNavigator.share({
          title: "Download Noland",
          text: `Open this link on your ${download.platform} computer to download ${download.label}.`,
          url: download.url,
        });
        capture("desktop_download_link_shared", properties);
        setSavedLinkMessage(`${download.label} shared. Opening the link on your computer starts the download.`);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(download.url);
      capture("desktop_download_link_copied", properties);
      setSavedLinkMessage(`${download.label} link copied. Opening it on your computer starts the download.`);
    } catch {
      setSavedLinkMessage("Unable to share or copy the installer link on this device.");
    }
  };

  const recordDownload = (download: DownloadTarget, source: "recommended" | "option" = "option") => {
    recordDownloadIntent();

    const properties = {
      platform: download.platform,
      download_id: download.downloadId,
      asset_name: download.assetName ?? null,
      source,
    };
    capture(source === "recommended" ? "download_recommended_clicked" : "download_option_clicked", properties);
    capture("download_support_completed", properties);
    capture("app_download_clicked", properties);
  };

  return (
    <section ref={sectionRef} className="section downloads-section" id={DOWNLOADS_SECTION_ID} aria-labelledby="downloads-title">
      <div className="shell">
        <SectionHeading
          eyebrow="DOWNLOAD"
          title={
            <span id="downloads-title">
              Download Noland. <em>{isMobileClient ? "Continue on your computer." : "Matched to your device."}</em>
            </span>
          }
          description={
            isMobileClient
              ? "Noland is a desktop app for Windows, macOS, and Linux. Choose your computer type and share its direct installer link."
              : "Noland detects your device and suggests the right download. You can choose another option below anytime."
          }
        />

        <div className="download-scroll-cue" aria-hidden="true">
          <div className="download-recommendation__pointer">
            <span>SCROLL DOWN TO DOWNLOAD</span>
            <strong>↓</strong>
          </div>
        </div>

        <div className="downloads-status" role="status" aria-live="polite">
          {state.status === "loading" ? (
            <span>Resolving the latest published release assets…</span>
          ) : state.status === "error" ? (
            <span>Direct download lookup is temporarily unavailable. You can still open the latest GitHub release manually.</span>
          ) : (
            <span>
              Showing installers from <strong>{resolvedReleaseLabel}</strong>
              {releaseFlavor ? <em>{releaseFlavor}</em> : null}
            </span>
          )}
          <a className="text-link" href={resolvedReleaseUrl} target="_blank" rel="noreferrer" onClick={() => capture("download_release_notes_clicked", { release_label: resolvedReleaseLabel })}>Open release notes <span aria-hidden="true">↗</span></a>
        </div>

        <article className="download-recommendation" aria-labelledby="recommended-download-title">
          <div className="download-recommendation__copy">
            <p className="download-recommendation__eyebrow">
              {isMobileClient ? "SAVE FOR LATER" : "RECOMMENDED FOR THIS DEVICE"}
            </p>
            <h3 id="recommended-download-title">
              {isMobileClient ? "Send it to your computer" : `Download Noland for ${formatDetectedPlatform(clientPlatform)}`}
            </h3>
            <p>
              {isMobileClient
                ? "Choose your computer, then send its direct installer link through Messages, email, Notes, or another synced app."
                : getRecommendationDescription(clientPlatform, recommendedDownload)}
            </p>
            <ul className="download-recommendation__trust" aria-label="Noland download benefits">
              <li>Free and open source</li>
              <li>No Noland subscription</li>
              <li>Windows, macOS, and Linux</li>
            </ul>
            {!isMobileClient && recommendedDownload ? (
              <span className="download-recommendation__asset">Installer: {recommendedDownload.assetName}</span>
            ) : null}
          </div>

          <div className="download-recommendation__action">
            {isMobileClient ? (
              <>
                <button className="button button--primary button--large" type="button" disabled={state.status !== "ready" || state.payload.options.length === 0} onClick={() => setPlatformChooserOpen(true)}>
                  <span>{state.status === "loading" ? "Resolving desktop installers…" : "Send download link to my computer"}</span>
                  <span aria-hidden="true">↗</span>
                </button>
                <button className="download-recommendation__other" type="button" onClick={() => openDownloadOptions("download_recommendation")}>
                  View all desktop installers
                </button>
                {savedLinkMessage ? <p className="download-recommendation__message" role="status">{savedLinkMessage}</p> : null}
              </>
            ) : recommendedDownload ? (
              <a className="button button--primary button--large" href={recommendedDownload.url} target="_blank" rel="noreferrer" onClick={() => recordDownload({ url: recommendedDownload.url, label: recommendedDownload.label, platform: clientPlatform.os, downloadId: recommendedDownload.id, assetName: recommendedDownload.assetName }, "recommended")}>
                <span>Download for {clientPlatform.os}</span>
                <span aria-hidden="true">↓</span>
              </a>
            ) : directDownloadPending ? (
              <button className="button button--primary button--large" type="button" disabled>
                Resolving compatible build…
              </button>
            ) : (
              <button className="button button--primary button--large" type="button" onClick={() => openDownloadOptions("download_recommendation")}>
                Choose an installer <span aria-hidden="true">↓</span>
              </button>
            )}
            {!isMobileClient ? (
              <button className="download-recommendation__other" type="button" onClick={() => openDownloadOptions("download_other_platforms")}>
                Other platforms and architectures
              </button>
            ) : null}
          </div>
        </article>

        <details
          className="download-options"
          open={optionsOpen}
          onToggle={(event) => {
            const isOpen = event.currentTarget.open;
            if (isOpen && !optionsOpen) {
              capture("download_options_opened", { source: "download_options_summary" });
            }
            setOptionsOpen(isOpen);
          }}
        >
          <summary>
            <span>
              <strong>All download options</strong>
              <small>Choose a different operating system, CPU architecture, or package format.</small>
            </span>
            <i aria-hidden="true" />
          </summary>

          <div className="download-options__body">
            <div className="download-grid">
              <PlatformCard
                title="Windows"
                description={platformDescriptions.Windows}
                buttons={windowsOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
                onDownload={recordDownload}
              />

              <PlatformCard
                title="macOS"
                description={platformDescriptions.macOS}
                buttons={macOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
                onDownload={recordDownload}
              />

              <PlatformCard
                title="Linux"
                description={platformDescriptions.Linux}
                buttons={linuxOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
                onDownload={recordDownload}
              />
            </div>
          </div>
        </details>
      </div>
      {platformChooserOpen ? (
        <PlatformShareModal
          options={getShareableDownloadOptions(state)}
          onSelect={saveDesktopDownloadLink}
          onClose={() => setPlatformChooserOpen(false)}
        />
      ) : null}

    </section>
  );
}

type PlatformCardProps = {
  title: string;
  description: string;
  buttons: PlatformButton[];
  fallbackUrl: string;
  fallbackLabel: string;
  onDownload: (download: DownloadTarget) => void;
};

function PlatformCard({ title, description, buttons, fallbackUrl, fallbackLabel, onDownload }: PlatformCardProps) {
  return (
    <article className="download-card">
      <div className="download-card__header">
        <p className="download-card__eyebrow">{title.toUpperCase()}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="download-card__buttons">
        {buttons.length > 0 ? buttons.map((button) => (
          <a key={button.id} className="button button--ghost" href={button.url} target="_blank" rel="noreferrer" onClick={() => onDownload({ url: button.url, label: button.label, platform: title, downloadId: button.id, assetName: button.assetName })}>
            <span>Download {button.label}</span>
            <span aria-hidden="true">↓</span>
          </a>
        )) : (
          <a className="button button--ghost" href={fallbackUrl} target="_blank" rel="noreferrer" onClick={() => onDownload({ url: fallbackUrl, label: fallbackLabel, platform: title, downloadId: "release_fallback" })}>
            <span>{fallbackLabel}</span>
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {buttons.length > 0 ? (
        <ul className="download-card__meta" aria-label={`${title} download details`}>
          {buttons.map((button) => (
            <li key={`${button.id}-meta`}>
              <strong>{button.label}</strong>
              <span>{button.description ?? button.assetName}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function PlatformShareModal({ options, onSelect, onClose }: { options: DownloadOption[]; onSelect: (download: DownloadOption) => Promise<void>; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="download-modal platform-share-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="download-modal__panel platform-share-modal__panel" role="dialog" aria-modal="true" aria-labelledby="platform-share-title" aria-describedby="platform-share-copy">
        <button className="download-modal__close" type="button" aria-label="Close platform selection" onClick={onClose}>×</button>
        <p className="download-modal__eyebrow">SAVE FOR YOUR COMPUTER</p>
        <h2 id="platform-share-title">Which computer will you use?</h2>
        <p id="platform-share-copy">Choose the operating system and processor type used by your computer. The shared link points directly to that installer and starts downloading when opened.</p>
        <div className="platform-share-modal__options">
          {options.map((option) => (
            <button className="button button--ghost" type="button" key={option.id} onClick={() => void onSelect(option)}>
              <span>{option.label}</span><span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function getOptionsForPlatform(state: LoadState, platform: DownloadPlatform): DownloadOption[] {
  if (state.status !== "ready") {
    return [];
  }

  return state.payload.options.filter((option) => option.platform === platform);
}

function getShareableDownloadOptions(state: LoadState): DownloadOption[] {
  if (state.status !== "ready") {
    return [];
  }

  return state.payload.options.filter((option) => {
    if (option.platform === "Linux") {
      return option.format.toLowerCase() === "appimage";
    }

    return true;
  });
}

function getRecommendedDownload(client: ClientPlatform, state: LoadState): PlatformButton | null {
  if (state.status !== "ready" || client.architecture === null || client.os === "Unknown") {
    return null;
  }

  const candidates = state.payload.options.filter(
    (option) => option.platform === client.os && option.architecture === client.architecture,
  );

  if (client.os === "Linux") {
    return candidates.find((option) => option.format.toLowerCase() === "appimage") ?? candidates[0] ?? null;
  }

  return candidates[0] ?? null;
}

function getRecommendationDescription(client: ClientPlatform, recommended: PlatformButton | null): string {
  if (recommended?.description) {
    return recommended.description;
  }

  if (recommended) {
    return "This build best matches the operating system and CPU architecture reported by your browser.";
  }

  if (client.os === "Unknown") {
    return "Your browser did not expose a supported desktop platform. Open the installer list to choose manually.";
  }

  if (client.architecture === null) {
    return `We detected ${client.os}, but your browser did not expose the CPU architecture. Choose the correct build below.`;
  }

  return `No matching ${client.os} ${formatArchitecture(client.os, client.architecture)} asset was found in the current release. Choose another installer below.`;
}

function formatDetectedPlatform(client: ClientPlatform): string {
  if (client.os === "Unknown") {
    return "Choose your platform";
  }

  if (client.architecture === null) {
    return client.os;
  }

  return `${client.os} · ${formatArchitecture(client.os, client.architecture)}`;
}

function formatArchitecture(os: ClientOS, architecture: Exclude<ClientArchitecture, null>): string {
  if (os === "macOS" && architecture === "arm64") {
    return "Apple Silicon";
  }

  if (os === "macOS") {
    return "Intel";
  }

  return architecture === "arm64" ? "ARM64" : "x64";
}


function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/iu.test(navigator.userAgent);
  const touchViewport = navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches;
  return mobileUserAgent || touchViewport;
}

function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") {
    return { os: "Unknown", architecture: null };
  }

  const browserNavigator = navigator as NavigatorWithUserAgentData;
  const platform = browserNavigator.userAgentData?.platform ?? browserNavigator.platform ?? "";
  const userAgent = browserNavigator.userAgent ?? "";

  return {
    os: detectDesktopOperatingSystem(platform, userAgent),
    architecture: normalizeArchitecture("", "", `${platform} ${userAgent}`),
  };
}

async function refineClientPlatform(): Promise<ClientPlatform> {
  const fallback = detectClientPlatform();
  if (typeof navigator === "undefined") {
    return fallback;
  }

  const browserNavigator = navigator as NavigatorWithUserAgentData;
  const userAgentData = browserNavigator.userAgentData;
  if (!userAgentData?.getHighEntropyValues) {
    return fallback;
  }

  try {
    const details = await userAgentData.getHighEntropyValues(["architecture", "bitness", "platform"]);
    return {
      os: detectDesktopOperatingSystem(details.platform ?? userAgentData.platform ?? browserNavigator.platform ?? "", browserNavigator.userAgent ?? ""),
      architecture: normalizeArchitecture(details.architecture ?? "", details.bitness ?? "", browserNavigator.userAgent ?? "")
        ?? fallback.architecture,
    };
  } catch {
    return fallback;
  }
}


function normalizeArchitecture(architecture: string, bitness: string, fallbackFingerprint: string): ClientArchitecture {
  const normalizedArchitecture = architecture.toLowerCase();
  const normalizedBitness = bitness.toLowerCase();
  const fallback = fallbackFingerprint.toLowerCase();

  if (/arm64|aarch64/u.test(normalizedArchitecture) || (/^arm$/u.test(normalizedArchitecture) && normalizedBitness === "64")) {
    return "arm64";
  }
  if (/x86_64|x64|amd64/u.test(normalizedArchitecture) || (/^x86$/u.test(normalizedArchitecture) && normalizedBitness === "64")) {
    return "x64";
  }
  if (/arm64|aarch64/u.test(fallback)) {
    return "arm64";
  }
  if (/x86_64|x64|amd64|win64/u.test(fallback)) {
    return "x64";
  }
  return null;
}
