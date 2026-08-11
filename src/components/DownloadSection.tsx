import { useEffect, useMemo, useState } from "react";
import { fetchLatestReleaseDownloads, type DownloadOption, type DownloadPlatform, type ReleaseDownloads } from "../lib/releaseDownloads";
import { DOWNLOADS_SECTION_ID, RELEASES_PAGE_URL, WINDOWS_STORE_URL } from "../lib/siteLinks";
import { SectionHeading } from "./SectionHeading";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: ReleaseDownloads }
  | { status: "error"; message: string };

type ClientOS = DownloadPlatform | "Windows" | "Unknown";
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
};

const platformDescriptions: Record<DownloadPlatform, string> = {
  macOS: "Direct DMG installers for Apple Silicon and Intel Macs.",
  Linux: "AppImage, Debian, and RPM packages for x64 and ARM64 desktops.",
};

const windowsStoreOption: PlatformButton = {
  id: "windows-store",
  label: "Windows — Microsoft Store",
  url: WINDOWS_STORE_URL,
  assetName: "Microsoft Store listing",
  description: "The Microsoft Store selects the compatible Windows package for your device.",
};

export function DownloadSection() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>(() => detectClientPlatform());
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    fetchLatestReleaseDownloads()
      .then((payload) => {
        if (active) {
          setState({ status: "ready", payload });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to resolve the latest release right now.",
          });
        }
      });

    return () => {
      active = false;
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
  const recommendedDownload = useMemo(
    () => getRecommendedDownload(clientPlatform, state),
    [clientPlatform, state],
  );
  const resolvedReleaseUrl = state.status === "ready" ? state.payload.releaseUrl : RELEASES_PAGE_URL;
  const resolvedReleaseLabel = state.status === "ready" ? state.payload.releaseLabel : "latest GitHub release";
  const releaseFlavor = state.status === "ready" ? (state.payload.isPrerelease ? "rolling prerelease" : "stable release") : null;
  const directDownloadPending = state.status === "loading" && (clientPlatform.os === "macOS" || clientPlatform.os === "Linux");

  return (
    <section className="section downloads-section" id={DOWNLOADS_SECTION_ID} aria-labelledby="downloads-title">
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
          <a className="text-link" href={resolvedReleaseUrl} target="_blank" rel="noreferrer">Open release notes <span aria-hidden="true">↗</span></a>
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
              <a className="button button--primary button--large" href={recommendedDownload.url} target="_blank" rel="noreferrer">
                <span>{recommendedDownload.label}</span>
                <span aria-hidden="true">{clientPlatform.os === "Windows" ? "↗" : "↓"}</span>
              </a>
            ) : directDownloadPending ? (
              <button className="button button--primary button--large" type="button" disabled>
                Resolving compatible build…
              </button>
            ) : (
              <button className="button button--primary button--large" type="button" onClick={() => setOptionsOpen(true)}>
                Choose an installer <span aria-hidden="true">↓</span>
              </button>
            )}
            <button className="download-recommendation__other" type="button" onClick={() => setOptionsOpen(true)}>
              Other platforms and architectures
            </button>
          </div>
        </article>

        <details
          className="download-options"
          open={optionsOpen}
          onToggle={(event) => setOptionsOpen(event.currentTarget.open)}
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
                description="Windows installation is available only through the Microsoft Store."
                buttons={[windowsStoreOption]}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
              />

              <PlatformCard
                title="macOS"
                description={platformDescriptions.macOS}
                buttons={macOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
              />

              <PlatformCard
                title="Linux"
                description={platformDescriptions.Linux}
                buttons={linuxOptions}
                fallbackUrl={resolvedReleaseUrl}
                fallbackLabel="Open latest GitHub release"
              />
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

type PlatformCardProps = {
  title: string;
  description: string;
  buttons: PlatformButton[];
  fallbackUrl: string;
  fallbackLabel: string;
};

function PlatformCard({ title, description, buttons, fallbackUrl, fallbackLabel }: PlatformCardProps) {
  return (
    <article className="download-card">
      <div className="download-card__header">
        <p className="download-card__eyebrow">{title.toUpperCase()}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="download-card__buttons">
        {buttons.length > 0 ? buttons.map((button) => (
          <a key={button.id} className="button button--ghost" href={button.url} target="_blank" rel="noreferrer">
            <span>{button.label}</span>
            <span aria-hidden="true">{title === "Windows" ? "↗" : "↓"}</span>
          </a>
        )) : (
          <a className="button button--ghost" href={fallbackUrl} target="_blank" rel="noreferrer">
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

function getOptionsForPlatform(state: LoadState, platform: DownloadPlatform): DownloadOption[] {
  if (state.status !== "ready") {
    return [];
  }

  return state.payload.options.filter((option) => option.platform === platform);
}

function getRecommendedDownload(client: ClientPlatform, state: LoadState): PlatformButton | null {
  if (client.os === "Windows") {
    return windowsStoreOption;
  }

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

  if (client.architecture === null || client.os === "Windows") {
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
    os: normalizeOS(platform, userAgent),
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
      os: normalizeOS(details.platform ?? userAgentData.platform ?? browserNavigator.platform ?? "", browserNavigator.userAgent ?? ""),
      architecture: normalizeArchitecture(details.architecture ?? "", details.bitness ?? "", browserNavigator.userAgent ?? "")
        ?? fallback.architecture,
    };
  } catch {
    return fallback;
  }
}

function normalizeOS(platform: string, userAgent: string): ClientOS {
  const fingerprint = `${platform} ${userAgent}`.toLowerCase();
  if (/android|iphone|ipad|ipod/u.test(fingerprint)) {
    return "Unknown";
  }
  if (/windows|win32|win64/u.test(fingerprint)) {
    return "Windows";
  }
  if (/macintosh|mac os|macintel|macarm/u.test(fingerprint)) {
    return "macOS";
  }
  if (/linux|x11/u.test(fingerprint)) {
    return "Linux";
  }
  return "Unknown";
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
