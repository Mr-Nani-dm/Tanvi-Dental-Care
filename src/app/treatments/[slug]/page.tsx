import type { Metadata } from "next";
import Link from "next/link";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic, treatments } from "@/config/clinic";

export function generateStaticParams() {
  return treatments.map((treatment) => ({ slug: treatment.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const treatment = treatments.find((item) => item.slug === slug);
  if (!treatment) return { title: "Treatment" };
  return {
    title: treatment.name,
    description: `${treatment.name} information from Tanvi Dental Care & Implant Centre in Mangalagiri. Suitability is confirmed after clinical assessment.`,
  };
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const treatment = treatments.find((item) => item.slug === slug);

  if (!treatment) {
    return <main className="not-found-page"><div className="container"><h1>Treatment not found</h1><Link className="btn btn-primary" href="/treatments">View all treatments</Link></div></main>;
  }

  return (
    <main className="treatment-detail-page">
      <section className="catalogue-page-hero">
        <div className="container">
          <p className="eyebrow">Treatment information</p>
          <div className="treatment-detail-icon"><ClinicIcon name={treatment.icon} size={34}/></div>
          <h1>{treatment.name}</h1>
          <p>{treatment.description}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
            <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>Ask on WhatsApp</a>
          </div>
        </div>
      </section>
      <section className="detail-content">
        <div className="container detail-grid">
          <article>
            <p className="eyebrow">What to expect</p>
            <h2>Assessment comes first.</h2>
            <p>Dental treatment is individual. The dentist will examine your teeth, gums and overall oral-health needs before recommending an appropriate option.</p>
            <p>During consultation, you can discuss your symptoms or goals, available treatment approaches, expected visits and after-care. The final plan depends on clinical findings.</p>
          </article>
          <aside className="detail-callout">
            <h2>Have questions?</h2>
            <p>Call or WhatsApp the clinic to request an appointment and confirm availability.</p>
            <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call the clinic</a>
          </aside>
        </div>
      </section>
      <section className="treatment-catalogue related-treatments">
        <div className="container">
          <div className="section-heading"><p className="section-mark">✦</p><h2>Explore other treatments</h2></div>
          <div className="catalogue-grid">
            {treatments.filter((item) => item.slug !== treatment.slug).slice(0, 3).map((item) => (
              <Link className="catalogue-card" href={`/treatments/${item.slug}`} key={item.slug}>
                <span className="catalogue-icon"><ClinicIcon name={item.icon} size={24}/></span><div><h3>{item.name}</h3><p>{item.description}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
