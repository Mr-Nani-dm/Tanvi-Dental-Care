import type { ReactNode } from "react";

const PHONE = "84999 89116";
const PHONE_HREF = "tel:+918499989116";
const WHATSAPP_HREF = "https://wa.me/918499989116?text=Hello%20Tanvi%20Dental%20Care%2C%20I%20would%20like%20to%20book%20a%20dental%20appointment.";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<string, ReactNode> = {
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M6.7 3.9 9 3.2l2.1 4.4-1.7 1.7a15.2 15.2 0 0 0 5.3 5.3l1.7-1.7 4.4 2.1-.7 2.4a2 2 0 0 1-2.3 1.4A17.8 17.8 0 0 1 5.3 6.2a2 2 0 0 1 1.4-2.3Z" />,
    whatsapp: <><path d="M20.2 11.7a7.8 7.8 0 0 1-11.5 6.8L4 20l1.6-4.5A7.8 7.8 0 1 1 20.2 11.7Z" /><path d="M9 9.3c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c.6 1 1.4 1.7 2.5 2.2l.7-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.3.6-.2.8-.8 1.4-1.6 1.4-1.1 0-2.7-.8-4-2-1.3-1.2-2.3-2.8-2.3-3.8 0-.3.1-.6.3-.9Z" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    arrow: <path d="M5 12h13M13 7l5 5-5 5" />,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    users: <><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M18 14.2a4.5 4.5 0 0 1 2 3.8V20" /></>,
    tooth: <path d="M8.1 5.1c1.4-.9 2.2.2 3.9.2s2.5-1.1 3.9-.2c2.2 1.4 2.5 4.4 1.8 6.5-.7 2.2-1.7 3.2-2.1 5.9-.2 1.4-.7 3-1.9 3s-1.5-1.3-2-3.5c-.2-.9-.5-1.7-1.1-1.7s-.9.8-1.1 1.7c-.5 2.2-.8 3.5-2 3.5-1.2 0-1.7-1.6-1.9-3-.4-2.7-1.4-3.7-2.1-5.9-.7-2.1-.4-5.1 1.8-6.5Z" />,
    sparkle: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
  };
  return <svg {...common}>{paths[name] ?? paths.tooth}</svg>;
}

const services = [
  ["Dental Implants", "Permanent solutions for missing teeth", "tooth"],
  ["Root Canal Treatment", "Pain-free treatment to save your natural tooth", "tooth"],
  ["Cosmetic Dentistry", "Enhance your smile with advanced cosmetic care", "sparkle"],
  ["Wisdom Tooth Management", "Safe removal with expert care", "tooth"],
  ["Teeth Cleaning & Scaling", "Preventive care for healthy gums & teeth", "tooth"],
  ["Crowns & Bridges", "Restore function & aesthetics with custom crowns", "tooth"],
] as const;

function Button({ href, children, variant = "primary", icon }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; icon?: string }) {
  return <a className={`btn btn-${variant}`} href={href}>{icon && <Icon name={icon} size={18} />}<span>{children}</span></a>;
}

