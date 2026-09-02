import { featurePages } from "../lib/featurePages";

interface FeatureLinksProps {
  currentPath?: string;
}

export function FeatureLinks({ currentPath }: FeatureLinksProps) {
  return (
    <div className="seo-pillar-grid feature-link-grid">
      {featurePages
        .filter((page) => page.path !== currentPath)
        .map((page, index) => (
          <a className="seo-pillar-card" href={page.path} key={page.path}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{page.eyebrow}</strong>
            <p>{page.quickAnswer}</p>
            <i aria-hidden="true">Explore feature →</i>
          </a>
        ))}
    </div>
  );
}
