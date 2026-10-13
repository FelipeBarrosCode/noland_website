import { featurePages, getFeaturePage } from "./featurePages";
import { getSeoPage, seoPages } from "./seoPages";

export const SITE_URL = "https://no-land.net";
export const SITE_NAME = "Noland Cloud Gaming";
export const SOCIAL_IMAGE_PATH = "/brand/noland-social.jpg";

export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  priority: number;
  changeFrequency: "weekly" | "monthly";
}

export const HOME_METADATA: PageMetadata = {
  path: "/",
  title: "Noland Remote Gaming PC — Cloud Gaming by the Hour",
  description:
    "Rent a remote cloud gaming PC by the hour with Noland. Choose marketplace GPU hardware, automate the Linux gaming setup, and pay only for compute you use.",
  priority: 1,
  changeFrequency: "weekly",
};

export const GAMES_METADATA: PageMetadata = {
  path: "/games/",
  title: "Game Compatibility Checker — Noland Cloud Gaming",
  description: "Search Steam games and check their Linux compatibility using cached ProtonDB community ratings before you rent a Noland cloud gaming machine.",
  priority: 0.9,
  changeFrequency: "weekly",
};

export const CONTACT_METADATA: PageMetadata = {
  path: "/contact-me/",
  title: "Contact Noland Cloud Gaming",
  description: "Contact Noland Cloud Gaming with questions, feedback, or partnership ideas.",
  priority: 0.5,
  changeFrequency: "monthly",
};

export const PRIVACY_METADATA: PageMetadata = {
  path: "/privacy-policy/",
  title: "Privacy Policy — No Land",
  description: "How No Land runs locally on your device, uses your own provider credentials, and handles app data, third-party services, and optional website analytics.",
  priority: 0.3,
  changeFrequency: "monthly",
};

export const STATIC_PATHS = [
  HOME_METADATA.path,
  GAMES_METADATA.path,
  CONTACT_METADATA.path,
  PRIVACY_METADATA.path,
  ...seoPages.map((page) => page.path),
  ...featurePages.map((page) => page.path),
];

export function normalizePathname(pathname: string): string {
  const withoutDocument = pathname.replace(/\/index\.html$/u, "/");
  if (withoutDocument === "/") return "/";
  return withoutDocument.endsWith("/") ? withoutDocument : `${withoutDocument}/`;
}

export function getPageMetadata(pathname: string): PageMetadata | undefined {
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath === "/") return HOME_METADATA;
  if (normalizedPath === GAMES_METADATA.path) return GAMES_METADATA;
  if (normalizedPath === CONTACT_METADATA.path) return CONTACT_METADATA;
  if (normalizedPath === PRIVACY_METADATA.path) return PRIVACY_METADATA;

  const page = getFeaturePage(normalizedPath) ?? getSeoPage(normalizedPath);
  if (!page) return undefined;

  return {
    path: page.path,
    title: page.title,
    description: page.description,
    priority: 0.8,
    changeFrequency: "monthly",
  };
}

export function getAbsoluteUrl(pathname: string): string {
  return new URL(normalizePathname(pathname), `${SITE_URL}/`).toString();
}
