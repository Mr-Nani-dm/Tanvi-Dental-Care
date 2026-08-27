import { DoctorCard } from "@/components/trust/DoctorCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site";

const journey = [
  ["01", "Understand", "Clear educational information can help patients make sense of a concern without diagnosing it."],
  ["02", "Build trust", "Verified specialist information and genuine clinic evidence should make the next step easier to evaluate."],
  ["03", "Consider", "Patients can explore relevant treatment information and prepare questions for a professional."],
  ["04", "Consult", "When contact details are verified, Phone / WhatsApp can provide a direct path to consultation."],
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Dental care in {site.primaryMarket}</p>
            <h1>A calmer way to understand your dental next step.</h1>
            <p className="lede">Patient-focused information, specialist context and a clear path toward professional consultation — without pretending a website can diagnose you.</p>
            <div className="actions">
              <a className="button button-primary" href="#contact">Explore your next step</a>
              <a className="button button-secondary" href="#doctors">Meet the specialists</a>
            </div>
          </div>
          <aside className="trust-panel" aria-labelledby="hero-trust-title">
            <p className="eyebrow">Verified specialist information</p>
            <h2 id="hero-trust-title">Meet the clinical team</h2>
            {site.doctors.map((doctor) => <div key={doctor.name} className="card" style={{ marginTop: "1rem" }}><h3>{doctor.name}</h3><p className="doctor-credentials">{doctor.qualifications}</p><p>{doctor.specialty}</p></div>)}
          </aside>
        </div>
      </section>

      <section id="approach" className="section">
        <div className="container">
          <SectionHeading eyebrow="The patient journey" title="From uncertainty to a more informed conversation." description="The website should help patients understand their concern, evaluate trustworthy information, consider relevant options and reach the clinic when they are ready." />
          <div className="cards">
            {journey.map(([number, title, text]) => <article className="card" key={number}><p className="eyebrow">{number}</p><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="doctors" className="section section-subtle">
        <div className="container">
          <SectionHeading eyebrow="Clinical team" title="Specialist information, presented plainly." description="Only business-provided professional information currently approved for use is shown. Additional credentials require verification." />
          <div className="doctor-grid">{site.doctors.map((doctor) => <DoctorCard key={doctor.name} doctor={doctor} />)}</div>
        </div>
      </section>

      <section id="location" className="section">
        <div className="container">
          <SectionHeading eyebrow="Local relevance" title="Rooted in Mangalagiri." description="Mangalagiri is the primary market, with Vijayawada and Guntur identified as secondary markets. Exact clinic address, directions and service-area details remain locked until business verification." />
          <div className="cards"><article className="card"><h3>Primary</h3><p>Mangalagiri</p></article><article className="card"><h3>Secondary</h3><p>Vijayawada · Guntur</p></article></div>
        </div>
      </section>

      <section id="contact" className="section section-subtle">
        <div className="container">
          <SectionHeading eyebrow="Consultation" title="Have questions? The next step is a professional conversation." description="Phone and WhatsApp pathways will be enabled once the clinic confirms the relevant contact details. No contact information is fabricated here." />
          <div className="actions"><span className="button button-secondary" aria-disabled="true">Phone — verification required</span><span className="button button-secondary" aria-disabled="true">WhatsApp — verification required</span></div>
        </div>
      </section>
    </>
  );
}
