import type { ReactNode } from "react";
import MobileNav from "@/components/MobileNav";
import { clinic, faqs, treatments } from "@/config/clinic";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, ReactNode> = {
    clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    phone: <path d="M6.7 3.9 9 3.2l2.1 4.4-1.7 1.7a15.2 15.2 0 0 0 5.3 5.3l1.7-1.7 4.4 2.1-.7 2.4a2 2 0 0 1-2.3 1.4A17.8 17.8 0 0 1 5.3 6.2a2 2 0 0 1 1.4-2.3Z"/>,
    whatsapp: <><path d="M20.2 11.7a7.8 7.8 0 0 1-11.5 6.8L4 20l1.6-4.5A7.8 7.8 0 1 1 20.2 11.7Z"/><path d="M9 9.3c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c.6 1 1.4 1.7 2.5 2.2l.7-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.3.6-.2.8-.8 1.4-1.6 1.4-1.1 0-2.7-.8-4-2-1.3-1.2-2.3-2.8-2.3-3.8 0-.3.1-.6.3-.9Z"/></>,
    google: <path d="M21 12.2c0-.7-.1-1.5-.3-2.2H12v4.2h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.2 2.7-7.3Z"/>,
    chevron: <path d="m8 10 4 4 4-4"/>,
    arrow: <path d="M5 12h13M13 7l5 5-5 5"/>,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    users: <><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20"/><circle cx="10" cy="7.5" r="3.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M18 14.2a4.5 4.5 0 0 1 2 3.8V20"/></>,
    tooth: <path d="M8.1 5.1c1.4-.9 2.2.2 3.9.2s2.5-1.1 3.9-.2c2.2 1.4 2.5 4.4 1.8 6.5-.7 2.2-1.7 3.2-2.1 5.9-.2 1.4-.7 3-1.9 3s-1.5-1.3-2-3.5c-.2-.9-.5-1.7-1.1-1.7s-.9.8-1.1 1.7c-.5 2.2-.8 3.5-2 3.5-1.2 0-1.7-1.6-1.9-3-.4-2.7-1.4-3.7-2.1-5.9-.7-2.1-.4-5.1 1.8-6.5Z"/>,
    implant: <><path d="M8.2 3.8c1.4-.8 2.1.2 3.8.2s2.4-1 3.8-.2c2 1.2 2.4 3.9 1.8 6-.5 1.9-1.5 3.1-2 5.4-.3 1.4-.7 3-1.8 3-1.2 0-1.4-1.6-1.8-3.2-.2-.9-.5-1.6-1-1.6s-.8.7-1 1.6c-.4 1.6-.7 3.2-1.8 3.2-1.1 0-1.5-1.6-1.8-3-.5-2.3-1.5-3.5-2-5.4-.6-2.1-.2-4.8 1.8-6Z"/><path d="M12 17v4M9.5 19.2h5M9.5 21h5"/></>,
    root: <><path d="M7 4.5c1.5-1 2.5.1 5 .1s3.5-1.1 5-.1c2.4 1.5 2.4 5.1 1.1 7.3-1 1.7-2 2.8-2.2 5.1-.1 1.2-.5 2.6-1.5 2.6-1.2 0-1.5-1.4-2-3.2-.2-.8-.4-1.3-.4-1.3s-.2.5-.4 1.3c-.5 1.8-.8 3.2-2 3.2-1 0-1.4-1.4-1.5-2.6-.2-2.3-1.2-3.4-2.2-5.1C4.6 9.6 4.6 6 7 4.5Z"/><path d="M12 3v4M9.5 5h5"/></>,
    cosmetic: <><path d="M8.2 5.1c1.4-.9 2.2.2 3.8.2s2.4-1.1 3.8-.2c2.1 1.3 2.4 4.1 1.8 6.2-.6 2-1.5 3-2 5.6-.2 1.2-.6 2.6-1.7 2.6s-1.5-1.4-1.9-3.3c-.2-.9-.4-1.5-1-1.5s-.8.6-1 1.5c-.4 1.9-.8 3.3-1.9 3.3s-1.5-1.4-1.7-2.6c-.5-2.6-1.4-3.6-2-5.6-.6-2.1-.3-4.9 1.8-6.2Z"/><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7L19 3Z"/></>,
    wisdom: <><path d="M7.5 5.2c1.5-1 2.6.1 4.5.1s3-1.1 4.5-.1c2.3 1.6 2.3 4.9 1.2 7-1 1.9-2.2 3.1-2.3 5.6-.1 1.3-.5 2.7-1.7 2.7-1.2 0-1.5-1.5-1.7-3.1-.2 1.6-.5 3.1-1.7 3.1-1.2 0-1.6-1.4-1.7-2.7-.1-2.5-1.3-3.7-2.3-5.6-1.1-2.1-1.1-5.4 1.2-7Z"/><path d="M12 8v5M9.5 10.5h5"/></>,
    cleaning: <><path d="M6 4h7.5c2.8 0 4.5 2.1 4.5 4.6 0 2.2-1.3 3.9-3.2 4.6L13 14.3V19H9v-5.2l-2.2-1.1C5.2 12 4 10.5 4 8.7 4 6.2 4.8 4 6 4Z"/><path d="m18 3 .5 1.8L20.3 5l-1.8.5L18 7l-.5-1.5L16 5l1.5-.5L18 3ZM20 9l.4 1.4 1.4.4-1.4.4L20 13l-.4-1.8-1.4-.4L20 9Z"/></>,
    crown: <path d="m4 7 4 4 4-7 4 7 4-4-1.5 11H5.5L4 7Zm2 11h12"/>,
    denture: <path d="M4 12c2.3-3.1 5-4.7 8-4.7s5.7 1.6 8 4.7c-2.3 3.1-5 4.7-8 4.7S6.3 15.1 4 12Z"/><path d="M8 11.5v2M12 10.5v3M16 11.5v2"/></>,
    gum: <><path d="M4 12c2.3-3 5-4.5 8-4.5s5.7 1.5 8 4.5"/><path d="M5 12v3c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4v-3"/><path d="M9 15h6"/></>,
    checkup: <><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.3 2.3 4.7-5"/></>,
    filling: <><path d="M8.1 5.1c1.4-.9 2.2.2 3.9.2s2.5-1.1 3.9-.2c2.2 1.4 2.5 4.4 1.8 6.5-.7 2.2-1.7 3.2-2.1 5.9-.2 1.4-.7 3-1.9 3s-1.5-1.3-2-3.5c-.2-.9-.5-1.7-1.1-1.7s-.9.8-1.1 1.7c-.5 2.2-.8 3.5-2 3.5-1.2 0-1.7-1.6-1.9-3-.4-2.7-1.4-3.7-2.1-5.9-.7-2.1-.4-5.1 1.8-6.5Z"/><path d="M9 8h6"/></>,
    extraction: <><path d="M8.1 5.1c1.4-.9 2.2.2 3.9.2s2.5-1.1 3.9-.2c2.2 1.4 2.5 4.4 1.8 6.5-.7 2.2-1.7 3.2-2.1 5.9-.2 1.4-.7 3-1.9 3s-1.5-1.3-2-3.5c-.2-.9-.5-1.7-1.1-1.7s-.9.8-1.1 1.7c-.5 2.2-.8 3.5-2 3.5-1.2 0-1.7-1.6-1.9-3-.4-2.7-1.4-3.7-2.1-5.9-.7-2.1-.4-5.1 1.8-6.5Z"/><path d="M5 3l14 18"/></>,
    emergency: <><path d="M12 3 21 20H3L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.2h.01"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
  };

  return <svg {...common}>{paths[name] ?? paths.tooth}</svg>;
}

