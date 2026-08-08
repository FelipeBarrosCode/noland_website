import { useEffect, useMemo, useState } from "react";
import { fetchLatestReleaseDownloads, type DownloadOption, type DownloadPlatform, type ReleaseDownloads } from "../lib/releaseDownloads";
import { DOWNLOADS_SECTION_ID, RELEASES_PAGE_URL, WINDOWS_STORE_URL } from "../lib/siteLinks";
import { SectionHeading } from "./SectionHeading";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; payload: ReleaseDownloads }
  | { status: "error"; message: string };

const platformDescriptions: Record<DownloadPlatform, string> = {
  macOS: "Choose the direct DMG installer for your Mac architecture.",
  Linux: "Pick the package format that fits your Linux desktop and architecture.",
};

export function DownloadSection() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

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

  const macOptions = useMemo(() => getOptionsForPlatform(state, "macOS"), [state]);
  const linuxOptions = useMemo(() => getOptionsForPlatform(state, "Linux"), [state]);
  const resolvedReleaseUrl = state.status === "ready" ? state.payload.releaseUrl : RELEASES_PAGE_URL;
  const resolvedReleaseLabel = state.status === "ready" ? state.payload.releaseLabel : "latest GitHub release";
  const releaseFlavor = state.status === "ready" ? (state.payload.isPrerelease ? "rolling prerelease" : "stable release") : null;

  return (
    <section className="section downloads-section" id={DOWNLOADS_SECTION_ID} aria-labelledby="downloads-title">
      <div className="shell">
        <SectionHeading
          eyebrow="DIRECT DOWNLOADS"
          title={<span id="downloads-title">Get the latest build. <em>Choose your platform.</em></span>}
          description="The buttons below resolve against the most recently updated GitHub release automatically, so the site always points at the newest published desktop installers."
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

        <div className="download-grid">
          <PlatformCard
            title="Windows"
            description="Windows installs will go through the Microsoft Store. Swap the placeholder store URL in the site config once the final listing is available."
            buttons={[
              {
                id: "windows-store",
                label: "Windows — Microsoft Store",
                url: WINDOWS_STORE_URL,
                assetName: "Microsoft Store listing",
              },
            ]}
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
    </section>
  );
}

type PlatformButton = {
  id: string;
  label: string;
  url: string;
  assetName: string;
};

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
            <span aria-hidden="true">↓</span>
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
              <span>{button.assetName}</span>
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
