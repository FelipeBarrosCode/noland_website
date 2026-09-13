import { useEffect, useMemo, useRef, useState } from "react";
import { captureAnalyticsEvent } from "../lib/analytics";
import { detectDesktopOperatingSystem } from "../lib/clientPlatform";
import { fetchLatestReleaseDownloads, type DownloadOption, type DownloadPlatform, type ReleaseDownloads } from "../lib/releaseDownloads";
import { DOWNLOADS_SECTION_ID, RELEASES_PAGE_URL, REPOSITORY_URL } from "../lib/siteLinks";
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

type PendingDownload = {
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
  macOS: "Direct DMG installers for Apple Silicon and Intel Macs.",
  Linux: "AppImage, Debian, and RPM packages for x64 and ARM64 desktops.",
  Windows: "Native NSIS installers for Windows x64 and ARM64 desktops.",
};

export function DownloadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>({ os: "Unknown", architecture: null });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shouldLoadDownloads, setShouldLoadDownloads] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<PendingDownload | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

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

  const requestDownload = (download: PendingDownload, source: "recommended" | "option" = "option") => {
    capture(source === "recommended" ? "download_recommended_clicked" : "download_option_clicked", {
      platform: download.platform,
      download_id: download.downloadId,
      asset_name: download.assetName ?? null,
    });
    setShareMessage(null);
    setPendingDownload(download);
  };

  return (
    <section ref={sectionRef} className="section downloads-section" id={DOWNLOADS_SECTION_ID} aria-labelledby="downloads-title">
      <div className="shell">
        <SectionHeading
          eyebrow="DOWNLOAD"
          title={<span id="downloads-title">Download Noland. <em>Matched to your device.</em></span>}
          description="Noland detects your operating system and architecture when the browser makes that information available. Every alternative remains available below if the detected choice is not correct."
        />

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

        <div className="download-scroll-cue" aria-hidden="true">
          <div className="download-recommendation__pointer">
            <span>DOWNLOAD BELOW</span>
            <strong>↓</strong>
          </div>
        </div>

        <article className="download-recommendation" aria-labelledby="recommended-download-title">
          <div className="download-recommendation__copy">
            <p className="download-recommendation__eyebrow">RECOMMENDED FOR THIS DEVICE</p>
            <h3 id="recommended-download-title">{formatDetectedPlatform(clientPlatform)}</h3>
            <p>{getRecommendationDescription(clientPlatform, recommendedDownload)}</p>
            {recommendedDownload ? (
              <span className="download-recommendation__asset">{recommendedDownload.assetName}</span>
            ) : null}
          </div>

          <div className="download-recommendation__action">
            {recommendedDownload ? (
              <button className="button button--primary button--large" type="button" onClick={() => requestDownload({ url: recommendedDownload.url, label: recommendedDownload.label, platform: clientPlatform.os, downloadId: recommendedDownload.id, assetName: recommendedDownload.assetName }, "recommended")}>
                <span>{recommendedDownload.label}</span>
                <span aria-hidden="true">↓</span>
              </button>
            ) : directDownloadPending ? (
              <button className="button button--primary button--large" type="button" disabled>
                Resolving compatible build…
              </button>
            ) : (
              <button className="button button--primary button--large" type="button" onClick={() => openDownloadOptions("download_recommendation")}>
                Choose an installer <span aria-hidden="true">↓</span>
              </button>
            )}
            <button className="download-recommendation__other" type="button" onClick={() => openDownloadOptions("download_other_platforms")}>
              Other platforms and architectures
            </button>
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
                onDownload={requestDownload}
              />

              <PlatformCard
                title="macOS"
                description={platformDescriptions.macOS}
                buttons={macOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
                onDownload={requestDownload}
              />

              <PlatformCard
                title="Linux"
                description={platformDescriptions.Linux}
                buttons={linuxOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
                onDownload={requestDownload}
              />
            </div>
          </div>
        </details>
      </div>
      {pendingDownload ? (
        <DownloadSupportModal
          download={pendingDownload}
          shareMessage={shareMessage}
          onShare={async () => {
            const browserNavigator = navigator as NavigatorWithUserAgentData;
            try {
              if (browserNavigator.share) {
                await browserNavigator.share({ title: "No Land", text: "Check out No Land, an open cloud gaming client.", url: window.location.href });
                setShareMessage("Thanks for sharing No Land.");
              } else {
                await navigator.clipboard.writeText(window.location.href);
                setShareMessage("Link copied. Share No Land with your friends.");
              }
            } catch {
              setShareMessage("Sharing was cancelled. You can still support the project by starring the repo.");
            }
          }}
          onClose={() => setPendingDownload(null)}
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
  onDownload: (download: PendingDownload) => void;
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
           <button key={button.id} className="button button--ghost" type="button" onClick={() => onDownload({ url: button.url, label: button.label, platform: title, downloadId: button.id, assetName: button.assetName })}>
             <span>{button.label}</span>
             <span aria-hidden="true">↓</span>
           </button>
          )) : (
           <button className="button button--ghost" type="button" onClick={() => onDownload({ url: fallbackUrl, label: fallbackLabel, platform: title, downloadId: "release_fallback" })}>
             <span>{fallbackLabel}</span>
             <span aria-hidden="true">↗</span>
           </button>
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

type DownloadSupportModalProps = {
  download: PendingDownload;
  shareMessage: string | null;
  onShare: () => Promise<void>;
  onClose: () => void;
};

function DownloadSupportModal({ download, shareMessage, onShare, onClose }: DownloadSupportModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const recordAndContinue = () => {
    capture("download_support_completed", { platform: download.platform, download_id: download.downloadId, asset_name: download.assetName ?? null });
  };

  return (
    <div className="download-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="download-modal__panel" role="dialog" aria-modal="true" aria-labelledby="download-modal-title" aria-describedby="download-modal-copy">
        <button className="download-modal__close" type="button" aria-label="Close download support dialog" onClick={onClose}>×</button>
        <p className="download-modal__eyebrow">ONE LAST THING</p>
        <h2 id="download-modal-title">Help No Land grow.</h2>
        <p id="download-modal-copy">No Land is free and independent. Before you download, share the project with someone who would love it and star the repository to support its future.</p>
        <div className="download-modal__actions">
          <button className="button button--ghost" type="button" onClick={onShare}>Share No Land <span aria-hidden="true">↗</span></button>
          <a className="button button--ghost" href={REPOSITORY_URL} target="_blank" rel="noreferrer" onClick={() => capture("github_star_clicked", { platform: download.platform, download_id: download.downloadId })}>Star the GitHub repo <span aria-hidden="true">↗</span></a>
        </div>
        {shareMessage ? <p className="download-modal__message" role="status">{shareMessage}</p> : null}
        <a className="button button--primary button--large download-modal__continue" href={download.url} target="_blank" rel="noreferrer" onClick={recordAndContinue}>
          Continue to download <span aria-hidden="true">↓</span>
        </a>
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
