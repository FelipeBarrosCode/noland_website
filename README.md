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

The static production output is written to `dist/`. Asset paths are relative so the build can be hosted at a custom-domain root or under a repository subpath.

## Project structure

```text
src/
  components/    Homepage sections and interactive product visuals
  styles/        Noland design tokens and responsive styles
public/brand/    Brand assets derived from the desktop app
```

## Product destinations

- Repository: https://github.com/FelipeBarrosCode/no_land
- Rolling release: https://github.com/FelipeBarrosCode/no_land/releases/tag/main-latest
- Vast.ai: https://cloud.vast.ai/
