import type { Metadata } from "next";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic } from "@/config/clinic";

export const metadata: Metadata = {
  title: "Our Doctors",
  description: "Meet the specialist dental team at Tanvi Dental Care & Implant Centre in Mangalagiri.",
};

const doctors = [
  { name: "Dr. Naga Swathi Pokala", qualification: "BDS, MDS", specialty: "Oral & Maxillofacial Surgeon", image: "/images/doctors/naga-swathi.jpeg", alt: "Dr. Naga Swathi Pokala" },
  { name: "Dr. Prathap Naidu", qualification: "BDS, MDS", specialty: "Endodontist", image: "/images/doctors/pratap-naidu.jpeg", alt: "Dr. Prathap Naidu" },
] as const;

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
                <div className="doctor-photo-wrap"><img src={doctor.image} alt={doctor.alt} width="599" height="900" /></div>
                <div className="doctor-details"><h2>{doctor.name}</h2><p>{doctor.qualification}</p><strong>{doctor.specialty}</strong></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
