import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
export { getPageMetadata, SITE_URL as siteUrl, STATIC_PATHS as staticPaths } from "./lib/site";

export function render(pathname = "/") {
  return renderToString(
    <StrictMode>
      <App pathname={pathname} />
    </StrictMode>,
  );
}
