import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { grantAnalyticsConsent, warnIfAnalyticsMissing } from "./lib/analytics";
import "./styles/global.css";

const consentKey = "noland-cookie-consent";
const consentEvent = "noland-cookie-consent";

let hasCookieConsent = false;
try {
  hasCookieConsent = window.localStorage.getItem(consentKey) === "accepted";
} catch {
  // Without storage, wait for an explicit choice during this page view.
}

if (hasCookieConsent) {
  grantAnalyticsConsent();
} else {
  window.addEventListener(consentEvent, (event) => {
    if ((event as CustomEvent<string>).detail === "accepted") {
      grantAnalyticsConsent();
    }
  });
}

warnIfAnalyticsMissing();

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
