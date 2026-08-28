import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.name,
  description:
    "Patient-focused dental care information for Tanvi Dental Care & Implant Centre.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="container header-inner">
            <a className="brand" href="/" aria-label={site.name}>
              <span className="brand-name">Tanvi Dental Care</span>
              <span className="brand-subtitle">& Implant Centre</span>
            </a>
            <nav aria-label="Primary navigation">
              <a href="#doctors">Doctors</a>
              <a href="#approach">Our approach</a>
              <a href="#location">Location</a>
              <a className="nav-cta" href="#contact">Contact</a>
            </nav>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <div>
              <strong>{site.name}</strong>
              <p>Patient-focused dental information and consultation pathways.</p>
            </div>
            <p>Primary market: {site.primaryMarket}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
