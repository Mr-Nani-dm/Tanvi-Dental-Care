import Link from "next/link";
import Image from "next/image";
import type { Doctor } from "@/config/doctors";

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="doctor-card doctor-card-photo">
      <Link href={`/doctors/${doctor.slug}`} aria-label={`View profile of ${doctor.name}`}>
        <div className="doctor-photo-wrap">
          <Image src={doctor.image} alt={doctor.imageAlt} width={599} height={900} loading="lazy" />
        </div>
      </Link>
      <div className="doctor-details">
        <h3>{doctor.name}</h3>
        <p>{doctor.credentials}</p>
        <strong>{doctor.specialty}</strong>
        <Link className="doctor-profile-link" href={`/doctors/${doctor.slug}`}>View profile →</Link>
      </div>
    </article>
  );
}
