import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>{siteConfig.name}</strong>
          <p>Patient-focused dental information and consultation pathways.</p>
        </div>
        <p>Primary market: {siteConfig.markets.primary}</p>
      </div>
    </footer>
  );
}
