import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>{site.name}</strong>
          <p>Patient-focused dental information and consultation pathways.</p>
        </div>
        <p>Primary market: {site.primaryMarket}</p>
      </div>
    </footer>
  );
}
