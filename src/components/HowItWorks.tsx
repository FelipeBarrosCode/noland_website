import { SectionHeading } from "./SectionHeading";

const steps = [
  { number: "01", title: "Connect", body: "Add your Vast.ai API key. Your marketplace account stays yours." },
  { number: "02", title: "Choose", body: "Browse available GPUs and choose hardware and location." },
  { number: "03", title: "Provision", body: "Noland rents and configures the Linux streaming machine." },
  { number: "04", title: "Play", body: "Open the direct stream and use your compatible stores and games." },
];

const keyPermissions = [
  ["DISCOVER", "Read current marketplace offers"],
  ["PROVISION", "Create the instance you select"],
  ["MANAGE", "Start, monitor, and stop its lifecycle"],
  ["CONFIGURE", "Prepare the gaming and streaming environment"],
];

export function HowItWorks() {
  return (
    <section className="section process-section" id="how-it-works" aria-labelledby="process-title">
      <div className="shell">
        <SectionHeading
          eyebrow="FROM MARKETPLACE TO GAME"
          title={<span id="process-title">How Noland Cloud Gaming Works. <em>Four steps to your machine.</em></span>}
          description="Noland handles orchestration between your desktop and a rented marketplace PC—without adding an artificial play-session timer."
        />

        <ol className="process-rail">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="process-number">{step.number}</div>
              <div className="process-icon" aria-hidden="true"><span>{["⌁", "▦", "⇣", "▶"][index]}</span></div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {index < steps.length - 1 ? <span className="rail-connector" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>

        <div className="process-specs" aria-label="Setup specifications">
          <div><span>AVERAGE SETUP</span><strong>10–15 MIN</strong></div>
          <div><span>DESKTOP CLIENTS</span><strong>macOS / Windows / Linux</strong></div>
          <div><span>SESSION LIMIT</span><strong>NONE ARTIFICIAL</strong></div>
        </div>

        <div className="api-key-panel">
          <div className="api-key-copy">
            <p className="panel-kicker">VAST.AI HANDSHAKE</p>
            <h3>Why does Noland need an API key?</h3>
            <p>
              The client uses your key to act on your behalf in the Vast marketplace. It is the bridge that lets Noland find supply, rent your choice, and manage only the instance lifecycle needed for your session.
            </p>
            <div className="key-note">
              <span aria-hidden="true">!</span>
              <p><strong>Your marketplace account remains yours.</strong> Vast handles marketplace access and billing; Noland does not replace that relationship.</p>
            </div>
            <div className="inline-links">
              <a href="https://cloud.vast.ai/" target="_blank" rel="noreferrer">Create Vast account ↗</a>
              <a href="https://cloud.vast.ai/manage-keys/?tab=api-keys" target="_blank" rel="noreferrer">Manage API keys ↗</a>
            </div>
          </div>
          <div className="api-permissions" aria-label="API key uses">
            <div className="permission-header"><span>KEY_SCOPE</span><span>REASON</span><span>STATE</span></div>
            {keyPermissions.map(([name, reason]) => (
              <div className="permission-row" key={name}>
                <span className="permission-code">{name}</span>
                <span>{reason}</span>
                <span className="permission-state"><i aria-hidden="true" /> USED</span>
              </div>
            ))}
            <div className="key-visual" aria-hidden="true"><span>••••</span><span>••••</span><span>••••</span><i>KEY</i></div>
          </div>
        </div>
      </div>
    </section>
  );
}
