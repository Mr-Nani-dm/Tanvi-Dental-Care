import type { Metadata } from "next";
import { doctors } from "@/config/doctors";
import DoctorCard from "@/components/doctors/DoctorCard";

export const metadata: Metadata = {
  title: "Our Doctors",
  description: "Meet the specialist doctors at Tanvi Dental Care & Implant Centre in Mangalagiri.",
  alternates: { canonical: "/doctors" },
};

export default function DoctorsPage() {
  return (
    <main>
      <section className="inner-page-hero"><div className="container"><p className="eyebrow">Specialist-led care</p><h1>Meet Our Doctors</h1><p>Get to know the verified dental specialists at Tanvi Dental Care & Implant Centre.</p></div></section>
      <section className="inner-page-section"><div className="container"><div className="doctor-grid">{doctors.map((doctor) => <DoctorCard key={doctor.slug} doctor={doctor} />)}</div></div></section>
    </main>
  );
}
