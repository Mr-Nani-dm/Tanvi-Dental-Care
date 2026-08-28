import Link from "next/link";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic } from "@/config/clinic";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="container">
        <p className="eyebrow">Tanvi Dental Care & Implant Centre</p>
        <h1>That page could not be found.</h1>
        <p>Let's get you back to the clinic information, treatments and appointment options.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/">Go to homepage</Link>
          <Link className="btn btn-secondary" href="/treatments">View treatments</Link>
          <a className="btn btn-secondary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
        </div>
      </div>
    </main>
  );
}
