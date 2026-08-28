import { siteConfig, doctors, verifiedContact } from "@/config/site";

const journey = [
  ["01", "Patient problem", "Start with what brought you here — without assuming a diagnosis."],
  ["02", "Understanding", "Find clear, patient-friendly information about concerns and next questions."],
  ["03", "Trust", "Meet the clinicians and see only evidence that has been verified."],
  ["04", "Treatment consideration", "Explore relevant information without being pushed toward a decision."],
  ["05", "Questions", "Prepare what you want to ask a dental professional."],
  ["06", "Phone / WhatsApp", "Choose the direct conversation channel once verified contact details are available."],
  ["07", "Consultation", "Move from online understanding to professional evaluation."],
] as const;

const entryPaths = [
  { number: "01", label: "I have a concern", text: "Start with the problem or question on your mind." },
  { number: "02", label: "I am exploring treatment", text: "Understand treatment topics without assuming a diagnosis." },
  { number: "03", label: "I want to meet a specialist", text: "See the currently verified Tanvi doctor information." },
  { number: "04", label: "I need clinic information", text: "Find the local context and verified details." },
] as const;

function ContactAction({ type }: { type: "phone" | "whatsapp" }) {
  const value = type === "phone" ? verifiedContact.phone : verifiedContact.whatsapp;
  if (!value) {
    return <span className="button button-disabled" aria-disabled="true">{type === "phone" ? "Phone details pending" : "WhatsApp details pending"}</span>;
  }
  const href = type === "phone" ? `tel:${value}` : `https://wa.me/${value}`;
  return <a className="button button-primary" href={href} target={type === "phone" ? undefined : "_blank"} rel={type === "phone" ? undefined : "noreferrer"}>{type === "phone" ? "Call the clinic" : "WhatsApp the clinic"}<span aria-hidden="true">↗</span></a>;
}

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Dental care · {siteConfig.markets.primary}</div>
            <h1 id="hero-title">Care you can <em>understand.</em></h1>
            <p className="hero-subtitle">A calmer digital starting point for understanding dental concerns, meeting the specialists and preparing for a professional conversation.</p>
            <div className="hero-actions">
              <ContactAction type="whatsapp" />
              <ContactAction type="phone" />
            </div>
            <p className="micro-note"><span>✦</span> Educational information — not a diagnosis.</p>
          </div>

          <div className="hero-visual" aria-label="Tanvi doctor photography placeholder">
            <div className="visual-backdrop" aria-hidden="true" />
            <div className="asset-frame">
              <div className="asset-photo" role="img" aria-label="Tanvi doctor photography" />
              <div className="asset-caption"><span>THE TANVI TEAM</span><span>Authentic doctor photography</span></div>
            </div>
            <div className="emblem-orb" aria-hidden="true"><div className="tooth-shape">✦</div></div>
            <div className="gold-line" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="proof-band" aria-label="Product principles">
        <div className="container proof-grid">
          <div><span>01</span><strong>Local relevance</strong><small>{siteConfig.markets.primary} first</small></div>
          <div><span>02</span><strong>Specialist trust</strong><small>Verified doctor information</small></div>
          <div><span>03</span><strong>Patient clarity</strong><small>Questions before decisions</small></div>
          <div><span>04</span><strong>Human conversation</strong><small>Phone / WhatsApp → consultation</small></div>
        </div>
      </section>

      <section className="section" id="start" aria-labelledby="start-title">
        <div className="container">
          <div className="section-intro split-intro">
            <div><p className="eyebrow">Start where you are</p><h2 id="start-title">A patient-first way <em>in.</em></h2></div>
            <p>Not every visitor arrives knowing the name of a treatment. The experience should let people enter through their real intent and move toward useful information without diagnosing them.</p>
          </div>
          <div className="entry-grid">
            {entryPaths.map((item) => (
              <a className="entry-item" href="#journey" key={item.number}>
                <span className="entry-number">{item.number}</span>
                <div><h3>{item.label}</h3><p>{item.text}</p></div>
                <span className="entry-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-section" id="journey" aria-labelledby="journey-title">
        <div className="container">
          <div className="section-intro narrow">
            <p className="eyebrow">The decision journey</p>
            <h2 id="journey-title">Less uncertainty.<br /><em>More clarity.</em></h2>
            <p>The architecture follows a simple principle: help a patient understand first, then make the next step easier to take.</p>
          </div>
          <div className="journey-list">
            {journey.map(([number, title, text]) => (
              <div className="journey-row" key={number}>
                <span className="journey-number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section doctors-section" id="doctors" aria-labelledby="doctors-title">
        <div className="container">
          <div className="section-intro split-intro">
            <div><p className="eyebrow">The specialists</p><h2 id="doctors-title">Know who you are <em>speaking with.</em></h2></div>
            <p>Only the doctor information currently provided in the project truth base is shown here. No extra credentials, awards or experience claims are added.</p>
          </div>
          <div className="doctor-grid">
            {doctors.map((doctor, index) => (
              <article className="doctor-panel" key={doctor.name}>
                <div className="doctor-panel-top"><span>0{index + 1}</span><span>VERIFIED BUSINESS-PROVIDED INFO</span></div>
                <div className="doctor-initials" aria-hidden="true">{doctor.name.split(" ").slice(-2).map((part) => part[0]).join("")}</div>
                <h3>{doctor.name}</h3>
                <p className="doctor-qualification">{doctor.qualifications}</p>
                <p className="doctor-specialty">{doctor.specialty}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section services-section" id="services" aria-labelledby="services-title">
        <div className="container services-layout">
          <div className="section-intro narrow"><p className="eyebrow">Treatment information</p><h2 id="services-title">Useful before <em>you decide.</em></h2><p>Service pages should only be published after the service is verified for Tanvi and the clinical content has been reviewed. This protects patients from being sent to a page for a treatment the clinic may not provide.</p></div>
          <div className="service-guard">
            <div className="service-guard-mark" aria-hidden="true">+</div>
            <h3>Verified services only</h3>
            <p>Treatment inventory is intentionally not presented as a final menu yet. The next content layer will connect verified services to patient questions, relevant specialists and appropriate next steps.</p>
            <a href="#contact" className="text-link">See the verification boundary <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section className="location-section" id="location" aria-labelledby="location-title">
        <div className="container location-layout">
          <div>
            <p className="eyebrow eyebrow-light">Local context</p>
            <h2 id="location-title">Rooted in <em>{siteConfig.markets.primary}.</em></h2>
            <p>Tanvi’s primary market is Mangalagiri, with Vijayawada and Guntur as secondary markets. Exact address, hours, phone and directions remain gated until business verification is complete.</p>
          </div>
          <div className="market-list">
            <div><span>01</span><strong>Mangalagiri</strong><small>Primary market</small></div>
            <div><span>02</span><strong>Vijayawada</strong><small>Secondary market</small></div>
            <div><span>03</span><strong>Guntur</strong><small>Secondary market</small></div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="container contact-layout">
          <div><p className="eyebrow eyebrow-light">Next step</p><h2 id="contact-title">Questions first.<br /><em>Conversation when ready.</em></h2></div>
          <div><p>Phone and WhatsApp remain core conversion pathways. They are intentionally shown as unavailable until their current business values are verified.</p><div className="hero-actions"><ContactAction type="whatsapp" /><ContactAction type="phone" /></div></div>
        </div>
      </section>
    </main>
  );
}
