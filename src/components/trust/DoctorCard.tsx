type Doctor = {
  name: string;
  qualifications: string;
  specialty: string;
};

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="doctor-card">
      <div className="doctor-card-mark" aria-hidden="true">TS</div>
      <div>
        <p className="eyebrow">Verified professional information</p>
        <h3>{doctor.name}</h3>
        <p className="doctor-credentials">{doctor.qualifications}</p>
        <p>{doctor.specialty}</p>
      </div>
    </article>
  );
}
