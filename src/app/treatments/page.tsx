import Link from "next/link";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic, treatments } from "@/config/clinic";

export const metadata = {
  title: "Dental Treatments",
  description: "Explore the dental treatment areas presented by Tanvi Dental Care & Implant Centre in Mangalagiri.",
};

export default function TreatmentsPage() {
  return (
    <main className="catalogue-page">
      <section className="catalogue-page-hero">
        <div className="container">
          <p className="eyebrow">Tanvi Dental Care & Implant Centre</p>
          <h1>Dental Treatments</h1>
          <p>Explore the clinic's verified treatment catalogue. Treatment suitability is confirmed after clinical assessment.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
            <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>WhatsApp</a>
          </div>
        </div>
      </section>
      <section className="treatment-catalogue">
        <div className="container">
          <div className="catalogue-grid">
            {treatments.map((treatment) => (
              <Link className="catalogue-card" href={`/treatments/${treatment.slug}`} key={treatment.slug}>
                <span className="catalogue-icon"><ClinicIcon name={treatment.icon} size={25}/></span>
                <div><h2>{treatment.name}</h2><p>{treatment.description}</p><span className="view-all">Learn more <ClinicIcon name="arrow" size={15}/></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
