import { useState } from "react";
import { SectionHeading } from "./SectionHeading";

const PLATFORM_OVERHEAD_MS = 8;
const FIBER_KM_PER_SECOND = 200_000;
const distancePresets = [500, 1_000, 3_000, 5_000];

function formatMilliseconds(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function LatencyLab() {
  const [distanceKm, setDistanceKm] = useState(1_000);
  const oneWayFiberMs = (distanceKm / FIBER_KM_PER_SECOND) * 1_000;
  const minimumRttMs = oneWayFiberMs * 2;
  const minimumWithNolandMs = minimumRttMs + PLATFORM_OVERHEAD_MS;

  return (
    <section className="section latency-section" id="performance" aria-labelledby="latency-title">
      <div className="shell">
        <SectionHeading
          eyebrow="PERFORMANCE / ROUTE LAB"
          title={<span id="latency-title">Distance sets the floor. <em>Noland overhead sits on top.</em></span>}
          description="Light travels through modern fiber at roughly 200,000 km/s—about 5 microseconds per kilometer one way. Use the radius below to calculate the straight-line physics floor before real routing and approximately 8 ms of measured Noland overhead."
        />

        <div className="latency-lab">
          <div className="route-map">
            <div className="route-map__grid" aria-hidden="true" />
            <div className="route-endpoint route-endpoint--you"><i /><strong>YOU</strong><span>CLIENT</span></div>
            <div className="route-line" aria-hidden="true">
              <i className="route-packet route-packet--one" />
              <i className="route-packet route-packet--two" />
              <span className="route-distance">{distanceKm.toLocaleString()} KM STRAIGHT-LINE RADIUS</span>
            </div>
            <div className="route-endpoint route-endpoint--pc"><i /><strong>RTX PC</strong><span>PROVIDER</span></div>
            <div className="overhead-module">
              <span>NOLAND LAYER</span>
              <strong>~8 ms</strong>
              <small>measured overhead</small>
            </div>
          </div>

          <div className="latency-controls">
            <div className="latency-control__head"><span>DISTANCE CALCULATOR</span><i>PHYSICS FLOOR</i></div>
            <div className="physics-readout">
              <span>FIBER PROPAGATION</span>
              <strong>~200,000 km/s</strong>
              <small>≈ 5 μs per km, one way</small>
            </div>
            <label htmlFor="distance-radius">
              <span>Player-to-machine radius</span>
              <output htmlFor="distance-radius">{distanceKm.toLocaleString()} km</output>
            </label>
            <input
              id="distance-radius"
              type="range"
              min="100"
              max="5000"
              step="100"
              value={distanceKm}
              onChange={(event) => setDistanceKm(Number(event.target.value))}
            />
            <div className="distance-presets" aria-label="Distance presets">
              {distancePresets.map((distance) => (
                <button
                  key={distance}
                  type="button"
                  className={distanceKm === distance ? "is-selected" : ""}
                  aria-pressed={distanceKm === distance}
                  onClick={() => setDistanceKm(distance)}
                >
                  {distance.toLocaleString()} km
                </button>
              ))}
            </div>
            <div className="latency-equation latency-equation--distance" aria-live="polite">
              <div><span>DISTANCE</span><strong>{distanceKm.toLocaleString()} km</strong></div>
              <span aria-hidden="true">→</span>
              <div><span>FIBER RTT FLOOR</span><strong>~{formatMilliseconds(minimumRttMs)} ms</strong></div>
              <span aria-hidden="true">+</span>
              <div><span>NOLAND OVERHEAD</span><strong>~{PLATFORM_OVERHEAD_MS} ms</strong></div>
              <div className="latency-total"><span>ILLUSTRATIVE MINIMUM</span><strong>~{formatMilliseconds(minimumWithNolandMs)} ms</strong><small>{formatMilliseconds(oneWayFiberMs)} ms one way through ideal straight-line fiber</small></div>
            </div>
            <p><span aria-hidden="true">⚠</span> This is a theoretical lower bound, not expected ping. Real fiber routes are longer than straight-line distance and add routers, switching, queues, congestion, encoding, decoding, and ISP conditions.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
