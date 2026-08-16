# Noland Website

Standalone marketing website for [Noland](https://github.com/FelipeBarrosCode/no_land), a desktop client that provisions Vast.ai marketplace hardware as a personal Linux gaming PC.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
SITE_URL=https://your-production-domain.example npm run build
npm run preview
```

The build prerenders the React homepage into static HTML for crawlers and no-JavaScript visitors. The static production output is written to `dist/`. Asset paths remain relative so the site can be hosted at a custom-domain root or under a repository subpath.

Set `SITE_URL` in the production build environment to generate the canonical URL, `og:url`, first-party social image URL, and `sitemap.xml`. Local builds can omit it.

## SEO and performance audit

```bash
npm run audit
```

The Lighthouse audit builds the site, audits the homepage with Google's mobile-first profile, and enforces a minimum performance score of 95 plus perfect accessibility, best-practices, and SEO scores. HTML and JSON reports are written to the ignored `lighthouse-reports/` directory.

## Project structure

```text
src/
  components/    Homepage sections and interactive product visuals
  styles/        Noland design tokens and responsive styles
public/
  brand/         Optimized brand and social-sharing assets
  fonts/         Self-hosted OFL-licensed display fonts
scripts/         Static prerender and SEO artifact generation
```

## Product destinations

- Repository: https://github.com/FelipeBarrosCode/no_land
- Rolling release: https://github.com/FelipeBarrosCode/no_land/releases/tag/main-latest
- Vast.ai: https://cloud.vast.ai/
