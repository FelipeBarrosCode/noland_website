import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import posthog from "posthog-js";
import { App } from "./App";
import "./styles/global.css";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
const consentKey = "noland-cookie-consent";
const consentEvent = "noland-cookie-consent";
let posthogInitialized = false;

function initializePosthog() {
  if (posthogInitialized || !posthogKey || !posthogHost) {
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    defaults: "2026-05-30",
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  });
  posthogInitialized = true;
}

let hasCookieConsent = false;
try {
  hasCookieConsent = window.localStorage.getItem(consentKey) === "accepted";
} catch {
  // Without storage, wait for an explicit choice during this page view.
}

if (hasCookieConsent) {
  initializePosthog();
} else {
  window.addEventListener(consentEvent, (event) => {
    if ((event as CustomEvent<string>).detail === "accepted") {
      initializePosthog();
    }
  });
}

if (import.meta.env.DEV && !posthogKey) {
  console.error(
    "VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured",
  );
}

if (import.meta.env.DEV && !posthogHost) {
  console.error(
    "VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured",
  );
}

const root = document.getElementById("root")!;
const application = (
  <React.StrictMode>
    <App pathname={window.location.pathname} />
  </React.StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, application);
} else {
  createRoot(root).render(application);
}
