import type { CSSProperties } from "react";
import { DOWNLOADS_SECTION_ID, RELEASES_PAGE_URL, REPOSITORY_URL } from "../lib/siteLinks";
import { SectionHeading } from "./SectionHeading";

const stores = ["COMPATIBLE STORES", "LINUX LAUNCHERS", "PC LIBRARIES", "SUPPORTED SOFTWARE"];

export function MetricStrip() {
  const metrics = [
    ["~8 ms", "overhead above natural route"],
    ["10–15 min", "average provisioning"],
    ["300K+", "broader compatible ecosystem"],
    ["$0", "monthly Noland subscription"],
    ["Unlimited", "artificial session limit"],
    ["RTX 20 → 50", "marketplace generation span"],
  ];

  return (
    <section className="metric-strip" aria-label="Noland at a glance">
      <div className="shell metric-strip__inner">
        {metrics.map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}
      </div>
    </section>
  );
}

export function GameFreedom() {
  return (
    <section className="section freedom-section" aria-labelledby="freedom-title">
      <div className="shell freedom-layout">
        <div className="freedom-copy">
          <SectionHeading
            eyebrow="YOUR LIBRARY / YOUR LOGIN"
            title={<span id="freedom-title">It’s a PC. <em>Not a catalog.</em></span>}
            description="Use the compatible stores, launchers, and software that fit your game setup instead of waiting for a streaming service to add a title."
          />
          <div className="store-ticker" aria-label="Examples of compatible stores and launchers">
            {stores.map((store) => <span key={store}><i aria-hidden="true" />{store}</span>)}
          </div>
          <div className="compatibility-warning">
            <span aria-hidden="true">!</span>
            <p><strong>Compatibility varies.</strong> Noland provisions a Linux gaming environment. Anti-cheat, Windows-only functionality, launchers, and individual titles may not work. It is flexible remote PC access—not identical to owning a local Windows machine.</p>
          </div>
        </div>

        <div className="library-visual" aria-label="Compatible PC and Linux ecosystem">
          <div className="library-cabinet">
            <div className="library-cabinet__head"><span>LIBRARY_INDEX</span><i>COMPATIBILITY MODE</i></div>
            <div className="library-count"><span>300K+</span><strong>BROADER PC / LINUX<br />ECOSYSTEM</strong></div>
            <div className="game-grid" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--game-index": index } as CSSProperties} />)}
            </div>
            <div className="library-footer"><span>NOT A GUARANTEE FOR EVERY TITLE</span><i>CHECK COMPATIBILITY</i></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArchitectureAndPhilosophy() {
  return (
    <section className="section architecture-section" aria-labelledby="architecture-title">
      <div className="shell">
        <SectionHeading
          eyebrow="DIRECT BY DESIGN"
          title={<span id="architecture-title">Provision centrally. <em>Play directly.</em></span>}
          description="Noland coordinates marketplace and machine setup, then the client interacts with the rented PC. Gameplay and session data does not need to be stored on centralized Noland servers."
        />

        <div className="topology-board">
          <div className="topology-grid" aria-hidden="true" />
          <div className="topology-node topology-node--client">
            <span className="topology-icon" aria-hidden="true">▣</span><strong>YOUR CLIENT</strong><small>Windows / macOS / Linux</small>
          </div>
          <div className="topology-route topology-route--control"><span>API / PROVISIONING</span><i /><i /><i /></div>
          <div className="topology-node topology-node--services">
            <span className="topology-icon" aria-hidden="true">⌁</span><strong>MARKETPLACE + NOLAND</strong><small>discover / create / configure</small>
          </div>
          <div className="topology-route topology-route--direct"><span>GAMEPLAY / SESSION PATH</span><i /><i /><i /></div>
          <div className="topology-node topology-node--provider">
            <span className="topology-icon" aria-hidden="true">▦</span><strong>RENTED MACHINE</strong><small>independent provider</small>
          </div>
          <div className="no-storage-badge"><i aria-hidden="true">×</i><span>NO REQUIRED CENTRAL<br />GAMEPLAY STORAGE</span></div>
        </div>
        <p className="architecture-caveat"><span aria-hidden="true">NOTE_</span> This is an architecture statement about Noland’s design, not a broad guarantee covering every provider, marketplace service, network, or software component.</p>

        <div className="philosophy-grid">
          <article className="philosophy-statement">
            <p className="panel-kicker">WHY P2P INFRASTRUCTURE</p>
            <h3>Gaming hardware access need not live only in giant datacenters.</h3>
            <p>Independent providers already operate capable GPUs. Marketplace plurality can connect that distributed supply with players who need temporary access—without concentrating every machine under one streaming platform.</p>
          </article>
          <div className="provider-array" aria-label="Independent provider marketplace">
            <div className="provider-player"><i /><span>PLAYER</span></div>
            <div className="provider-lines" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="provider-nodes">
              {["HOST_01", "HOST_02", "HOST_03", "HOST_04"].map((host, index) => <span key={host}><i className={`provider-dot provider-dot--${index + 1}`} />{host}<small>{["NORTH", "WEST", "EAST", "EUROPE"][index]}</small></span>)}
            </div>
            <strong>ONE MARKETPLACE // MANY PROVIDERS</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ControlSection() {
  const controls = [
    ["HARDWARE", "Choose the GPU generation and configuration that fits the workload."],
    ["LOCATION", "Choose a provider near enough for the route you want to test."],
    ["SOFTWARE", "Use compatible stores, launchers, games, and PC tools."],
    ["DURATION", "Stay connected as long as desired—there is no artificial Noland timer."],
    ["LIFECYCLE", "Stop the rented machine when done so marketplace billing does not continue."],
  ];

  return (
    <section className="section control-section" aria-labelledby="control-title">
      <div className="shell control-layout">
        <div className="control-panel-visual" aria-hidden="true">
          <div className="control-panel-head"><span>OPERATOR AUTHORITY</span><i>MANUAL</i></div>
          <div className="big-dial"><span /><i>YOU CHOOSE</i></div>
          <div className="switch-bank">
            {controls.map(([name], index) => <span key={name}><i className={index === 4 ? "warning" : ""} /><small>{name}</small></span>)}
          </div>
          <div className="stop-key">STOP INSTANCE <i>■</i></div>
        </div>
        <div className="control-copy">
          <SectionHeading
            eyebrow="YOU’RE THE OPERATOR"
            title={<span id="control-title">Control the machine. <em>Own the tradeoffs.</em></span>}
            description="Noland removes repetitive provisioning work without hiding the choices that shape price, compatibility, route quality, and billing."
          />
          <ol className="control-list">
            {controls.map(([name, body], index) => <li key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{name}</strong><p>{body}</p></div></li>)}
          </ol>
          <div className="platform-support"><span>DESKTOP CLIENT SUPPORT</span><strong><i aria-hidden="true">⊞</i> WINDOWS</strong><strong><i aria-hidden="true">◆</i> macOS</strong><strong><i aria-hidden="true">●</i> LINUX</strong><small>Desktop only</small></div>
        </div>
      </div>
    </section>
  );
}

export function FinalCtaAndFooter() {
  return (
    <>
      <section className="final-cta" aria-labelledby="final-cta-title">
        <div className="final-cta__grid" aria-hidden="true" />
        <div className="shell final-cta__inner">
          <img
                      src="./brand/noland-hero-360.webp"
                      srcSet="./brand/noland-hero-360.webp 360w, ./brand/noland-hero-720.webp 720w"
                      sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 860px) 240px, (max-width: 1100px) 310px, 360px"
                      alt="Noland pixel arcade cabinet sailing on the ocean"
                      width="360"
                      height="288"
                      loading="lazy"
                      decoding="async"
                    />
          <div>
            <p className="eyebrow"><span aria-hidden="true">//</span> READY TO PROVISION?</p>
            <h2 id="final-cta-title">Your library is waiting.<br /><em>Rent the machine.</em></h2>
            <p>Bring your Vast account. Pick current marketplace hardware. Let Noland build the direct path to your remote gaming PC.</p>
            <div className="final-cta__actions">
              <a className="button button--primary button--large" href={`#${DOWNLOADS_SECTION_ID}`}>Get Noland <span aria-hidden="true">↓</span></a>
              <a className="button button--ghost button--large" href="https://cloud.vast.ai/" target="_blank" rel="noreferrer">Open Vast.ai <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell footer-main">
          <a className="brand-lockup" href="#top" aria-label="Back to Noland home"><img src="./brand/noland-icon.webp" alt="" width="44" height="44" loading="lazy" decoding="async" /><span>NOLAND</span></a>
          <p>P2P PC game streaming through hardware you rent and control.</p>
          <nav aria-label="Footer navigation">
            <a href={`#${DOWNLOADS_SECTION_ID}`}>Downloads ↓</a>
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">Repository ↗</a>
            <a href={RELEASES_PAGE_URL} target="_blank" rel="noreferrer">Latest release ↗</a>
            <a href="https://cloud.vast.ai/" target="_blank" rel="noreferrer">Vast.ai account ↗</a>
            <a href="https://cloud.vast.ai/manage-keys/?tab=api-keys" target="_blank" rel="noreferrer">API keys ↗</a>
          </nav>
        </div>
        <div className="shell footer-bottom"><span>NOLAND // P2P PC STREAMING</span><span>WINDOWS · macOS · LINUX</span><span>BUILT FOR DIRECT PLAY</span></div>
      </footer>
    </>
  );
}
