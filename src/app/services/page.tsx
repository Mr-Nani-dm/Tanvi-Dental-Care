import type { Metadata } from "next";
import { treatments } from "@/config/clinic";

export const metadata: Metadata = {
  title: "Dental Treatment Guide",
  description: "Explore the dental treatment areas presented by Tanvi Dental Care & Implant Centre for patient guidance.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <main><section className="inner-page-hero"><div className="container"><p className="eyebrow">Patient guidance</p><h1>Dental Treatment Guide</h1><p>Explore the treatment areas currently presented on the Tanvi website. Suitability and availability are confirmed after clinical assessment.</p></div></section><section className="inner-page-section"><div className="container"><div className="catalogue-grid">{treatments.map((treatment) => <article className="catalogue-card" key={treatment.name}><div><h2>{treatment.name}</h2><p>{treatment.description}</p></div></article>)}</div><p className="catalogue-note">Treatment information is educational and does not replace a dental examination or diagnosis.</p></div></section></main>;
}
