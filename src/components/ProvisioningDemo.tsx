import { useEffect, useState } from "react";
import { SectionHeading } from "./SectionHeading";

const stages = [
  { name: "Marketplace", code: "OFFER", detail: "Selected provider offer" },
  { name: "SSH key", code: "AUTH", detail: "Install access key" },
  { name: "Instance", code: "BOOT", detail: "Start rented machine" },
  { name: "NVIDIA", code: "GPU", detail: "Prepare graphics stack" },
  { name: "Sunshine", code: "STREAM", detail: "Configure stream host" },
  { name: "WireGuard", code: "ROUTE", detail: "Establish network path" },
  { name: "Stream ready", code: "PLAY", detail: "Connect desktop client" },
];

export function ProvisioningDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, stages.length - 1));
    }, 1300);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (activeStage === stages.length - 1) setIsPlaying(false);
  }, [activeStage]);

  const restart = () => {
    setActiveStage(0);
    setIsPlaying(true);
  };

  return (
    <section className="section provisioning-section" aria-labelledby="provisioning-title">
      <div className="shell">
        <SectionHeading
          eyebrow="AUTOMATED PROVISIONING"
          title={<span id="provisioning-title">Marketplace in. <em>Stream-ready PC out.</em></span>}
          description="Noland turns the machine you selected into a configured Linux gaming endpoint. Average setup is approximately 10–15 minutes."
        />

        <div className="provision-console">
          <div className="console-header">
            <div><i /><i /><i /><span>PROVISIONER // SESSION_01</span></div>
            <div className="console-controls">
              <button type="button" onClick={() => setIsPlaying((current) => !current)} aria-label={isPlaying ? "Pause provisioning demo" : "Play provisioning demo"}>
                {isPlaying ? "Ⅱ PAUSE" : "▶ PLAY"}
              </button>
              <button type="button" onClick={restart}>↻ RESTART</button>
            </div>
          </div>

          <div className="provision-body">
            <div className="provision-flow" aria-label="Provisioning progress" aria-live="polite">
              <div className="provision-phase provision-phase--market"><span>01</span><strong>MARKETPLACE</strong><small>offer selected</small></div>
              <span className="phase-arrow" aria-hidden="true">→</span>
              <div className="provision-phase provision-phase--work"><span>02</span><strong>PROVISIONING</strong><small>{stages[Math.max(1, activeStage)].name}</small></div>
              <span className="phase-arrow" aria-hidden="true">→</span>
              <div className={`provision-phase provision-phase--play${activeStage === stages.length - 1 ? " is-ready" : ""}`}><span>03</span><strong>PLAY</strong><small>{activeStage === stages.length - 1 ? "stream ready" : "stand by"}</small></div>
            </div>

            <ol className="stage-list">
              {stages.map((stage, index) => {
                const state = index < activeStage ? "is-complete" : index === activeStage ? "is-active" : "";
                return (
                  <li className={state} key={stage.name}>
                    <button type="button" onClick={() => { setActiveStage(index); setIsPlaying(false); }}>
                      <span className="stage-marker">{index < activeStage ? "✓" : String(index + 1).padStart(2, "0")}</span>
                      <span className="stage-code">{stage.code}</span>
                      <strong>{stage.name}</strong>
                      <small>{stage.detail}</small>
                      <i aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="console-output" aria-hidden="true">
              <div><span>&gt;</span> noland provision --offer selected</div>
              {stages.slice(0, activeStage + 1).map((stage, index) => (
                <div key={stage.code} className={index === activeStage ? "current" : "done"}><span>{index === activeStage ? "▸" : "✓"}</span> {stage.code.toLowerCase()}: {index === activeStage && activeStage < stages.length - 1 ? "working..." : "ready"}</div>
              ))}
            </div>
          </div>
          <div className="console-footer"><span>AVERAGE PIPELINE</span><strong>10–15 MIN</strong><i>MANAGED LINUX SETUP</i></div>
        </div>
      </div>
    </section>
  );
}
