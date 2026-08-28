const services = [
  ["âš•", "Dental Implants", "Permanent solutions for missing teeth"],
  ["â™§", "Root Canal Treatment", "Pain-free treatment to save your natural tooth"],
  ["âœ§", "Cosmetic Dentistry", "Enhance your smile with advanced cosmetic care"],
  ["â™¢", "Wisdom Tooth Management", "Safe removal with expert care"],
  ["âŒ", "Teeth Cleaning & Scaling", "Preventive care for healthy gums & teeth"],
  ["â™•", "Crowns & Bridges", "Restore function & aesthetics with custom crowns"],
];

function Action({ whatsapp = false, children }: { whatsapp?: boolean; children: React.ReactNode }) {
  const href = whatsapp ? "https://wa.me/918499989116" : "tel:+918499989116";
  return <a className={whatsapp ? "action action-wa" : "action"} href={href}>{whatsapp ? "â—‰" : "â—"}<span>{children}</span></a>;
}

export default function HomePage() {
  return <main>
    <div className="topbar"><div className="shell topbar-inner"><span>â—· &nbsp; Open Daily: 8:00 AM â€“ 9:00 PM (IST)</span><i /> <span>âŒ– &nbsp; Mangalagiri, Andhra Pradesh</span><span className="follow">Follow Us: &nbsp; â— &nbsp; â—Ž &nbsp; G</span></div></div>
    <header className="header shell">
      <a className="logo" href="#home" aria-label="Tanvi Dental Care home"><img className="logo-image" src="/images/tanvi-logo-web.png" alt="Tanvi Dental Care logo" /><span><b>TANVI</b><small>DENTAL CARE &amp;<br />IMPLANT CENTRE</small></span></a>
      <nav><a className="active" href="#home">Home</a><a href="#about">About Us</a><a href="#doctors">Our Doctors</a><a href="#services">TreatmentsâŒ„</a><a href="#guide">Patient Guide</a><a href="#contact">Contact Us</a></nav>
      <div className="header-actions"><a className="phone-top" href="tel:+918499989116"><strong>âŒ• &nbsp; 84999 89116</strong><small>Call Us</small></a><Action whatsapp>WhatsApp Us</Action></div>
    </header>
    <section id="home" className="hero"><div className="shell hero-inner">
      <div className="hero-copy"><p className="kicker">Compassionate Care. Advanced Dentistry.</p><h1>Healthy Smiles,<br />Confident Lives.</h1><p className="lead">Expert dental care in a comfortable environment.<br />Your smile is our priority.</p>
        <div className="benefits"><div><b>â™§</b><span><strong>Advanced<br />Technology</strong><small>Modern equipment for<br />precise treatment</small></span></div><div><b>â™¢</b><span><strong>Safe &amp;<br />Hygienic Care</strong><small>Strict sterilization &amp;<br />hygiene protocols</small></span></div><div><b>â™™</b><span><strong>Patient First<br />Approach</strong><small>Personalized care<br />for every smile</small></span></div></div>
        <div className="cta-row"><Action>Call Now: 84999 89116</Action><a className="chat" href="https://wa.me/918499989116">â—‰ &nbsp; Chat on WhatsApp</a></div>
      </div>
      <div className="hero-photo"><div className="color-block gold" /><div className="color-block rose" /><div className="color-block teal" /><div className="tooth">â™¢</div><img src="/images/tanvi-doctors-web.jpg" alt="Dr. Prathap Naidu and Dr. Naga Swathi Pokala" /><div className="doctor-card" id="doctors"><article><strong>Dr. Naga Swathi Pokala</strong><small>BDS, MDS<br />Oral &amp; Maxillofacial Surgeon</small></article><article><strong>Dr. Prathap Naidu</strong><small>BDS, MDS<br />Endodontist</small></article></div></div>
    </div></section>
    <section className="contact-strip shell" id="contact"><div><b>âŒ–</b><span><strong>Location</strong><small>Mangalagiri, Andhra Pradesh<br />Also serving Vijayawada &amp; Guntur</small></span></div><div><b>â—·</b><span><strong>Hours</strong><small>8:00 AM â€“ 9:00 PM (IST)<br />Open all days</small></span></div><div><b>âŒ•</b><span><strong>Call Us</strong><small>84999 89116<br />Weâ€™re here to help</small></span></div><div><b className="whatsapp">â—‰</b><span><strong>WhatsApp</strong><small>Chat with us for quick<br />appointments &amp; queries</small></span></div></section>
    <section className="services shell" id="services"><p className="sparkle">âœ¦</p><h2>Our Dental Services</h2><p className="service-intro">Comprehensive care for you and your family</p><div className="service-grid">{services.map(([icon,title,text]) => <article key={title}><b>{icon}</b><h3>{title}</h3><p>{text}</p></article>)}</div><a className="view-all" href="#contact">View All Treatments &nbsp; â†’</a></section>
    <a href="tel:+918499989116" className="float-call" aria-label="Call Tanvi Dental Care">â—</a><a href="https://wa.me/918499989116" className="float-wa" aria-label="Chat on WhatsApp">â—‰</a>
    <section className="about shell" id="about"><p className="kicker">A clinic built around your comfort</p><h2>Gentle care. Clear guidance. Lasting smiles.</h2><p>From everyday preventive care to restorative and cosmetic treatments, our team helps you make confident choices for your oral health.</p></section>
    <section id="guide" className="guide"><div className="shell"><h2>Your patient guide</h2><p>Call or message us to plan your visit, ask a question, or book a consultation.</p></div></section>
  </main>;
}

