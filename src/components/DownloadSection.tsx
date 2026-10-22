import { useEffect, useMemo, useRef, useState } from "react";
import { captureAnalyticsEvent } from "../lib/analytics";
import { detectDesktopOperatingSystem, detectNavigatorMobileOperatingSystem, type MobileOperatingSystem } from "../lib/clientPlatform";
import { fetchLatestAndroidDownload, type AndroidDownload } from "../lib/mobileDownloads";
import { fetchLatestReleaseDownloads, type DownloadOption, type DownloadPlatform, type ReleaseDownloads } from "../lib/releaseDownloads";
import { ANDROID_RELEASES_PAGE_URL, ANDROID_REPOSITORY_URL, DOWNLOADS_SECTION_ID, IOS_RELEASES_PAGE_URL, IOS_REPOSITORY_URL, RELEASES_PAGE_URL } from "../lib/siteLinks";
import { SectionHeading } from "./SectionHeading";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: ReleaseDownloads }
  | { status: "error"; message: string };

type AndroidLoadState =
  | { status: "loading" }
  | { status: "ready"; payload: AndroidDownload }
  | { status: "error" };

type ClientOS = DownloadPlatform | "Unknown";
type ClientArchitecture = DownloadOption["architecture"] | null;
type LinuxDistribution = "Arch Linux" | "Debian/Ubuntu" | "Fedora/RHEL" | null;
type ClientPlatform = {
  os: ClientOS;
  architecture: ClientArchitecture;
  linuxDistribution: LinuxDistribution;
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
  Linux: "AppImage, Debian, RPM, and native Arch Linux packages.",
  Windows: "Installers for Windows x64 and ARM64."
};

