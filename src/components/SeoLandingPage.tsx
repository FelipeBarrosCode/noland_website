import { FinalCta, SiteFooter } from "./ExperienceSections";
import { Navigation } from "./Navigation";
import { SeoPillarLinks } from "./SeoPillarLinks";
import type { SeoPage } from "../lib/seoPages";
import { getAbsoluteUrl, SITE_NAME, SITE_URL } from "../lib/site";

interface SeoLandingPageProps {
  page: SeoPage;
}

export function SeoLandingPage({ page }: SeoLandingPageProps) {
  const pageUrl = getAbsoluteUrl(page.path);
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.heading,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  });

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content" className="seo-page">
        <article>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />

          <header className="seo-page-hero">
            <div className="seo-page-hero__grid" aria-hidden="true" />
            <div className="shell seo-page-hero__inner">
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                <a href="/">Noland Cloud Gaming</a>
                <span aria-hidden="true">/</span>
                <span>{page.eyebrow}</span>
              </nav>
              <p className="eyebrow"><span aria-hidden="true">//</span> {page.eyebrow.toUpperCase()}</p>
              <h1>{page.heading}</h1>
              <p className="seo-page-hero__lede">{page.lede}</p>
              <div className="seo-page-hero__actions">
                <a className="button button--primary button--large" href="/#downloads">Download Noland <span aria-hidden="true">↓</span></a>
                <a className="button button--ghost button--large" href="/#how-it-works">How Noland works <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </header>

          <div className="seo-highlight-strip" aria-label="Noland product highlights">
            <div className="shell seo-highlight-strip__inner">
              {page.highlights.map((highlight) => (
                <div key={highlight.label}><strong>{highlight.value}</strong><span>{highlight.label}</span></div>
              ))}
            </div>
          </div>

          <section className="section seo-answer-section" aria-labelledby="quick-answer-title">
            <div className="shell seo-answer-panel">
              <p className="panel-kicker">QUICK ANSWER</p>
              <h2 id="quick-answer-title">What you need to know</h2>
              <p>{page.quickAnswer}</p>
            </div>
          </section>

          <div className="seo-content shell">
            {page.sections.map((section, index) => (
              <section className="seo-content-section" key={section.heading} aria-labelledby={`seo-section-${index}`}>
                <div className="seo-content-section__heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.eyebrow ? <p className="panel-kicker">{section.eyebrow.toUpperCase()}</p> : null}
                  <h2 id={`seo-section-${index}`}>{section.heading}</h2>
                </div>
                <div className="seo-content-section__body">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets ? (
                    <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                  ) : null}
                  {section.links ? (
                    <div className="seo-inline-links">
                      {section.links.map((link) => <a href={link.href} key={link.href}>{link.label} <span aria-hidden="true">→</span></a>)}
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <section className="section seo-related-section" aria-labelledby="related-guides-title">
            <div className="shell">
              <div className="section-heading">
                <p className="eyebrow"><span aria-hidden="true">//</span> EXPLORE NOLAND</p>
                <h2 id="related-guides-title">Related cloud gaming guides</h2>
                <p className="section-heading__description">Continue with a use case, pricing model, or technical workflow related to this page.</p>
              </div>
              <SeoPillarLinks currentPath={page.path} />
            </div>
          </section>

          <section className="section seo-page-faq" aria-labelledby="seo-faq-title">
            <div className="shell seo-page-faq__layout">
              <div>
                <p className="eyebrow"><span aria-hidden="true">//</span> FAQ</p>
                <h2 id="seo-faq-title">Questions about {page.eyebrow.toLowerCase()}</h2>
              </div>
              <div className="faq-list">
                {page.faqs.map((faq, index) => (
                  <details key={faq.question} open={index === 0}>
                    <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{faq.question}</strong><i aria-hidden="true" /></summary>
                    <div><p>{faq.answer}</p></div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </article>
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
