import { SectionHeading } from "./SectionHeading";

const faqs = [
  ["Does Noland centrally store my gameplay or session data?", "Noland is designed so gameplay and session data does not need to be stored on centralized Noland servers. The client uses marketplace and provisioning services, then interacts directly with the rented machine. This describes the architecture; it is not a blanket security guarantee."],
  ["What does it cost?", "Noland has a $0 monthly subscription. Marketplace compute is commonly in an overall typical range of $0.10–$0.40 per hour, depending on configuration, provider, and live supply. Check Vast for the current exact price before renting."],
  ["Is there a subscription or pricing tier?", "No. Noland does not have a monthly subscription or fake feature tiers. You continue to pay the marketplace provider for an instance while that instance is running."],
  ["Does it really support 300K+ games?", "The 300K+ figure refers to the broader compatible PC/Linux ecosystem, not a promise that every title works. Compatibility varies. Anti-cheat, Windows-only functionality, launchers, or individual games may not work in the Linux gaming environment."],
  ["Which stores and launchers can I use?", "It is a PC rather than a fixed catalog, so compatible PC stores, launchers, and software can be used. Exact functionality varies by application and by Linux compatibility."],
  ["Is latency approximately 8 ms total?", "No. Approximately 8 ms is measured Noland platform and networking overhead above the natural route latency between you and the provider. Your total experience also depends on distance, internet routing, ISP conditions, encoding, and hardware."],
  ["Which operating systems run the Noland desktop client?", "Noland supports Windows, macOS, and Linux desktop clients. Mobile and browser clients are not listed as supported."],
  ["How long does provisioning take?", "Provisioning averages about 10–15 minutes. Noland prepares access, starts the instance, configures the NVIDIA stack, Sunshine, and the WireGuard/network path, then marks the stream ready."],
  ["How long can I keep playing?", "Noland does not impose an artificial session duration limit. You can stay connected as long as desired, subject to marketplace availability, your running instance, and provider conditions."],
  ["Am I billed if I leave the machine inactive?", "Marketplace billing can continue for as long as the rented instance remains running—even if you are not actively playing. Stop the machine when you are done."],
  ["Which RTX GPUs are available?", "The browser spans RTX 20 through RTX 50 generation hardware. Exact models, locations, prices, and supply change with independent marketplace providers and are never guaranteed."],
  ["Do I need a Vast.ai account?", "Yes. You need your own Vast.ai marketplace account and API key. Your account remains yours, and Vast continues to handle provider access and compute billing."],
  ["How much configuration is required?", "Minimal server configuration is the goal: select an offer and Noland automates the gaming and networking environment. You still choose hardware and location, provide your API key, sign into compatible stores, and stop the instance when finished."],
];

export function FaqSection() {
  return (
    <section className="section faq-section" id="faq" aria-labelledby="faq-title">
      <div className="shell faq-layout">
        <div className="faq-intro">
          <SectionHeading
            eyebrow="OPERATOR MANUAL"
            title={<span id="faq-title">Questions before <em>you connect.</em></span>}
            description="Straight answers about cost, compatibility, provisioning, data flow, and the rented hardware model."
          />
          <div className="faq-side-note">
            <span>STILL EXPLORING?</span>
            <p>Inspect the source, releases, and current Vast marketplace before you provision.</p>
            <a href="https://github.com/FelipeBarrosCode/no_land" target="_blank" rel="noreferrer">Open repository ↗</a>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{question}</strong><i aria-hidden="true" /></summary>
              <div><p>{answer}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