function Button({ href, children, variant = "primary", icon }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; icon?: string }) {
  return <a className={`btn btn-${variant}`} href={href}>{icon && <Icon name={icon} size={18}/>}<span>{children}</span></a>;
}

export default function HomePage() {
  return (
    <main>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span><Icon name="clock" size={15}/>{clinic.hours}</span><i/><span><Icon name="pin" size={15}/>Mangalagiri, Andhra Pradesh</span>
          </div>
          <div className="socials" aria-label="Verified clinic links">
            <span>Find Us:</span>
            <a href={clinic.googleMapsUrl} target="_blank" rel="noreferrer" aria-label="Tanvi Dental Care on Google Maps"><Icon name="google" size={15}/></a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a href="#home" className="brand" aria-label="Tanvi Dental Care & Implant Centre">
            <img src="/images/tanvi-logo-web.png" alt="Tanvi Dental Care & Implant Centre logo" width="64" height="64" fetchPriority="high"/>
            <span className="brand-copy"><strong>TANVI</strong><small>DENTAL CARE &amp;<br/>IMPLANT CENTRE</small></span>
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a className="active" href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#doctors">Our Doctors</a>
            <a href="#services">Treatments <Icon name="chevron" size={14}/></a>
            <a href="#guide">Patient Guide</a>
            <a href="#faq">FAQs</a>
            <a href="#contact">Contact Us</a>
          </nav>
          <div className="header-actions">
            <a className="header-phone" href={clinic.phoneHref} aria-label={`Call Tanvi Dental Care at ${clinic.phone}`}><Icon name="phone" size={19}/><span><strong>{clinic.phone}</strong><small>Call Us</small></span></a>
            <a className="header-whatsapp" href={clinic.whatsappHref} aria-label="Chat with Tanvi Dental Care on WhatsApp"><Icon name="whatsapp" size={19}/><span>WhatsApp Us</span></a>
          </div>
          <MobileNav />
        </div>
      </header>

      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Compassionate Care. Advanced Dentistry.</p>
            <h1 id="hero-title">Healthy Smiles,<br/><em>Confident Lives.</em></h1>
            <p className="hero-lead">Expert dental care in a comfortable environment.<br/>Your smile is our priority.</p>
            <div className="hero-benefits">
              <div className="benefit"><span className="benefit-icon"><Icon name="tooth" size={22}/></span><div><strong>Advanced Technology</strong><small>Modern equipment for precise treatment</small></div></div>
              <div className="benefit"><span className="benefit-icon"><Icon name="shield" size={22}/></span><div><strong>Safe &amp; Hygienic Care</strong><small>Strict sterilization &amp; hygiene protocols</small></div></div>
              <div className="benefit"><span className="benefit-icon"><Icon name="users" size={22}/></span><div><strong>Patient First Approach</strong><small>Personalized care for every smile</small></div></div>
            </div>
            <div className="hero-actions"><Button href={clinic.phoneHref} icon="phone">Call Now: {clinic.phone}</Button><Button href={clinic.whatsappHref} variant="secondary" icon="whatsapp">Chat on WhatsApp</Button></div>
            <p className="medical-note"><Icon name="info" size={13}/>Educational information — not a diagnosis. Treatment suitability is assessed by the dentist.</p>
          </div>
        </div>
        <div className="hero-image-layer" aria-label="Dr. Naga Swathi Pokala and Dr. Prathap Naidu">
          <picture><img src="/images/tanvi-doctors-hero.jpg" alt="Dr. Naga Swathi Pokala and Dr. Prathap Naidu" width="1100" height="700" fetchPriority="high"/></picture>
        </div>
      </section>

      <section className="container quick-info" aria-label="Clinic information">
        <div><a className="info-link" href={clinic.googleMapsUrl} target="_blank" rel="noreferrer"><span className="info-icon"><Icon name="pin" size={34}/></span><span><strong>Location</strong><p>Mangalagiri, Andhra Pradesh<br/>Near Old Bus Stand</p></span></a></div>
        <div><a className="info-link" href="#contact"><span className="info-icon"><Icon name="clock" size={34}/></span><span><strong>Hours</strong><p>{clinic.hours}<br/>Please call to confirm availability</p></span></a></div>
        <div><a className="info-link" href={clinic.phoneHref}><span className="info-icon"><Icon name="phone" size={34}/></span><span><strong>Call Us</strong><p>{clinic.phone}<br/>We’re here to help</p></span></a></div>
        <div><a className="info-link" href={clinic.whatsappHref}><span className="info-icon whatsapp"><Icon name="whatsapp" size={34}/></span><span><strong>WhatsApp</strong><p>Chat for appointments<br/>&amp; enquiries</p></span></a></div>
      </section>

      <section className="services" id="services" aria-labelledby="services-title">
        <div className="container">
          <div className="section-heading"><p className="section-mark">✦</p><h2 id="services-title">Our Dental Services</h2><p>Comprehensive treatment areas for you and your family</p></div>
          <div className="service-grid">{treatments.slice(0, 6).map((service) => <article className="service-item" key={service.name}><div className="service-icon"><Icon name={service.icon} size={30}/></div><h3>{service.name}</h3><p>{service.description}</p></article>)}</div>
          <a className="view-all" href="#treatment-catalogue">View All Treatments <Icon name="arrow" size={17}/></a>
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="container about-inner">
          <div><p className="eyebrow">A calm, patient-first experience</p><h2 id="about-title">Professional care with a human approach.</h2></div>
          <p>Tanvi Dental Care &amp; Implant Centre is presented around clear communication, comfortable care and personalised treatment planning. Every procedure should begin with an examination and an explanation of the options appropriate for your oral health.</p>
        </div>
      </section>

      <section className="doctors-section" id="doctors" aria-labelledby="doctors-title">
        <div className="container">
          <div className="doctors-heading section-heading"><p className="section-mark">✦</p><h2 id="doctors-title">Meet Our Doctors</h2><p>Specialist-led dental care</p></div>
          <div className="doctor-grid">
            <article className="doctor-card"><div className="doctor-initial">NS</div><div><h3>Dr. Naga Swathi Pokala</h3><p>BDS, MDS</p><strong>Oral &amp; Maxillofacial Surgeon</strong></div></article>
            <article className="doctor-card"><div className="doctor-initial">PN</div><div><h3>Dr. Prathap Naidu</h3><p>BDS, MDS</p><strong>Endodontist</strong></div></article>
          </div>
        </div>
      </section>

      <section className="treatment-catalogue" id="treatment-catalogue" aria-labelledby="catalogue-title">
        <div className="container">
          <div className="section-heading catalogue-heading"><p className="section-mark">✦</p><h2 id="catalogue-title">Treatment Catalogue</h2><p>Explore the main treatment areas presented for patient guidance.</p></div>
          <div className="catalogue-grid">{treatments.map((treatment) => <article className="catalogue-card" key={treatment.name}><span className="catalogue-icon"><Icon name={treatment.icon} size={25}/></span><div><h3>{treatment.name}</h3><p>{treatment.description}</p></div></article>)}</div>
          <p className="catalogue-note"><Icon name="info" size={14}/>Treatment availability and suitability are confirmed after clinical assessment.</p>
        </div>
      </section>

      <section className="guide-section" id="guide" aria-labelledby="guide-title">
        <div className="container guide-inner">
          <div><p className="eyebrow">Patient Guide</p><h2 id="guide-title">Know what to expect before your visit.</h2><p className="guide-copy">Bring your previous dental records or scans if available, share your current concerns clearly, and ask about treatment options, expected visits and after-care.</p></div>
          <div className="journey"><span><b>01</b> Tell us your concern</span><span><b>02</b> Clinical examination</span><span><b>03</b> Treatment discussion</span><span><b>04</b> Personalised plan</span></div>
        </div>
      </section>

      <section className="reviews-section" id="reviews" aria-labelledby="reviews-title">
        <div className="container reviews-inner">
          <div><p className="eyebrow">Patient feedback</p><h2 id="reviews-title">See the live Google profile.</h2><p>At the time this website data was updated, the Google Business listing showed a <strong>{clinic.googleRating.toFixed(1)}/5</strong> rating from <strong>{clinic.googleReviewCount} reviews</strong>. The live Google listing may change over time.</p><a className="review-link" href={clinic.googleMapsUrl} target="_blank" rel="noreferrer"><Icon name="google" size={18}/> View Google profile <Icon name="arrow" size={16}/></a></div>
          <div className="rating-card"><div className="rating-number">{clinic.googleRating.toFixed(1)}</div><div className="rating-stars" aria-label="5 out of 5 stars">★★★★★</div><p>{clinic.googleReviewCount} Google reviews</p><span>Live rating can change</span></div>
        </div>
      </section>

      <section className="faq-section" id="faq" aria-labelledby="faq-title">
        <div className="container faq-layout">
          <div className="faq-intro"><p className="eyebrow">Patient questions</p><h2 id="faq-title">Frequently Asked Questions</h2><p>Clear answers for common appointment, location and treatment questions.</p><a className="btn btn-primary" href={clinic.whatsappHref}><Icon name="whatsapp" size={18}/> Ask on WhatsApp</a></div>
          <div className="faq-list">{faqs.map((faq, index) => <details className="faq-item" key={faq.question} open={index === 0}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="container contact-inner">
          <div><p className="eyebrow">Visit Tanvi Dental Care</p><h2 id="contact-title">Find us near the Old Bus Stand.</h2><p>{clinic.address}</p><div className="contact-actions"><Button href={clinic.phoneHref} icon="phone">Call {clinic.phone}</Button><Button href={clinic.whatsappHref} variant="secondary" icon="whatsapp">WhatsApp</Button><a className="btn btn-secondary" href={clinic.googleMapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={18}/>Open Google Maps</a></div></div>
          <div className="map-card"><iframe title="Tanvi Dental Care & Implant Centre location on Google Maps" src="https://www.google.com/maps?q=Tanvi%20Dental%20Care%20%26%20Implant%20Centre%2C%20Mangalagiri%2C%20Andhra%20Pradesh&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand"><img src="/images/tanvi-logo-web.png" alt="Tanvi Dental Care logo" width="52" height="46"/><span><strong>TANVI</strong><small>DENTAL CARE &amp; IMPLANT CENTRE</small></span></div>
          <p>{clinic.shortAddress} · {clinic.hours} · <a href={clinic.phoneHref}>{clinic.phone}</a></p>
          <a className="footer-google" href={clinic.googleMapsUrl} target="_blank" rel="noreferrer"><Icon name="google" size={16}/> Google</a>
        </div>
      </footer>

      <div className="floating-actions" aria-label="Quick contact">
        <a href={clinic.phoneHref} aria-label="Call Tanvi Dental Care"><Icon name="phone" size={23}/></a>
        <a href={clinic.whatsappHref} aria-label="WhatsApp Tanvi Dental Care"><Icon name="whatsapp" size={23}/></a>
      </div>
    </main>
  );
}
