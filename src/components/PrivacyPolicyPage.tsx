import { CookieConsent } from "./CookieConsent";
import { SiteFooter } from "./ExperienceSections";
import { HashScroll } from "./HashScroll";
import { MotionSystem } from "./MotionSystem";
import { Navigation } from "./Navigation";

export function PrivacyPolicyPage() {
  return (
    <>
      <HashScroll />
      <MotionSystem />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content" className="privacy-page">
        <article className="shell privacy-page__inner" aria-labelledby="privacy-title">
          <header className="privacy-page__header">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <a href="/">Noland Cloud Gaming</a>
              <span aria-hidden="true">/</span>
              <span>Privacy policy</span>
            </nav>
            <p className="eyebrow"><span aria-hidden="true">//</span> YOUR DEVICE. YOUR CONTROL.</p>
            <h1 id="privacy-title">Privacy <em>policy.</em></h1>
            <p className="privacy-page__lede">
              No Land runs on your device. You bring your own service accounts and credentials,
              and control the remote machines and storage you connect to.
            </p>
            <p className="privacy-page__date">Last updated: <time dateTime="2026-10-13">October 13, 2026</time></p>
          </header>

          <div className="privacy-page__summary">
            <h2>The short version</h2>
            <p>
              There is no No Land account system or developer-operated provisioning backend.
              The native client runs locally on your computer or iPhone and communicates with
              your chosen providers and remote machine. This website is separate and uses
              optional analytics only after you accept the cookie banner.
            </p>
          </div>

          <div className="privacy-page__content">
            <section aria-labelledby="privacy-local">
              <h2 id="privacy-local">1. How the app works</h2>
              <p>
                No Land is a local client, not a hosted cloud gaming account service. Setup,
                connection management, settings, and client-side controls run on your device.
                Games, applications, and remote setup commands run on the machine you rent or control.
              </p>
              <p>
                Provisioning connects directly to the Vast.ai API and your remote machine over SSH;
                it does not pass through a server operated by us. We do not receive your stream,
                uploaded files, or Shared Storage exports through a No Land backend.
              </p>
              <p>
                Running locally does not mean the app works without a network or that all data
                stays on your device. Provider authentication, remote streaming, file uploads,
                backups, and optional relay connections communicate with the services you use.
              </p>
            </section>

            <section aria-labelledby="privacy-data">
              <h2 id="privacy-data">2. Data stored on your device</h2>
              <p>
                The app saves settings, connection information, credentials, and operational data
                needed to manage your machines. This can include provider API keys, SSH keys,
                Sunshine credentials, storage configuration, local spending estimates, and diagnostic logs.
              </p>
              <p>
                Credentials use platform-secure storage where supported. Some keys and connection
                configuration also exist as local app files, and working credentials may be held
                in memory while the app runs. We do not receive these locally stored credentials
                through a developer-operated account or provisioning service.
              </p>
              <p>
                Where supported, microphone forwarding uses your device&apos;s microphone only
                when enabled and sends that audio to your remote machine. You can manage
                microphone and notification permissions through your operating system.
              </p>
              <p>
                Credentials are sent to the relevant provider when authentication requires it.
                Depending on the features you enable, credentials or configuration may also be
                supplied to your remote machine for storage or lifecycle operations.
              </p>
            </section>

            <section aria-labelledby="privacy-providers">
              <h2 id="privacy-providers">3. Services you choose to connect</h2>
              <ul>
                <li><strong>Vast.ai:</strong> handles your computing account, machine rentals, billing, and authenticated machine-management requests. Rentals and payments are between you and Vast.ai.</li>
                <li><strong>Your remote machine:</strong> receives setup commands, uploaded files, streaming input, and configuration needed for the features you use. Sunshine credentials belong to that machine, not to a No Land account.</li>
                <li><strong>Your cloud storage provider:</strong> receives the files and application bundles you choose to export or back up through Shared Storage, using the credentials you configure.</li>
                <li><strong>Optional relay providers:</strong> services such as Cloudflare TURN process connection traffic and technical connection information when you configure a relay with your own credentials.</li>
                <li><strong>Software and content services:</strong> update checks, dependency downloads, and optional game-information features may contact GitHub or other software and content providers.</li>
              </ul>
              <p>
                These services have their own privacy policies, retention practices, and security
                controls. Their operators, including the host of your remote machine, may process
                information under their policies. No Land does not make third-party infrastructure local or private.
              </p>
            </section>

            <section aria-labelledby="privacy-website">
              <h2 id="privacy-website">4. This website and optional analytics</h2>
              <p>
                The device-first description above applies to the native app. This website is
                hosted through Cloudflare, which processes technical request information, such
                as IP addresses, browser information, and requested URLs, to deliver and protect the site.
              </p>
              <p>
                If you accept analytics in the cookie banner, the website enables PostHog to
                understand site usage and diagnose website errors. This includes website interactions
                and technical browser information, and may use cookies or browser storage.
                The choice you make in the banner is stored locally in your browser.
              </p>
              <p>
                You can decline optional analytics. To change a saved choice, clear this website&apos;s
                browser data and reload it to see the banner again. Website consent does not give
                us access to credentials or files stored in the native app.
              </p>
              <p>
                Website marketplace and game-compatibility features use a Cloudflare-hosted service
                to retrieve and cache public Vast.ai offers and ProtonDB summaries. These website
                features do not require your native app&apos;s provider keys.
              </p>
            </section>

            <section aria-labelledby="privacy-contact">
              <h2 id="privacy-contact">5. Messages and information you choose to share</h2>
              <p>
                If you email us, we receive your address and the information you send so we can
                respond. The website contact form opens your own email app; it does not submit
                the form to a No Land form-processing backend.
              </p>
              <p>
                If you choose to share logs, screenshots, or a GitHub issue, review the content
                first. Public issues may be visible to anyone. Do not include API keys, passwords,
                private keys, or sensitive files in support messages. The service used to send
                your message also processes it under its own policy.
              </p>
            </section>

            <section aria-labelledby="privacy-controls">
              <h2 id="privacy-controls">6. Your controls and data retention</h2>
              <p>
                You control the credentials and providers you configure, the files you upload or
                export, and the remote machines you rent. You can manage local app data and saved
                credentials on your device, and manage remote files, backups, and rentals through
                the relevant machine or provider.
              </p>
              <p>
                Removing the app does not necessarily remove local app data or operating-system
                credential-store entries, stop paid rentals, or delete cloud backups. Those may require separate
                action. Local records remain subject to the app&apos;s settings and retention behavior;
                provider-held data follows the provider&apos;s retention policies.
              </p>
              <p>
                For privacy requests about information you have sent to us, contact us below.
                Depending on applicable law, you may have rights to access, correct, or request
                deletion of that information. Requests about provider-held data should also be
                directed to the relevant provider.
              </p>
            </section>

            <section aria-labelledby="privacy-security">
              <h2 id="privacy-security">7. Security and policy updates</h2>
              <p>
                Local execution reduces reliance on a developer-operated backend, but does not
                eliminate security risks. Protect your device, use trusted remote hosts, grant
                only the provider permissions you need, and revoke credentials you no longer use.
                No software or transmission method can guarantee absolute security.
              </p>
              <p>
                We may update this policy as the app or website changes. The current policy and
                its last-updated date will be published on this page.
              </p>
            </section>

            <section aria-labelledby="privacy-questions">
              <h2 id="privacy-questions">8. Privacy questions</h2>
              <p>
                Contact the No Land developer at <a href="mailto:felipe.ba.moura@gmail.com">felipe.ba.moura@gmail.com</a>,
                or visit the <a href="/contact-me/">contact page</a>.
              </p>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
      <CookieConsent />
    </>
  );
}
