import Image from "next/image";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic } from "@/config/clinic";

export function SiteHeader() {
  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span><ClinicIcon name="clock" size={15}/>{clinic.hours}</span><i/>
            <span><ClinicIcon name="pin" size={15}/>Mangalagiri, Andhra Pradesh</span>
          </div>
          <div className="socials">
            <span>Find Us:</span>
            <a href={clinic.googleMapsUrl} target="_blank" rel="noreferrer" aria-label="Tanvi Dental Care on Google Maps"><ClinicIcon name="google" size={15}/></a>
            {clinic.social.instagram && <a href={clinic.social.instagram} target="_blank" rel="noreferrer" aria-label="Tanvi Dental Care on Instagram"><ClinicIcon name="instagram" size={15}/></a>}
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Tanvi Dental Care & Implant Centre home">
            <Image src="/images/tanvi-logo-web.png" alt="Tanvi Dental Care & Implant Centre logo" width={64} height={64} priority/>
            <span className="brand-copy"><strong>TANVI</strong><small>DENTAL CARE &amp;<br/>IMPLANT CENTRE</small></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link href="/">Home</Link>
            <Link href="/#about">About Us</Link>
            <Link href="/doctors">Our Doctors</Link>
            <Link href="/treatments">Treatments</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/#guide">Patient Guide</Link>
            <Link href="/#faq">FAQs</Link>
          </nav>
          <div className="header-actions">
            <a className="header-phone" href={clinic.phoneHref}><ClinicIcon name="phone" size={19}/><span><strong>{clinic.phone}</strong><small>Call Us</small></span></a>
            <a className="header-whatsapp" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={19}/><span>WhatsApp Us</span></a>
          </div>
          <MobileNav />
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <>
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand"><Image src="/images/tanvi-logo-web.png" alt="Tanvi Dental Care logo" width={52} height={46}/><span><strong>TANVI</strong><small>DENTAL CARE &amp; IMPLANT CENTRE</small></span></div>
          <p>{clinic.shortAddress} · {clinic.hours} · <a href={clinic.phoneHref}>{clinic.phone}</a></p>
          <div className="footer-socials">
            <a className="footer-google" href={clinic.googleMapsUrl} target="_blank" rel="noreferrer"><ClinicIcon name="google" size={16}/> Google</a>
            {clinic.social.instagram && <a className="footer-google" href={clinic.social.instagram} target="_blank" rel="noreferrer"><ClinicIcon name="instagram" size={16}/> Instagram</a>}
          </div>
        </div>
      </footer>
      <div className="floating-actions">
        <a href={clinic.phoneHref} aria-label="Call Tanvi Dental Care"><ClinicIcon name="phone" size={23}/></a>
        <a href={clinic.whatsappHref} aria-label="WhatsApp Tanvi Dental Care"><ClinicIcon name="whatsapp" size={23}/></a>
      </div>
    </>
  );
}
