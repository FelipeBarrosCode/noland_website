import { useEffect, useState } from "react";
import { detectNavigatorOperatingSystem, type DesktopOperatingSystem } from "../lib/clientPlatform";
import { DOWNLOADS_SECTION_ID, REPOSITORY_URL } from "../lib/siteLinks";

const platformGuides: Record<DesktopOperatingSystem, { href: string; label: string }> = {
  Windows: { href: "/cloud-gaming-windows/", label: "For Windows" },
  macOS: { href: "/cloud-gaming-mac/", label: "For Mac" },
  Linux: { href: "/cloud-gaming-linux/", label: "For Linux" },
  Unknown: { href: "/cloud-gaming-pc/", label: "For your device" },
};

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [platformGuide, setPlatformGuide] = useState(platformGuides.Unknown);

  useEffect(() => {
    setPlatformGuide(platformGuides[detectNavigatorOperatingSystem()]);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="site-header">
      <nav className="site-nav shell" aria-label="Primary navigation">
        <a className="brand-lockup" href="/#top" onClick={closeMenu}>
          <img src="/brand/noland-icon.webp" alt="" width="40" height="40" />
          <span>NOLAND</span>
          <span className="brand-status">P2P</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="primary-menu"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="menu-toggle__icon" aria-hidden="true"><i /><i /><i /></span>
          <span className="sr-only">{isOpen ? "Close navigation" : "Open navigation"}</span>
        </button>

        <div className={`nav-menu${isOpen ? " is-open" : ""}`} id="primary-menu">
          <div className="nav-links">
            <a href="/cloud-gaming-pc/" onClick={closeMenu}>Cloud gaming PC</a>
            <a href="/pay-as-you-go-cloud-gaming/" onClick={closeMenu}>Pay as you go</a>
            <a href={platformGuide.href} onClick={closeMenu}>{platformGuide.label}</a>
            <a href="/#how-it-works" onClick={closeMenu}>How it works</a>
            <a href={`/#${DOWNLOADS_SECTION_ID}`} onClick={closeMenu}>Downloads</a>
          </div>
          <div className="nav-actions">
            <a className="button button--ghost button--small" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <a className="button button--primary button--small" href={`/#${DOWNLOADS_SECTION_ID}`} onClick={closeMenu}>
              Get Noland <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
