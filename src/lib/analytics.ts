type CaptureProperties = Record<string, string | number | boolean | null | undefined>;

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

let initPromise: Promise<typeof import("posthog-js").default | null> | null = null;
let initialized = false;
let consentGranted = false;

export function grantAnalyticsConsent() {
  consentGranted = true;
  void initializeAnalytics();
}

export async function initializeAnalytics() {
  if (initialized) return initPromise;
  if (!posthogKey || !posthogHost || !consentGranted) return null;

  initPromise ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      defaults: "2026-05-30",
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
    });
    initialized = true;
    return posthog;
  });

  return initPromise;
}

export function captureAnalyticsEvent(event: string, properties: CaptureProperties = {}) {
  if (!posthogKey || !posthogHost || !consentGranted) return;

  void initializeAnalytics().then((posthog) => {
    posthog?.capture(event, properties);
  });
}

export function warnIfAnalyticsMissing() {
  if (!import.meta.env.DEV) return;

  if (!posthogKey) {
    console.error(
      "VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured",
    );
  }

  if (!posthogHost) {
    console.error(
      "VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured",
    );
  }
}
