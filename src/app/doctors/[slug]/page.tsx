import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic, treatments } from "@/config/clinic";
import { clinicEntityId, doctors, siteConfig } from "@/config/site";

export function generateStaticParams() {
  return doctors.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doctor = doctors.find((item) => item.slug === slug);
  if (!doctor) return { title: "Doctor Profile" };

  const description = `${doctor.name}, ${doctor.qualifications}, is presented by Tanvi Dental Care & Implant Centre in Mangalagiri as ${doctor.specialty}.`;

  return {
    title: `${doctor.name} — ${doctor.specialty} in Mangalagiri`,
    description,
    alternates: { canonical: `/doctors/${doctor.slug}` },
    openGraph: {
      title: `${doctor.name} | ${doctor.specialty} in Mangalagiri`,
      description,
      url: `/doctors/${doctor.slug}`,
      type: "profile",
      images: [{ url: doctor.image, alt: doctor.name }],
    },
  };
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor = doctors.find((item) => item.slug === slug);
  if (!doctor) notFound();

  const relatedTreatments = treatments.filter((treatment) =>
    doctor.relatedTreatmentSlugs.some((relatedSlug) => relatedSlug === treatment.slug)
  );

  const doctorUrl = `${siteConfig.url}/doctors/${doctor.slug}`;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${doctorUrl}#doctor`,
    name: doctor.name,
    url: doctorUrl,
    image: `${siteConfig.url}${doctor.image}`,
    jobTitle: doctor.specialty,
    worksFor: {
      "@id": clinicEntityId,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Doctors", item: `${siteConfig.url}/doctors` },
      { "@type": "ListItem", position: 3, name: doctor.name, item: doctorUrl },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="doctors-page">
        <section className="catalogue-page-hero">
          <div className="container">
            <p className="eyebrow">Dental specialist in Mangalagiri</p>
            <h1>{doctor.name}</h1>
            <p>{doctor.qualifications} · {doctor.specialty}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
              <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>WhatsApp</a>
            </div>
          </div>
        </section>

        <section className="detail-content">
          <div className="container detail-grid">
            <article>
              <div className="doctor-photo-wrap">
                <Image src={doctor.image} alt={doctor.name} width={599} height={900} sizes="(max-width: 820px) 100vw, 40vw" />
              </div>
            </article>
            <article>
              <p className="eyebrow">Doctor profile</p>
              <h2>{doctor.specialty} at Tanvi Dental Care.</h2>
              <p>{doctor.name} is presented by Tanvi Dental Care & Implant Centre in Mangalagiri with the qualifications {doctor.qualifications} and the specialty {doctor.specialty}.</p>
              <p>Patients can contact the clinic to request an appointment, discuss their concern and confirm which consultation or treatment pathway is appropriate after clinical assessment.</p>
              <div className="hero-actions">
                <Link className="btn btn-secondary" href="/doctors">View all doctors</Link>
              </div>
            </article>
          </div>
        </section>

        {relatedTreatments.length > 0 && (
          <section className="treatment-catalogue related-treatments">
            <div className="container">
              <div className="section-heading">
                <p className="section-mark">✦</p>
                <h2>Related Treatment Information</h2>
                <p>Explore treatment pages related to this specialist profile.</p>
              </div>
              <div className="catalogue-grid">
                {relatedTreatments.map((treatment) => (
                  <Link className="catalogue-card" href={`/treatments/${treatment.slug}`} key={treatment.slug}>
                    <span className="catalogue-icon"><ClinicIcon name={treatment.icon} size={24}/></span>
                    <div>
                      <h3>{treatment.name}</h3>
                      <p>{treatment.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter />
    </>
  );
}
