import { ArchitectureAndPhilosophy, ControlSection, FinalCtaAndFooter, GameFreedom, MetricStrip } from "./components/ExperienceSections";
import { EconomicsCalculator } from "./components/EconomicsCalculator";
import { FaqSection } from "./components/FaqSection";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LatencyLab } from "./components/LatencyLab";
import { MarketplaceBrowser } from "./components/MarketplaceBrowser";
import { Navigation } from "./components/Navigation";
import { ProvisioningDemo } from "./components/ProvisioningDemo";

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content">
        <Hero />
        <MetricStrip />
        <HowItWorks />
        <MarketplaceBrowser />
        <EconomicsCalculator />
        <GameFreedom />
        <LatencyLab />
        <ProvisioningDemo />
        <ArchitectureAndPhilosophy />
        <ControlSection />
        <FaqSection />
        <FinalCtaAndFooter />
      </main>
    </>
  );
}
