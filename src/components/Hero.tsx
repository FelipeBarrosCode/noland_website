import type { CSSProperties } from "react";
import { DOWNLOADS_SECTION_ID } from "../lib/siteLinks";

const architectureNodes = [
  { label: "YOU", detail: "Noland client", tone: "cyan" },
  { label: "NOLAND", detail: "orchestration", tone: "pink" },
  { label: "P2P / DIRECT", detail: "stream route", tone: "lime" },
  { label: "RENTED RTX PC", detail: "Vast provider", tone: "yellow" },
];

const bootSteps = ["Select", "Provision", "Connect", "Play"];

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-grid shell">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">//</span> PAY-AS-YOU-GO CLOUD GAMING</p>
          <h1 id="hero-title">Rent a cloud gaming PC.<br /><span>Pay by the hour.</span></h1>
          <p className="hero-lede">
            Choose a marketplace GPU, launch your own Linux cloud gaming PC, and pay only for the compute you use. Noland automates setup and enables direct P2P streaming—without a monthly Noland subscription.
          </p>
          <div className="hero-actions">
            <a className="button button--primary button--large" href={`/#${DOWNLOADS_SECTION_ID}`}>
              Get Noland <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="/#how-it-works">See how the link works <span aria-hidden="true">→</span></a>
          </div>
          <ul className="hero-facts" aria-label="Product highlights">
            <li><strong>$0</strong><span>monthly Noland subscription</span></li>
            <li><strong>10–15 min</strong><span>average provisioning</span></li>
            <li><strong>~8 ms</strong><span>overhead above route latency</span></li>
          </ul>
        </div>

        <div className="hero-deck" aria-label="Noland connection architecture">
          <div className="deck-frame">
            <div className="deck-topbar">
              <div>
                <span className="deck-label">NOLAND // CONTROL DECK</span>
                <span className="deck-id">LINK_01</span>
              </div>
              <div className="signal" role="status" aria-label="System ready"><i /><i /><i /><i /></div>
            </div>

            <div className="deck-screen">
              <div className="deck-screen__grid" aria-hidden="true" />
              <div className="architecture-flow">
                {architectureNodes.map((node, index) => (
                  <div className="architecture-segment" key={node.label}>
                    <div className={`architecture-node architecture-node--${node.tone}`}>
                      <span className="architecture-node__index">0{index + 1}</span>
                      <span className="architecture-node__label">{node.label}</span>
                      <small>{node.detail}</small>
                    </div>
                    {index < architectureNodes.length - 1 ? (
                      <span className="architecture-link" aria-hidden="true"><i /><i /><i /></span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="route-readout">
                <span>ROUTE</span>
                <strong>CLIENT ↔ PROVIDER</strong>
                <em>SESSION DATA: DIRECT PATH</em>
              </div>
            </div>

            <div className="boot-sequence" aria-label="Connection sequence">
              {bootSteps.map((step, index) => (
                <div className="boot-step" key={step} style={{ "--step-delay": `${index * 0.72}s` } as CSSProperties}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                  <i aria-hidden="true" />
                </div>
              ))}
            </div>

            <div className="deck-controls" aria-hidden="true">
              <div className="dial"><span /></div>
              <div className="control-copy"><span>NETWORK</span><strong>P2P READY</strong></div>
              <div className="led-row"><i /><i /><i /></div>
              <div className="deck-key">START</div>
            </div>
          </div>
          <div className="hero-art-stamp">
            <img src="/brand/noland-icon.webp" alt="" width="74" height="74" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}
