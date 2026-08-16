import { seoPages } from "../lib/seoPages";

type SeoPillarLinksProps = {
  currentPath?: string;
};

export function SeoPillarLinks({ currentPath }: SeoPillarLinksProps) {
  return (
    <div className="seo-pillar-grid">
      {seoPages
        .filter((page) => page.path !== currentPath)
        .map((page, index) => (
          <a className="seo-pillar-card" href={page.path} key={page.path}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{page.eyebrow}</strong>
            <p>{page.quickAnswer}</p>
            <i aria-hidden="true">Explore →</i>
          </a>
        ))}
    </div>
  );
}
