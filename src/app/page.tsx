import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Dental care in {site.primaryMarket}</p>
            <h1>Understand your dental concern before your next step.</h1>
            <p className="lede">
              A clear, patient-focused starting point for understanding dental concerns,
              meeting the clinical team, and deciding when professional evaluation may be appropriate.
            </p>
            <div className="actions" aria-label="Contact options">
              <a className="button button-primary" href="#contact">Contact the clinic</a>
              <a className="button button-secondary" href="#doctors">Meet the doctors</a>
            </div>
          </div>
          <aside className="trust-panel" aria-labelledby="specialist-heading">
            <p className="eyebrow">Specialist information</p>
            <h2 id="specialist-heading">Meet the clinical team</h2>
            {site.doctors.map((doctor) => (
              <div key={doctor.name} className="card" style={{ marginTop: "1rem" }}>
                <h3>{doctor.name}</h3>
                <p><strong>{doctor.qualifications}</strong></p>
                <p>{doctor.specialty}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section id="approach" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Patient-centred approach</p>
            <h2>From concern to consultation, without unnecessary uncertainty.</h2>
            <p className="lede">
              The experience is designed to help patients understand relevant information,
              consider appropriate next steps, ask questions and contact the clinic.
            </p>
          </div>
          <div className="cards">
            <article className="card"><h3>Understand</h3><p>Educational information should explain concerns and treatment considerations in clear language without diagnosing a visitor.</p></article>
            <article className="card"><h3>Trust</h3><p>Doctor identity and other genuine, verifiable evidence should help patients evaluate the clinic with confidence.</p></article>
            <article className="card"><h3>Questions</h3><p>Patients should be able to identify useful questions to discuss with a dental professional.</p></article>
            <article className="card"><h3>Consultation</h3><p>Phone and WhatsApp pathways can connect patients with the clinic when those channels are verified and available.</p></article>
          </div>
        </div>
      </section>

      <section id="doctors" className="section section-subtle">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Clinical team</p>
            <h2>Specialist information</h2>
            <p className="lede">Only currently verified professional information is shown here. Additional credentials and claims require verification.</p>
          </div>
          <div className="cards">
            {site.doctors.map((doctor) => (
              <article className="card" key={doctor.name}>
                <h3>{doctor.name}</h3>
                <p>{doctor.qualifications}</p>
                <p>{doctor.specialty}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="location" className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Local relevance</p>
            <h2>Mangalagiri first, with a wider local audience in view.</h2>
            <p className="lede">The approved geographic strategy identifies Mangalagiri as the primary market, with Vijayawada and Guntur as secondary markets. Exact address and service-area details remain subject to business verification.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="section section-subtle">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Next step</p>
            <h2>Questions can lead to an appropriate consultation.</h2>
            <p className="lede">Phone and WhatsApp conversion details will be enabled once the corresponding business contact information is verified.</p>
          </div>
          <div className="actions">
            <span className="button button-secondary" aria-disabled="true">Phone — business verification required</span>
            <span className="button button-secondary" aria-disabled="true">WhatsApp — business verification required</span>
          </div>
        </div>
      </section>
    </>
  );
}