export function DownloadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>({ os: "Unknown", architecture: null, linuxDistribution: null });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shouldLoadDownloads, setShouldLoadDownloads] = useState(false);
  const [mobilePlatform, setMobilePlatform] = useState<MobileOperatingSystem>(null);
  const [androidState, setAndroidState] = useState<AndroidLoadState>({ status: "loading" });
  const isMobileClient = mobilePlatform !== null;
  const [savedLinkMessage, setSavedLinkMessage] = useState<string | null>(null);
  const [platformChooserOpen, setPlatformChooserOpen] = useState(false);
  const downloadSectionViewedRef = useRef(false);
  const downloadIntentRef = useRef(false);
  const frictionSurveyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMobilePlatform(detectNavigatorMobileOperatingSystem());
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
    if (!shouldLoadDownloads) return;

    let active = true;
    fetchLatestAndroidDownload()
      .then((payload) => {
        if (active) setAndroidState({ status: "ready", payload });
      })
      .catch((error: unknown) => {
        if (!active) return;
        capture("download_lookup_failed", {
          platform: "Android",
          error: error instanceof Error ? error.message : "Unable to resolve the Android APK.",
        });
        setAndroidState({ status: "error" });
      });

    return () => { active = false; };
  }, [shouldLoadDownloads]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const recordSectionView = () => {
      if (downloadSectionViewedRef.current) return;
      downloadSectionViewedRef.current = true;

      const detectedPlatform = detectClientPlatform();
      const detectedMobilePlatform = detectNavigatorMobileOperatingSystem();
      const isMobile = detectedMobilePlatform !== null;
      capture("download_section_viewed", {
        detected_platform: detectedMobilePlatform ?? detectedPlatform.os,
        architecture: detectedPlatform.architecture,
        linux_distribution: detectedPlatform.linuxDistribution,
        is_mobile: isMobile ? 1 : 0,
      });

      if (isMobile) {
        frictionSurveyTimerRef.current = window.setTimeout(() => {
          if (!downloadIntentRef.current) {
            capture("mobile_download_friction_survey_eligible", {
              detected_platform: detectedMobilePlatform ?? detectedPlatform.os,
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

  const recordMobileReleaseVisit = (platform: "iOS" | "Android", source = "recommended") => {
    recordDownloadIntent();
    capture("download_release_page_clicked", { platform, source });
  };
  const androidDownload = androidState.status === "ready" ? androidState.payload : null;
  const activeReleaseUrl = mobilePlatform === "iOS"
    ? IOS_RELEASES_PAGE_URL
    : mobilePlatform === "Android"
      ? androidDownload?.releaseUrl ?? ANDROID_RELEASES_PAGE_URL
      : resolvedReleaseUrl;

  return (
    <section ref={sectionRef} className="section downloads-section" id={DOWNLOADS_SECTION_ID} aria-labelledby="downloads-title">
      <div className="shell">
        <SectionHeading
          eyebrow="DOWNLOAD"
          title={
            <span id="downloads-title">
              Download Noland. <em>Matched to your device.</em>
            </span>
          }
          description={
            isMobileClient
              ? "Get the Android APK directly, or open the iOS port’s GitHub releases. Mobile ports are preview builds."
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
          {mobilePlatform === "iOS" ? (
            <span>iOS preview builds are available on GitHub. Check each release for installation requirements.</span>
          ) : mobilePlatform === "Android" ? (
            <span>
              {androidDownload
                ? <>Showing <strong>{androidDownload.releaseLabel}</strong>{androidDownload.isPrerelease ? <em>preview release</em> : null}</>
                : androidState.status === "loading"
                  ? "Resolving the latest published Android APK…"
                  : "APK lookup is temporarily unavailable. Open Android releases to download manually."}
            </span>
          ) : state.status === "loading" ? (
            <span>Resolving the latest published release assets…</span>
          ) : state.status === "error" ? (
            <span>Direct download lookup is temporarily unavailable. You can still open the latest GitHub release manually.</span>
          ) : (
            <span>
              Showing installers from <strong>{resolvedReleaseLabel}</strong>
              {releaseFlavor ? <em>{releaseFlavor}</em> : null}
            </span>
          )}
          <a className="text-link" href={activeReleaseUrl} target="_blank" rel="noreferrer" onClick={() => capture("download_release_notes_clicked", { platform: mobilePlatform ?? clientPlatform.os })}>Open release notes <span aria-hidden="true">↗</span></a>
        </div>

        <article className="download-recommendation" aria-labelledby="recommended-download-title">
          <div className="download-recommendation__copy">
            <p className="download-recommendation__eyebrow">
              RECOMMENDED FOR THIS DEVICE
            </p>
            <h3 id="recommended-download-title">
              {mobilePlatform ? `${mobilePlatform} · mobile preview` : formatDetectedPlatform(clientPlatform)}
            </h3>
            <p>
              {mobilePlatform === "iOS"
                ? "Open the iOS port’s releases to get the unsigned IPA and installation instructions. The IPA cannot be installed directly from your browser; signing or sideloading is required."
                : mobilePlatform === "Android"
                  ? "Download the phone APK, then open it on your Android device. Android may ask you to allow installs from your browser. Install only if you trust the source; these are preview builds."
                  : getRecommendationDescription(clientPlatform, recommendedDownload)}
            </p>
            {mobilePlatform === "Android" && androidDownload ? (
              <span className="download-recommendation__asset">{androidDownload.assetName}</span>
            ) : !isMobileClient && recommendedDownload ? (
              <span className="download-recommendation__asset">{recommendedDownload.assetName}</span>
            ) : null}
          </div>

          <div className="download-recommendation__action">
            {isMobileClient ? (
              <>
                {mobilePlatform === "iOS" ? (
                  <a className="button button--primary button--large" href={IOS_RELEASES_PAGE_URL} onClick={() => recordMobileReleaseVisit("iOS")}>
                    <span>Get iOS builds on GitHub</span><span aria-hidden="true">↗</span>
                  </a>
                ) : androidDownload ? (
                  <a className="button button--primary button--large" href={androidDownload.url} onClick={() => recordDownload({ url: androidDownload.url, label: "Android APK", platform: "Android", downloadId: "android-apk", assetName: androidDownload.assetName }, "recommended")}>
                    <span>Download Android APK</span><span aria-hidden="true">↓</span>
                  </a>
                ) : androidState.status === "loading" ? (
                  <button className="button button--primary button--large" type="button" disabled>Resolving Android APK…</button>
                ) : (
                  <a className="button button--primary button--large" href={ANDROID_RELEASES_PAGE_URL} onClick={() => recordMobileReleaseVisit("Android")}>
                    <span>Open Android releases</span><span aria-hidden="true">↗</span>
                  </a>
                )}
                <button className="download-recommendation__other" type="button" onClick={() => openDownloadOptions("download_recommendation")}>
                  All mobile and desktop downloads
                </button>
                <button className="download-recommendation__other" type="button" disabled={state.status !== "ready" || state.payload.options.length === 0} onClick={() => setPlatformChooserOpen(true)}>
                  Send a desktop installer to my computer
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
              <article className="download-card">
                <div className="download-card__header">
                  <p className="download-card__eyebrow">iOS PREVIEW</p>
                  <h3>iOS</h3>
                  <p>Unsigned IPA builds for iPhone and iPad. Signing or sideloading is required; see the release instructions.</p>
                </div>
                <div className="download-card__buttons">
                  <a className="button button--ghost" href={IOS_RELEASES_PAGE_URL} onClick={() => recordMobileReleaseVisit("iOS", "option")}>iOS releases ↗</a>
                  <a className="text-link" href={IOS_REPOSITORY_URL} target="_blank" rel="noreferrer">iOS repository ↗</a>
                </div>
              </article>
              <article className="download-card">
                <div className="download-card__header">
                  <p className="download-card__eyebrow">ANDROID PREVIEW</p>
                  <h3>Android</h3>
                  <p>Direct APK download for ARM64 phones, or a universal build when available. Allow installation from your browser only if you trust the source.</p>
                </div>
                <div className="download-card__buttons">
                  {androidDownload ? (
                    <a className="button button--ghost" href={androidDownload.url} onClick={() => recordDownload({ url: androidDownload.url, label: "Android APK", platform: "Android", downloadId: "android-apk", assetName: androidDownload.assetName })}>Download Android APK ↓</a>
                  ) : androidState.status === "loading" ? (
                    <button className="button button--ghost" type="button" disabled>Resolving Android APK…</button>
                  ) : null}
                  <a className="text-link" href={ANDROID_RELEASES_PAGE_URL} onClick={() => recordMobileReleaseVisit("Android", "option")}>Android releases ↗</a>
                  <a className="text-link" href={ANDROID_REPOSITORY_URL} target="_blank" rel="noreferrer">Android repository ↗</a>
                </div>
              </article>
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
      return ["appimage", "pkg.tar.zst"].includes(option.format.toLowerCase());
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
    const preferredFormat = client.linuxDistribution === "Arch Linux"
      ? "pkg.tar.zst"
      : client.linuxDistribution === "Debian/Ubuntu"
        ? "deb"
        : client.linuxDistribution === "Fedora/RHEL"
          ? "rpm"
          : "appimage";
    const nativeMatch = candidates.find((option) => option.format.toLowerCase() === preferredFormat);
    if (nativeMatch) {
      return nativeMatch;
    }
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

  const distribution = client.os === "Linux" && client.linuxDistribution
    ? ` · ${client.linuxDistribution}`
    : "";
  return `${client.os} · ${formatArchitecture(client.os, client.architecture)}${distribution}`;
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
    return { os: "Unknown", architecture: null, linuxDistribution: null };
  }

  const browserNavigator = navigator as NavigatorWithUserAgentData;
  const platform = browserNavigator.userAgentData?.platform ?? browserNavigator.platform ?? "";
  const userAgent = browserNavigator.userAgent ?? "";

  return {
    os: detectDesktopOperatingSystem(platform, userAgent),
    architecture: normalizeArchitecture("", "", `${platform} ${userAgent}`),
    linuxDistribution: detectLinuxDistribution(`${platform} ${userAgent}`),
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
      linuxDistribution: detectLinuxDistribution(`${details.platform ?? ""} ${browserNavigator.userAgent ?? ""}`)
        ?? fallback.linuxDistribution,
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

function detectLinuxDistribution(fingerprint: string): LinuxDistribution {
  const normalized = fingerprint.toLowerCase();
  if (/archlinux|arch linux|manjaro|endeavouros|garuda/u.test(normalized)) {
    return "Arch Linux";
  }
  if (/debian|ubuntu|linux mint|pop!_os|pop os/u.test(normalized)) {
    return "Debian/Ubuntu";
  }
  if (/fedora|rhel|red hat|centos|rocky linux|almalinux/u.test(normalized)) {
    return "Fedora/RHEL";
  }
  return null;
}
