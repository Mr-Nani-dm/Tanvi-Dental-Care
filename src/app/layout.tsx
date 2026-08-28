import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} | Mangalagiri`,
  description: "Patient-focused dental information and specialist care in Mangalagiri.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="container header-inner">
            <a className="brand" href="/" aria-label={site.name}>
              <span className="brand-mark" aria-hidden="true">T</span>
              <span><strong>Tanvi Dental Care</strong><small>& Implant Centre</small></span>
            </a>
            <nav aria-label="Primary navigation">
              <a href="#doctors">Our doctors</a><a href="#approach">Patient journey</a><a href="#location">Location</a><a className="nav-cta" href="#contact">Talk to the clinic</a>
            </nav>
            <a className="mobile-contact" href="#contact">Contact</a>
          </div>
        </header>
        {children}
        <footer className="site-footer"><div className="container footer-grid"><div><a className="brand footer-brand" href="/" aria-label={site.name}><span className="brand-mark" aria-hidden="true">T</span><span><strong>Tanvi Dental Care</strong><small>& Implant Centre</small></span></a><p>Professional enough to trust. Warm enough to approach.</p></div><div><strong>Markets</strong><p>{site.primaryMarket}<br />{site.secondaryMarkets.join(" · ")}</p></div><div><strong>Patient first</strong><p>Clear information, genuine trust evidence and a straightforward path toward consultation.</p></div></div></footer>
      </body>
    </html>
  );
}
