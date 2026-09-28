import { useEffect } from "react";

const revealSelector = [
  ".hero-copy > *",
  ".hero-deck",
  ".section-heading",
  ".downloads-status",
  ".download-recommendation",
  ".metric-strip__inner > div",
  ".process-rail > li",
  ".process-specs",
  ".api-key-panel",
  ".seo-pillar-card",
  ".market-browser",
  ".comparison-split",
  ".cost-calculator",
  ".freedom-copy",
  ".library-visual",
  ".latency-lab",
  ".provision-console",
  ".topology-board",
  ".philosophy-grid > *",
  ".control-panel-visual",
  ".control-copy",
  ".faq-intro",
  ".faq-list",
  ".final-cta__inner > *",
  ".seo-highlight-strip__inner > div",
  ".seo-answer-panel",
  ".seo-content-section__heading",
  ".seo-content-section__body",
].join(",");

export function MotionSystem() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    revealTargets.forEach((element) => {
      const siblingIndex = Array.from(element.parentElement?.children ?? []).indexOf(element);
      element.dataset.reveal = "pending";
      element.style.setProperty("--reveal-delay", `${Math.min(Math.max(siblingIndex, 0), 4) * 55}ms`);
    });

    document.documentElement.classList.add("motion-enhanced");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.reveal = "visible";
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    revealTargets.forEach((element) => revealObserver.observe(element));

    const animatedSections = Array.from(document.querySelectorAll<HTMLElement>("main > section, .seo-content-section"));
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-motion-visible");
        });
      },
      { rootMargin: "0px 0px -15%", threshold: 0.04 },
    );

    animatedSections.forEach((section) => sectionObserver.observe(section));

    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
      document.documentElement.classList.remove("motion-enhanced");
      revealTargets.forEach((element) => {
        delete element.dataset.reveal;
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return null;
}