export default function HomePage() {
  return (
    <main>
      <div className="topbar"><div className="container topbar-inner"><div className="topbar-left"><span><Icon name="clock" size={15} />Open Daily: 8:00 AM - 9:00 PM (IST)</span><i /><span><Icon name="pin" size={15} />Mangalagiri, Andhra Pradesh</span></div><div className="socials"><span>Follow Us:</span><b>f</b><b>◎</b><b>G</b></div></div></div>

      <header className="site-header"><div className="container header-inner">
        <a href="#home" className="brand" aria-label="Tanvi Dental Care & Implant Centre">
          <img src="/images/tanvi-logo-web.png" alt="Tanvi Dental Care & Implant Centre logo" width="92" height="82" />
          <span className="brand-copy"><strong>TANVI</strong><small>DENTAL CARE &amp;<br />IMPLANT CENTRE</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation"><a className="active" href="#home">Home</a><a href="#about">About Us</a><a href="#doctors">Our Doctors</a><a href="#services">Treatments <Icon name="chevron" size={14} /></a><a href="#guide">Patient Guide</a><a href="#contact">Contact Us</a></nav>
        <div className="header-actions"><a className="header-phone" href={PHONE_HREF}><Icon name="phone" size={20} /><span><strong>{PHONE}</strong><small>Call Us</small></span></a><a className="header-whatsapp" href={WHATSAPP_HREF}><Icon name="whatsapp" size={20} /><span>WhatsApp<br className="wide-break" /> Us</span></a></div>
        <button className="mobile-menu" type="button" aria-label="Open menu">☰</button>
      </div></header>

      <section className="hero" id="home">
        <div className="container hero-inner">
          <div className="hero-copy"><p className="eyebrow">Compassionate Care. Advanced Dentistry.</p><h1>Healthy Smiles,<br /><em>Confident Lives.</em></h1><p className="hero-lead">Expert dental care in a comfortable environment.<br />Your smile is our priority.</p>
            <div className="hero-benefits"><div className="benefit"><span className="benefit-icon"><Icon name="tooth" size={24} /></span><div><strong>Advanced<br />Technology</strong><small>Modern equipment for<br />precise treatment</small></div></div><div className="benefit"><span className="benefit-icon"><Icon name="shield" size={24} /></span><div><strong>Safe &amp;<br />Hygienic Care</strong><small>Strict sterilization &amp;<br />hygiene protocols</small></div></div><div className="benefit"><span className="benefit-icon"><Icon name="users" size={24} /></span><div><strong>Patient First<br />Approach</strong><small>Personalized care<br />for every smile</small></div></div></div>
            <div className="hero-actions"><Button href={PHONE_HREF} icon="phone">Call Now: {PHONE}</Button><Button href={WHATSAPP_HREF} variant="secondary" icon="whatsapp">Chat on WhatsApp</Button></div><p className="disclaimer"><Icon name="shield" size={13} />Educational information - not a diagnosis.</p>
          </div><div className="hero-doctor-space" aria-hidden="true" />
        </div>
        <div className="hero-image-layer"><picture><source media="(min-width: 981px)" srcSet="/images/tanvi-doctors-web.jpg" /><img src="/images/tanvi-doctors-web.jpg" alt="Dr. Naga Swathi Pokala and Dr. Prathap Naidu" width="664" height="451" fetchPriority="high" decoding="async" /></picture></div>
      </section>

      <section className="quick-info container" aria-label="Clinic information"><div><span className="info-icon"><Icon name="pin" /></span><div><strong>Location</strong><p>Mangalagiri, Andhra Pradesh<br />Also serving Vijayawada &amp; Guntur</p></div></div><div><span className="info-icon"><Icon name="clock" /></span><div><strong>Hours</strong><p>8:00 AM - 9:00 PM (IST)<br />Open all days</p></div></div><div><a href={PHONE_HREF} className="info-link"><span className="info-icon"><Icon name="phone" /></span><div><strong>Call Us</strong><p>{PHONE}<br />We're here to help</p></div></a></div><div><a href={WHATSAPP_HREF} className="info-link"><span className="info-icon whatsapp"><Icon name="whatsapp" /></span><div><strong>WhatsApp</strong><p>Chat with us for quick<br />appointments &amp; queries</p></div></a></div></section>

      <section className="services container" id="services"><div className="section-heading"><span className="section-mark"><Icon name="sparkle" size={16} /></span><h2>Our Dental Services</h2><p>Comprehensive care for you and your family</p></div><div className="service-grid">{services.map(([title, text, icon]) => <article className="service-item" key={title}><span className="service-icon"><Icon name={icon} size={34} /></span><h3>{title}</h3><p>{text}</p></article>)}</div><a className="view-all" href="#contact">View All Treatments <Icon name="arrow" size={16} /></a></section>

      <section className="about-section" id="about"><div className="container about-inner"><div><p className="eyebrow">A clinic built around your comfort</p><h2>Clear guidance. Thoughtful care. A calmer dental experience.</h2></div><p>Explore your concerns, meet the specialists and take the next appropriate step with information designed for patients - not medical jargon.</p></div></section>
      <section className="guide-section" id="guide"><div className="container"><p className="eyebrow">Patient Guide</p><h2>Understand first. Ask questions. Then decide.</h2><div className="journey"><span>Patient concern</span><b>→</b><span>Understanding</span><b>→</b><span>Trust</span><b>→</b><span>Questions</span><b>→</b><span>Consultation</span></div></div></section>
      <section className="contact-section" id="contact"><div className="container contact-inner"><div><p className="eyebrow">Take the next step</p><h2>Have a dental question?</h2><p>Call or WhatsApp the clinic to ask a question or enquire about a consultation.</p></div><div className="contact-actions"><Button href={PHONE_HREF} icon="phone">Call {PHONE}</Button><Button href={WHATSAPP_HREF} variant="secondary" icon="whatsapp">WhatsApp the Clinic</Button></div></div></section>
      <footer className="footer"><div className="container footer-inner"><div className="footer-brand"><img src="/images/tanvi-logo-web.png" alt="" width="58" height="50" /><span><strong>TANVI</strong><small>DENTAL CARE &amp;<br />IMPLANT CENTRE</small></span></div><p>Tanvi Dental Care &amp; Implant Centre - Mangalagiri, Andhra Pradesh</p></div></footer>
      <div className="floating-actions" aria-label="Quick contact"><a href={PHONE_HREF} aria-label="Call Tanvi Dental Care"><Icon name="phone" size={22} /></a><a href={WHATSAPP_HREF} aria-label="WhatsApp Tanvi Dental Care"><Icon name="whatsapp" size={24} /></a></div>
    </main>
  );
}
