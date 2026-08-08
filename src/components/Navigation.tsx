import { useState } from "react";

const RELEASE_URL = "https://github.com/FelipeBarrosCode/no_land/releases/tag/main-latest";
const REPOSITORY_URL = "https://github.com/FelipeBarrosCode/no_land";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="site-header">
      <nav className="site-nav shell" aria-label="Primary navigation">
        <a className="brand-lockup" href="#top" onClick={closeMenu}>
          <img src="./brand/noland-icon.png" alt="" width="40" height="40" />
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
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#hardware" onClick={closeMenu}>Hardware</a>
            <a href="#performance" onClick={closeMenu}>Performance</a>
            <a href="#faq" onClick={closeMenu}>FAQ</a>
          </div>
          <div className="nav-actions">
            <a className="button button--ghost button--small" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <a className="button button--primary button--small" href={RELEASE_URL} target="_blank" rel="noreferrer">
              Get Noland <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
