import type { Metadata } from "next";
import { faqs } from "@/config/clinic";

export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Common questions about appointments, location and dental care at Tanvi Dental Care & Implant Centre.", alternates: { canonical: "/faq" } };

export default function FAQPage() { return <main><section className="inner-page-hero"><div className="container"><p className="eyebrow">Patient questions</p><h1>Frequently Asked Questions</h1><p>Clear information for common appointment, location and treatment questions.</p></div></section><section className="inner-page-section"><div className="container faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></section></main>; }
