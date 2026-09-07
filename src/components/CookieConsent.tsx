import { useEffect, useState } from "react";

const CONSENT_KEY = "noland-cookie-consent";
const CONSENT_EVENT = "noland-cookie-consent";

type ConsentChoice = "accepted" | "declined";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      setIsVisible(window.localStorage.getItem(CONSENT_KEY) === null);
    } catch {
      // Keep the prompt visible when storage is unavailable.
      setIsVisible(true);
    }
  }, []);

  const choose = (choice: ConsentChoice) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // The current choice still applies for this page view.
    }

    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-copy">
      <div className="cookie-consent__copy">
        <p className="cookie-consent__kicker">SITE SETTINGS</p>
        <h2 id="cookie-consent-title">Okay to use cookies?</h2>
        <p id="cookie-consent-copy">
          Noland uses cookies and similar technologies to remember your preferences and understand how the site is used.
        </p>
      </div>
      <div className="cookie-consent__actions">
        <button className="button button--ghost button--small" type="button" onClick={() => choose("declined")}>
          Decline
        </button>
        <button className="button button--primary button--small" type="button" onClick={() => choose("accepted")}>
          Accept cookies
        </button>
      </div>
    </aside>
  );
}
