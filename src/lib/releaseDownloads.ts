import { RELEASES_API_URL, RELEASES_PAGE_URL } from "./siteLinks";

export type DownloadPlatform = "macOS" | "Linux";

export type DownloadOption = {
  id: string;
  platform: DownloadPlatform;
  label: string;
  description: string;
  architecture: "arm64" | "x64";
  format: string;
  url: string;
  assetName: string;
};

export type ReleaseDownloads = {
  releaseLabel: string;
  releaseUrl: string;
  isPrerelease: boolean;
  options: DownloadOption[];
};

type GithubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GithubRelease = {
  name: string | null;
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  updated_at: string;
  published_at: string | null;
  assets: GithubReleaseAsset[];
};

type DownloadDefinition = Omit<DownloadOption, "url" | "assetName"> & {
  matches: (assetName: string) => boolean;
};

const hasAnyToken = (value: string, tokens: string[]) => tokens.some((token) => value.includes(token));
const hasArch = (value: string, architecture: "arm64" | "x64") => architecture === "arm64"
  ? hasAnyToken(value, ["aarch64", "arm64"])
  : hasAnyToken(value, ["x86_64", "x64", "amd64"]);
const hasExtension = (value: string, extension: string) => value.endsWith(extension.toLowerCase());

const downloadDefinitions: DownloadDefinition[] = [
  {
    id: "macos-arm64-dmg",
    platform: "macOS",
    label: "macOS — Apple Silicon",
    description: "Direct DMG installer for M-series Macs.",
    architecture: "arm64",
    format: "dmg",
    matches: (assetName) => hasExtension(assetName, ".dmg") && hasArch(assetName, "arm64"),
  },
  {
    id: "macos-x64-dmg",
    platform: "macOS",
    label: "macOS — Intel",
    description: "Direct DMG installer for Intel Macs.",
    architecture: "x64",
    format: "dmg",
    matches: (assetName) => hasExtension(assetName, ".dmg") && hasArch(assetName, "x64"),
  },
  {
    id: "linux-x64-appimage",
    platform: "Linux",
    label: "Linux x64 — AppImage",
    description: "Portable build for most desktop Linux distributions.",
    architecture: "x64",
    format: "AppImage",
    matches: (assetName) => hasExtension(assetName, ".appimage") && hasArch(assetName, "x64"),
  },
  {
    id: "linux-x64-deb",
    platform: "Linux",
    label: "Linux x64 — .deb",
    description: "Installer package for Debian, Ubuntu, and compatible distros.",
    architecture: "x64",
    format: "deb",
    matches: (assetName) => hasExtension(assetName, ".deb") && hasArch(assetName, "x64"),
  },
  {
    id: "linux-x64-rpm",
    platform: "Linux",
    label: "Linux x64 — .rpm",
    description: "Installer package for Fedora, RHEL, and compatible distros.",
    architecture: "x64",
    format: "rpm",
    matches: (assetName) => hasExtension(assetName, ".rpm") && hasArch(assetName, "x64"),
  },
  {
    id: "linux-arm64-appimage",
    platform: "Linux",
    label: "Linux ARM64 — AppImage",
    description: "Portable build for ARM64 Linux desktops.",
    architecture: "arm64",
    format: "AppImage",
    matches: (assetName) => hasExtension(assetName, ".appimage") && hasArch(assetName, "arm64"),
  },
  {
    id: "linux-arm64-deb",
    platform: "Linux",
    label: "Linux ARM64 — .deb",
    description: "Installer package for ARM64 Debian and Ubuntu systems.",
    architecture: "arm64",
    format: "deb",
    matches: (assetName) => hasExtension(assetName, ".deb") && hasArch(assetName, "arm64"),
  },
  {
    id: "linux-arm64-rpm",
    platform: "Linux",
    label: "Linux ARM64 — .rpm",
    description: "Installer package for ARM64 Fedora and related distros.",
    architecture: "arm64",
    format: "rpm",
    matches: (assetName) => hasExtension(assetName, ".rpm") && hasArch(assetName, "arm64"),
  },
];

export async function fetchLatestReleaseDownloads(): Promise<ReleaseDownloads> {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub release lookup failed with status ${response.status}`);
  }

  const latest = (await response.json()) as GithubRelease;

  if (latest.draft) {
    throw new Error("The rolling GitHub release is not currently published.");
  }

  return {
    releaseLabel: latest.name?.trim() || latest.tag_name,
    releaseUrl: latest.html_url || RELEASES_PAGE_URL,
    isPrerelease: latest.prerelease,
    options: resolveDownloadOptions(latest.assets),
  };
}

function resolveDownloadOptions(assets: GithubReleaseAsset[]): DownloadOption[] {
  return downloadDefinitions.flatMap((definition) => {
    const match = assets.find((asset) => definition.matches(asset.name.toLowerCase()));
    if (!match) {
      return [];
    }

    return [{
      ...definition,
      url: match.browser_download_url,
      assetName: match.name,
    }];
  });
}
