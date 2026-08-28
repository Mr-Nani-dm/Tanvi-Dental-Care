import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="/" aria-label={siteConfig.name}>
          <span className="brand-name">Tanvi Dental Care</span>
          <span className="brand-subtitle">&amp; Implant Centre</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/#doctors">Doctors</a>
          <a href="/#approach">Our approach</a>
          <a href="/#location">Location</a>
          <a className="nav-cta" href="/#contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
