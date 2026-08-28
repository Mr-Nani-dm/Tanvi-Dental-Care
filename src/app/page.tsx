import { DoctorCard } from "@/components/trust/DoctorCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site";

const journey = [
  ["01", "Understand", "Clear information helps you make sense of a concern without a website trying to diagnose you."],
  ["02", "Build trust", "Meet the specialists and understand what information is verified before you decide what to do next."],
  ["03", "Consider", "Explore relevant information, think through your questions and consider whether professional evaluation is appropriate."],
  ["04", "Consult", "A direct Phone or WhatsApp path can make the next step simple once you are ready."],
] as const;

export default function HomePage() {
  const tel = `tel:${site.contact.phone}`;
  const whatsapp = `https://wa.me/${site.contact.whatsapp}`;

  return (
    <>
      <section className="hero">
        <div className="hero-orbit" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow-row"><span className="eyebrow-dot" /><p className="eyebrow">Dental care · Mangalagiri</p></div>
            <h1>Care you can understand. <em>People you can trust.</em></h1>
            <p className="lede">A calmer digital starting point for understanding dental concerns, meeting the specialists and preparing for a professional conversation.</p>
            <div className="actions">
              <a className="button button-primary" href={whatsapp} target="_blank" rel="noreferrer"><span>WhatsApp the clinic</span><span aria-hidden="true">↗</span></a>
              <a className="button button-quiet" href={tel}>Call {site.contact.phone} <span aria-hidden="true">↗</span></a>
            </div>
            <div className="hero-note"><span aria-hidden="true">✦</span><span>Educational, patient-first information — not a diagnosis.</span></div>
          </div>
          <aside className="hero-clinical" aria-label="Verified clinical team">
            <div className="clinical-label"><span>CLINICAL TEAM</span><span className="label-line" /></div>
            <div className="clinical-intro">Specialist care, <strong>plainly presented.</strong></div>
            {site.doctors.map((doctor, index) => (
              <div className="doctor-mini" key={doctor.name}>
                <div className="doctor-number">0{index + 1}</div>
                <div><h2>{doctor.name}</h2><p>{doctor.qualifications} · {doctor.specialty}</p></div>
                <span className="arrow" aria-hidden="true">↗</span>
              </div>
            ))}
            <div className="verified-line"><span className="check" aria-hidden="true">✓</span> Business-provided specialist information</div>
          </aside>
        </div>
      </section>

      <section className="signal-strip" aria-label="Tanvi approach">
        <div className="container signal-inner"><span>LOCAL RELEVANCE</span><i /> <span>SPECIALIST TRUST</span><i /> <span>PATIENT CLARITY</span><i /> <span>HUMAN CONVERSATION</span></div>
      </section>

      <section id="approach" className="section approach-section">
        <div className="container">
          <SectionHeading eyebrow="A better starting point" title="Less uncertainty. More clarity." description="Dental decisions can feel complicated. The experience is designed to answer genuine patient questions first, then make the next step easier to understand." />
          <div className="journey-list">
            {journey.map(([number, title, text]) => <article className="journey-item" key={number}><span className="journey-number">{number}</span><h3>{title}</h3><p>{text}</p><span className="journey-mark" aria-hidden="true">+</span></article>)}
          </div>
        </div>
      </section>

      <section id="services" className="section services-section">
        <div className="container">
          <div className="section-topline"><SectionHeading eyebrow="Care categories" title="Explore care by what you need." description="These service categories have been provided in the project business context. Individual treatment pages should only be published after service verification and medical review." /><span className="section-index">01 / 04</span></div>
          <div className="service-list">{site.serviceCategories.map((service, index) => <div className="service-row" key={service}><span>{String(index + 1).padStart(2, "0")}</span><strong>{service}</strong><small>Verification required</small></div>)}</div>
        </div>
      </section>

      <section id="doctors" className="section team-section">
        <div className="container">
          <div className="section-topline"><SectionHeading eyebrow="The specialists" title="Know who you are speaking with." description="Professional information currently provided by the business, without adding unverified credentials or claims." /><span className="section-index">02 / 04</span></div>
          <div className="doctor-grid">{site.doctors.map((doctor) => <DoctorCard key={doctor.name} doctor={doctor} />)}</div>
        </div>
      </section>

      <section id="location" className="section location-section">
        <div className="container location-grid">
          <div><div className="eyebrow-row"><span className="eyebrow-dot" /><p className="eyebrow">Find the clinic</p></div><h2>Rooted in <em>Mangalagiri.</em></h2><p className="location-copy">{site.contact.address}</p><p className="location-hours">{site.contact.hours}</p><div className="actions"><a className="button button-primary" href={tel}>Call the clinic</a><a className="button button-outline" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></div><p className="verification-note">Address, hours and contact details are business-provided and should be reconfirmed before final publication.</p></div>
          <div className="market-list"><div><span>01</span><strong>Mangalagiri</strong><small>Primary market</small></div><div><span>02</span><strong>Vijayawada</strong><small>Secondary market</small></div><div><span>03</span><strong>Guntur</strong><small>Secondary market</small></div></div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container contact-inner"><div><p className="eyebrow">Ready when you are</p><h2>Have questions?<br /><em>Start a conversation.</em></h2></div><div><p>Call or message the clinic to discuss the next step toward a consultation.</p><div className="actions"><a className="button button-primary" href={tel}>Call {site.contact.phone}</a><a className="button button-outline" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp the clinic</a></div><p className="verification-note">Contact details are business-provided and pending final verification.</p></div></div>
      </section>
    </>
  );
}
