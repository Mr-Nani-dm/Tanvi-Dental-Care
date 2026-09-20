import { clinicHours } from "@/config/clinic";

export default function ClinicHours() {
  return (
    <section className="clinic-hours" id="opening-hours" aria-labelledby="opening-hours-title">
      <h3 id="opening-hours-title">Opening hours <span>(IST)</span></h3>
      <dl>
        {clinicHours.map((group) => (
          <div key={group.label}>
            <dt>{group.shortLabel}</dt>
            <dd>{group.displayHours}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
