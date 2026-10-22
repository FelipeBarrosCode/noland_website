type CaptureProperties = Record<string, string | number | boolean | null | undefined>;

type CampaignAttribution = {
  campaign_id: string;
  campaign_landing_path: string;
};

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
const campaignStorageKey = "noland-campaign-attribution";
const campaignIdPattern = /^campaign-(?:0[1-9]|10)$/u;

let initPromise: Promise<typeof import("posthog-js").default | null> | null = null;
let initialized = false;
let consentGranted = false;
let campaignAttribution: CampaignAttribution | null = null;

function parseCampaignId(hash: string): string | null {
  let decodedHash = hash.replace(/^#/u, "");
  try {
    decodedHash = decodeURIComponent(decodedHash);
  } catch {
    return null;
  }

  const candidate = decodedHash.startsWith("campaign=")
    ? decodedHash.slice("campaign=".length)
    : decodedHash;

  return campaignIdPattern.test(candidate) ? candidate : null;
}

function readStoredCampaignAttribution(): CampaignAttribution | null {
  try {
    const value = window.sessionStorage.getItem(campaignStorageKey);
    if (!value) return null;

    const parsed = JSON.parse(value) as Partial<CampaignAttribution>;
    return typeof parsed.campaign_id === "string"
      && campaignIdPattern.test(parsed.campaign_id)
      && typeof parsed.campaign_landing_path === "string"
      ? { campaign_id: parsed.campaign_id, campaign_landing_path: parsed.campaign_landing_path }
      : null;
  } catch {
    return null;
  }
}

function resolveCampaignAttribution(): { attribution: CampaignAttribution | null; isLanding: boolean } {
  const campaignId = parseCampaignId(window.location.hash);
  if (campaignId) {
    return {
      attribution: {
        campaign_id: campaignId,
        campaign_landing_path: `${window.location.pathname}${window.location.search}`,
      },
      isLanding: true,
    };
  }

  return { attribution: readStoredCampaignAttribution(), isLanding: false };
}

export function grantAnalyticsConsent() {
  consentGranted = true;
  void initializeAnalytics();
}

export async function initializeAnalytics() {
  if (initialized) return initPromise;
  if (!posthogKey || !posthogHost || !consentGranted) return null;

  initPromise ??= import("posthog-js").then(({ default: posthog }) => {
    const campaign = resolveCampaignAttribution();
    campaignAttribution = campaign.attribution;

    if (campaignAttribution) {
      try {
        window.sessionStorage.setItem(campaignStorageKey, JSON.stringify(campaignAttribution));
      } catch {
        // Attribution still applies to this page when session storage is unavailable.
      }
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

    if (campaignAttribution) {
      posthog.register_for_session(campaignAttribution);
    }
    if (campaign.isLanding && campaignAttribution) {
      posthog.capture("campaign_landing", campaignAttribution);
    }

    initialized = true;
    return posthog;
  });

  return initPromise;
}

export function captureAnalyticsEvent(event: string, properties: CaptureProperties = {}) {
  if (!posthogKey || !posthogHost || !consentGranted) return;

  void initializeAnalytics().then((posthog) => {
    posthog?.capture(event, { ...campaignAttribution, ...properties });
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
