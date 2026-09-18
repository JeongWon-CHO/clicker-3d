import "./SiteHeader.css";

export function SiteHeader() {
  return (
    <header className="header">
      <a className="wordmark" href="./" aria-label="Clicker 홈">
        <span className="brand-icon" />
        Clicker<span className="brand-dot">.</span>
      </a>
    </header>
  );
}
