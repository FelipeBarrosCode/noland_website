import { DownloadSection } from "./components/DownloadSection";
import { ArchitectureAndPhilosophy, ControlSection, FinalCta, GameFreedom, MetricStrip, SiteFooter } from "./components/ExperienceSections";
import { EconomicsCalculator } from "./components/EconomicsCalculator";
import { FaqSection } from "./components/FaqSection";
import { HashScroll } from "./components/HashScroll";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LatencyLab } from "./components/LatencyLab";
import { MarketplaceBrowser } from "./components/MarketplaceBrowser";
import { Navigation } from "./components/Navigation";
import { ProvisioningDemo } from "./components/ProvisioningDemo";
import { SeoLandingPage } from "./components/SeoLandingPage";
import { SeoPillarLinks } from "./components/SeoPillarLinks";
import { getFeaturePage } from "./lib/featurePages";
import { getSeoPage } from "./lib/seoPages";
import { normalizePathname } from "./lib/site";

interface AppProps {
  pathname?: string;
}

export function App({ pathname = "/" }: AppProps) {
  const normalizedPath = normalizePathname(pathname);
  const contentPage = getFeaturePage(normalizedPath) ?? getSeoPage(normalizedPath);
  if (contentPage) {
    return (
      <>
        <HashScroll />
        <SeoLandingPage page={contentPage} />
      </>
    );
  }

  return (
    <>
      <HashScroll />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navigation />
      <main id="main-content">
        <Hero />
        <MetricStrip />
        <HowItWorks />
        <section className="section home-pillars" aria-labelledby="home-pillars-title">
          <div className="shell">
            <div className="section-heading">
              <p className="eyebrow"><span aria-hidden="true">//</span> CLOUD GAMING GUIDES</p>
              <h2 id="home-pillars-title">Find the cloud gaming setup that fits you</h2>
              <p className="section-heading__description">Explore usage-based pricing, Windows, Mac, Linux and low-end-PC use cases, Vast.ai provisioning, and the Sunshine streaming stack.</p>
            </div>
            <SeoPillarLinks />
          </div>
        </section>
        <MarketplaceBrowser />
        <EconomicsCalculator />
        <GameFreedom />
        <LatencyLab />
        <ProvisioningDemo />
        <ArchitectureAndPhilosophy />
        <ControlSection />
        <DownloadSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
