import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic } from "@/config/clinic";
import { doctors } from "@/config/site";

export const metadata: Metadata = {
  title: "Dental Specialists in Mangalagiri",
  description: "Meet Dr. Naga Swathi Pokala, Oral & Maxillofacial Surgeon, and Dr. Prathap Naidu, Endodontist, at Tanvi Dental Care & Implant Centre in Mangalagiri.",
  alternates: { canonical: "/doctors" },
  openGraph: {
    title: "Dental Specialists in Mangalagiri | Tanvi Dental Care",
    description: "Meet the specialist dental team at Tanvi Dental Care & Implant Centre in Mangalagiri.",
    url: "/doctors",
    type: "website",
  },
};

export default function DoctorsPage() {
  return (
    <main className="doctors-page">
      <section className="catalogue-page-hero">
        <div className="container">
          <p className="eyebrow">Specialist-led dental care</p>
          <h1>Meet Our Doctors</h1>
          <p>Get to know the clinicians presented by Tanvi Dental Care & Implant Centre.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
            <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>WhatsApp</a>
          </div>
        </div>
      </section>
      <section className="doctors-section">
        <div className="container">
          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <article className="doctor-card doctor-card-photo" key={doctor.name}>
                <div className="doctor-photo-wrap"><Image src={doctor.image} alt={doctor.name} width={599} height={900} sizes="(max-width: 680px) 100vw, (max-width: 820px) 680px, 40vw" /></div>
                <div className="doctor-details">
                  <h2>{doctor.name}</h2>
                  <p>{doctor.qualifications}</p>
                  <strong>{doctor.specialty}</strong>
                  <Link className="view-all" href={`/doctors/${doctor.slug}`}>View profile <ClinicIcon name="arrow" size={15}/></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
