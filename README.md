<div align="center">

# No Land Website

### Marketing site for No Land — on-demand GPU cloud gaming with the freedom of a real PC.

[![Website](https://img.shields.io/badge/Live-no--land.net-111111)](https://no-land.net)
[![React](https://img.shields.io/badge/React-TypeScript-20232a?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Static%20Build-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-Audited-F44B21?logo=lighthouse&logoColor=white)](https://developer.chrome.com/docs/lighthouse/)

[Main product](https://github.com/FelipeBarrosCode/no_land) · [Live site](https://no-land.net)

</div>

---

## Overview

This repository contains the public marketing and SEO site for **No Land**, a desktop application that provisions on-demand Vast.ai GPU hardware into a personal Linux gaming PC.

The site is built as a fast, crawlable static experience rather than a client-only SPA. Production builds prerender the homepage and SEO landing pages into HTML, generate canonical metadata and a sitemap, and can be audited automatically with Lighthouse.

## Engineering goals

- **Fast first load** — static HTML output for public marketing routes.
- **Search-engine visibility** — prerendered SEO pillar pages, canonical metadata, structured copy, FAQs, and sitemap generation.
- **No-JavaScript readability** — important content remains accessible to crawlers and visitors without client-side execution.
- **Performance enforcement** — automated Lighthouse audits can fail when quality drops below the configured thresholds.
- **Consistent product identity** — shared site metadata, design tokens, brand assets, and reusable landing-page components.

## Quality targets

The project includes a Lighthouse audit workflow that checks every URL in the generated sitemap using a mobile-oriented profile.

Configured targets include:

- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

Reports are written to `lighthouse-reports/` for local review.

## Project structure

```text
src/
├── components/       # Homepage, navigation, reusable SEO page UI
├── lib/
│   ├── seoPages.ts   # Structured landing-page content and FAQs
│   └── site.ts       # Canonical metadata and route definitions
└── styles/           # Design tokens and responsive styles

public/
├── brand/            # Optimized brand/social assets
└── fonts/            # Self-hosted licensed fonts

scripts/              # Prerendering, sitemap, SEO and audit tooling
```

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## SEO and performance audit

```bash
npm run audit
```

The audit builds the site, reads routes from the generated sitemap, runs Lighthouse against each page, and saves HTML/JSON reports locally.

## Product links

- [No Land desktop application](https://github.com/FelipeBarrosCode/no_land)
- [Latest rolling release](https://github.com/FelipeBarrosCode/no_land/releases/tag/main-latest)
- [No Land website](https://no-land.net)

---

<div align="center">

**The product site should be as engineered as the product behind it.**

</div>
