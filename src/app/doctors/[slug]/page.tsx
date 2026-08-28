import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doctors } from "@/config/doctors";
import { clinic } from "@/config/clinic";
import { doctorSchema } from "@/lib/schema";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return doctors.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = doctors.find((item) => item.slug === slug);
  if (!doctor) return {};
  return {
    title: `${doctor.name} — ${doctor.specialty}`,
    description: `${doctor.name}, ${doctor.credentials}, ${doctor.specialty} at Tanvi Dental Care & Implant Centre in Mangalagiri.`,
    alternates: { canonical: `/doctors/${doctor.slug}` },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = doctors.find((item) => item.slug === slug);
  if (!doctor) notFound();

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(doctorSchema(doctor)) }} />
      <section className="inner-page-hero"><div className="container"><p className="eyebrow">Tanvi Dental Care &amp; Implant Centre</p><h1>{doctor.name}</h1><p>{doctor.credentials} · {doctor.specialty}</p></div></section>
      <section className="inner-page-section doctor-profile-page"><div className="container doctor-profile-grid">
        <div className="doctor-profile-image"><Image src={doctor.image} alt={doctor.imageAlt} width={599} height={900} priority /></div>
        <div className="doctor-profile-copy"><p className="eyebrow">Verified professional information</p><h2>{doctor.name}</h2><p className="doctor-credentials">{doctor.credentials}</p><p className="doctor-specialty">{doctor.specialty}</p><p>Dr. {doctor.name.replace(/^Dr\.\s*/, "")} is a {doctor.specialty} at Tanvi Dental Care &amp; Implant Centre.</p><p>This profile is intentionally limited to verified professional information. Treatment suitability is discussed after an individual clinical assessment.</p><div className="contact-actions"><a className="btn btn-primary" href={clinic.phoneHref}>Call {clinic.phone}</a><a className="btn btn-secondary" href={clinic.whatsappHref}>WhatsApp</a></div><Link className="back-link" href="/doctors">← Meet all doctors</Link></div>
      </div></section>
    </main>
  );
}
