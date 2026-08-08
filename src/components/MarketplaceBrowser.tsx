import { useState } from "react";
import { SectionHeading } from "./SectionHeading";

type HardwareOption = {
  generation: string;
  model: string;
  vram: string;
  location: string;
  route: string;
  availability: string;
  supply: "OPEN" | "VARIABLE" | "LIMITED";
};

const hardware: HardwareOption[] = [
  { generation: "RTX 20", model: "RTX 2080 Ti", vram: "11 GB", location: "Choose a live offer", route: "Estimate per listing", availability: "Check marketplace", supply: "VARIABLE" },
  { generation: "RTX 30", model: "RTX 3080", vram: "10 GB", location: "Choose a live offer", route: "Estimate per listing", availability: "Check marketplace", supply: "VARIABLE" },
  { generation: "RTX 40", model: "RTX 4090", vram: "24 GB", location: "Choose a live offer", route: "Estimate per listing", availability: "Check marketplace", supply: "VARIABLE" },
  { generation: "RTX 50", model: "RTX 5090", vram: "32 GB", location: "Choose a live offer", route: "Estimate per listing", availability: "Check marketplace", supply: "VARIABLE" },
];

export function MarketplaceBrowser() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const selected = hardware[selectedIndex];

  return (
    <section className="section marketplace-section" id="hardware" aria-labelledby="hardware-title">
      <div className="shell">
        <SectionHeading
          eyebrow="HARDWARE MARKETPLACE"
          title={<span id="hardware-title">Choose the GPU. <em>Choose the route.</em></span>}
          description="Noland opens access to independent Vast providers across RTX generations. Inventory, location, and configuration change continuously."
        />

        <div className="market-browser">
          <div className="market-toolbar">
            <div className="market-title"><i aria-hidden="true" /><span>OFFER_BROWSER</span><small>REPRESENTATIVE VIEW — NOT LIVE INVENTORY</small></div>
            <div className="market-range"><span>TYPICAL OVERALL RANGE</span><strong>$0.10–$0.40/hr</strong><small>configuration dependent</small></div>
          </div>

          <div className="market-layout">
            <div className="generation-picker" role="group" aria-label="Select GPU generation">
              <span className="picker-label">GPU GENERATION</span>
              {hardware.map((item, index) => (
                <button
                  type="button"
                  key={item.generation}
                  className={index === selectedIndex ? "is-selected" : ""}
                  aria-pressed={index === selectedIndex}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span>{item.generation}</span>
                  <small>{index === 0 ? "TURING" : index === 1 ? "AMPERE" : index === 2 ? "ADA" : "BLACKWELL"}</small>
                  <i aria-hidden="true" />
                </button>
              ))}
              <div className="generation-range" aria-label="Supported range">
                <span>RTX 20</span><i /><span>RTX 50</span>
              </div>
            </div>

            <div className="offer-table" aria-live="polite">
              <div className="offer-table__head"><span>SELECTED CLASS</span><span>EXAMPLE LISTING FIELDS</span></div>
              <div className="offer-main">
                <div className="gpu-board" aria-hidden="true">
                  <span className="gpu-chip">RTX</span>
                  <i className="gpu-fan gpu-fan--one" />
                  <i className="gpu-fan gpu-fan--two" />
                  <span className="gpu-pins" />
                </div>
                <div>
                  <p>REPRESENTATIVE GPU</p>
                  <h3>{selected.model}</h3>
                  <span className={`supply supply--${selected.supply.toLowerCase()}`}><i /> {selected.supply} SUPPLY</span>
                </div>
              </div>
              <dl className="offer-fields">
                <div><dt>VRAM</dt><dd>{selected.vram}</dd></div>
                <div><dt>LOCATION</dt><dd>{selected.location}</dd></div>
                <div><dt>ROUTE</dt><dd>{selected.route}</dd></div>
                <div><dt>AVAILABILITY</dt><dd>{selected.availability}</dd></div>
              </dl>
              <div className="market-disclaimer">
                <span aria-hidden="true">⚠</span>
                <p><strong>Supply is live, not guaranteed.</strong> These fields illustrate how choices differ; check the marketplace for current machines and exact pricing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
