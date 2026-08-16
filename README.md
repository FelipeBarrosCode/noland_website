# Noland Website

Standalone marketing website for [Noland](https://github.com/FelipeBarrosCode/no_land), a desktop client that provisions Vast.ai marketplace hardware as a personal Linux gaming PC.

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

The build prerenders the homepage and every SEO pillar route into static HTML for crawlers and no-JavaScript visitors. The static production output is written to `dist/`, with canonical metadata and a complete sitemap generated for the production origin at `https://no-land.net`.

## SEO and performance audit

```bash
npm run audit
```

The Lighthouse audit builds the site, reads every URL from the generated sitemap, audits each route with Google's mobile-first profile, and enforces a minimum performance score of 95 plus perfect accessibility, best-practices, and SEO scores. HTML and JSON reports are written to the ignored `lighthouse-reports/` directory.

## Project structure

```text
src/
  components/    Homepage, shared navigation, and SEO landing-page UI
  lib/seoPages.ts  Structured copy and FAQs for the six pillar routes
  lib/site.ts      Canonical site identity, metadata, and static routes
  styles/          Noland design tokens and responsive styles
public/
  brand/         Optimized brand and social-sharing assets
  fonts/         Self-hosted OFL-licensed display fonts
scripts/         Static prerender and SEO artifact generation
```

## Product destinations

- Repository: https://github.com/FelipeBarrosCode/no_land
- Rolling release: https://github.com/FelipeBarrosCode/no_land/releases/tag/main-latest
- Vast.ai: https://cloud.vast.ai/
