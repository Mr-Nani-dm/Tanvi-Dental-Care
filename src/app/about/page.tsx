import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Tanvi Dental Care",
  description: "Learn about the patient-first approach and specialist-led care at Tanvi Dental Care & Implant Centre in Mangalagiri.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <main><section className="inner-page-hero"><div className="container"><p className="eyebrow">About Tanvi</p><h1>Professional care with a human approach.</h1><p>A patient-centered dental experience built around clear communication, specialist care and thoughtful treatment planning.</p></div></section><section className="inner-page-section"><div className="container content-narrow"><h2>What patients can expect</h2><p>Tanvi Dental Care &amp; Implant Centre is presented around clear communication, comfortable care and personalized treatment planning. A dental visit should begin with understanding your concern, an appropriate clinical examination and a discussion of suitable options.</p><h2>Our specialists</h2><p>Tanvi brings together verified specialist dental professionals, including an Oral &amp; Maxillofacial Surgeon and an Endodontist.</p><Link className="btn btn-primary" href="/doctors">Meet our doctors</Link></div></section></main>;
}
