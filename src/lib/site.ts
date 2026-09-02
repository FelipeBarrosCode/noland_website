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
  title: "Noland Cloud Gaming PC — Pay by the Hour, No Subscription",
  description:
    "Rent a cloud gaming PC by the hour with Noland. Choose a marketplace GPU, automate the Linux gaming setup, and pay only for the compute you use.",
  priority: 1,
  changeFrequency: "weekly",
};

export const STATIC_PATHS = [
  HOME_METADATA.path,
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
