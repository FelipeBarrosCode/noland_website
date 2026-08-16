import { useState } from "react";
import { SectionHeading } from "./SectionHeading";

export function EconomicsCalculator() {
  const [hours, setHours] = useState(20);
  const [hourly, setHourly] = useState(0.2);
  const estimate = (hours * hourly).toFixed(2);

  return (
    <section className="section economics-section" aria-labelledby="economics-title">
      <div className="shell">
        <SectionHeading
          eyebrow="NO SUBSCRIPTION ECONOMICS"
          title={<span id="economics-title">Pay as you go. <em>Not every month.</em></span>}
          description="Noland has no monthly subscription. Your chosen marketplace instance is billed by the provider while it remains running."
        />

        <div className="economics-grid">
          <div className="comparison-split">
            <article className="comparison-side comparison-side--traditional">
              <div className="comparison-label">TRADITIONAL CLOUD GAMING</div>
              <div className="comparison-price"><span>$</span><strong>MONTHLY</strong></div>
              <ul>
                <li><i aria-hidden="true">×</i> Recurring platform plan</li>
                <li><i aria-hidden="true">×</i> Hardware options set by platform</li>
                <li><i aria-hidden="true">×</i> Catalog or session constraints may apply</li>
              </ul>
            </article>
            <div className="comparison-vs" aria-hidden="true"><span>VS</span></div>
            <article className="comparison-side comparison-side--noland">
              <div className="comparison-label">NOLAND</div>
              <div className="comparison-price"><span>$</span><strong>0</strong><small>/ MONTH NOLAND</small></div>
              <ul>
                <li><i aria-hidden="true">✓</i> Choose marketplace hardware</li>
                <li><i aria-hidden="true">✓</i> Use compatible stores and games</li>
                <li><i aria-hidden="true">✓</i> No artificial session duration limit</li>
              </ul>
            </article>
          </div>

          <aside className="cost-calculator" aria-labelledby="calculator-title">
            <div className="calculator-topline"><span>ESTIMATE MODULE</span><i>USER INPUT</i></div>
            <h3 id="calculator-title">Compute session estimate</h3>
            <p>Set your own generic hourly value. This is not a quote or a price for any specific GPU.</p>

            <label htmlFor="hours-range"><span>HOURS / MONTH</span><output htmlFor="hours-range">{hours} h</output></label>
            <input id="hours-range" type="range" min="1" max="100" step="1" value={hours} onChange={(event) => setHours(Number(event.target.value))} />

            <label htmlFor="rate-range"><span>ASSUMED HOURLY VALUE</span><output htmlFor="rate-range">${hourly.toFixed(2)}</output></label>
            <input id="rate-range" type="range" min="0.1" max="0.4" step="0.01" value={hourly} onChange={(event) => setHourly(Number(event.target.value))} />

            <div className="estimate-readout">
              <span>ESTIMATED COMPUTE</span>
              <strong>${estimate}</strong>
              <small>{hours} hours × ${hourly.toFixed(2)}/hr</small>
            </div>
            <p className="estimate-warning"><span aria-hidden="true">!</span> Estimate only. Actual marketplace configuration, price, and availability vary. Stop the machine when finished—billing can continue while an instance runs, even if inactive.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
