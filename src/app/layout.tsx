import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} | Mangalagiri`,
  description: "Patient-first dental information and verified specialist information for Tanvi Dental Care & Implant Centre in Mangalagiri.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="container header-inner">
            <a className="brand" href="/" aria-label={siteConfig.name}>
              <span className="brand-mark" aria-hidden="true">T</span>
              <span><strong>Tanvi Dental Care</strong><small>& Implant Centre</small></span>
            </a>
            <nav aria-label="Primary navigation">
              <a href="#start">Start here</a>
              <a href="#doctors">Doctors</a>
              <a href="#services">Treatment info</a>
              <a href="#location">Location</a>
              <a className="nav-cta" href="#contact">Contact</a>
            </nav>
            <details className="mobile-menu">
              <summary aria-label="Open navigation">Menu</summary>
              <div className="mobile-menu-panel">
                <a href="#start">Start here</a><a href="#doctors">Doctors</a><a href="#services">Treatment info</a><a href="#location">Location</a><a href="#contact">Contact</a>
              </div>
            </details>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container footer-layout">
            <div><a className="brand footer-brand" href="/" aria-label={siteConfig.name}><span className="brand-mark" aria-hidden="true">T</span><span><strong>Tanvi Dental Care</strong><small>& Implant Centre</small></span></a><p>{siteConfig.positioning}</p></div>
            <div><span className="footer-label">Markets</span><p>{siteConfig.markets.primary}<br />{siteConfig.markets.secondary.join(" · ")}</p></div>
            <div><span className="footer-label">Content boundary</span><p>Business facts and clinical information are published only after the appropriate verification.</p></div>
          </div>
          <div className="container footer-bottom"><span>© {new Date().getFullYear()} Tanvi Dental Care & Implant Centre</span><span>Patient-first · Evidence-led · Accessible</span></div>
        </footer>
      </body>
    </html>
  );
}
