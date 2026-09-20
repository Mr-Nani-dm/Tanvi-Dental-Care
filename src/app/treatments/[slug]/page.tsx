import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic, treatments } from "@/config/clinic";
import { clinicEntityId, doctors, siteConfig } from "@/config/site";
import { getTreatmentBlogPosts } from "@/content/blog";
import { getTreatmentAuthorityContent } from "@/content/treatment-authority";

export const dynamicParams = false;

export function generateStaticParams() {
  return treatments.map((treatment) => ({ slug: treatment.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const treatment = treatments.find((item) => item.slug === slug);
  if (!treatment) notFound();

  const authority = getTreatmentAuthorityContent(treatment.slug);
  const description = authority?.seoDescription || `${treatment.name} information from Tanvi Dental Care & Implant Centre in Mangalagiri. Suitability is confirmed after clinical assessment.`;

  return {
    title: `${treatment.name} in Mangalagiri`,
    description,
    alternates: { canonical: `/treatments/${treatment.slug}` },
    openGraph: {
      title: `${treatment.name} in Mangalagiri | Tanvi Dental Care`,
      description,
      url: `/treatments/${treatment.slug}`,
      type: "website",
    },
  };
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const treatment = treatments.find((item) => item.slug === slug);

  if (!treatment) notFound();

  const authority = getTreatmentAuthorityContent(treatment.slug);
  const patientGuides = getTreatmentBlogPosts(treatment.slug, 3);
  const relatedDoctors = doctors.filter((doctor) =>
    doctor.relatedTreatmentSlugs.some((relatedSlug) => relatedSlug === treatment.slug)
  );

  const treatmentUrl = `${siteConfig.url}/treatments/${treatment.slug}`;

  const faqSchema = authority ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: authority.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } : null;

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${treatmentUrl}#webpage`,
        url: treatmentUrl,
        name: `${treatment.name} in Mangalagiri`,
        description: authority?.seoDescription || treatment.description,
        about: { "@id": clinicEntityId },
        breadcrumb: { "@id": `${treatmentUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${treatmentUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Treatments", item: `${siteConfig.url}/treatments` },
          { "@type": "ListItem", position: 3, name: treatment.name, item: treatmentUrl },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="treatment-detail-page">
        <section className="catalogue-page-hero">
          <div className="container">
            <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/treatments">Treatments</Link><span>/</span><span aria-current="page">{treatment.name}</span></nav>
            <p className="eyebrow">{authority?.eyebrow || "Dental treatment in Mangalagiri"}</p>
            <div className="treatment-detail-icon"><ClinicIcon name={treatment.icon} size={34}/></div>
            <h1>{treatment.name}</h1>
            <p>{treatment.description}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
              <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>Ask on WhatsApp</a>
            </div>
          </div>
        </section>

        <section className="detail-content">
          <div className="container detail-grid">
            <article>
              <p className="eyebrow">{authority ? "Patient guide" : "What to expect"}</p>
              <h2>{authority?.introTitle || "Assessment comes first."}</h2>
              {authority ? authority.introParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : (
                <>
                  <p>Dental treatment is individual. The dentist will examine your teeth, gums and overall oral-health needs before recommending an appropriate option.</p>
                  <p>During consultation, you can discuss your symptoms or goals, available treatment approaches, expected visits and after-care. The final plan depends on clinical findings.</p>
                </>
              )}
            </article>

            <aside className="detail-callout">
              <h2>Have questions?</h2>
              <p>Call or WhatsApp the clinic to request an appointment and confirm availability.</p>
              <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call the clinic</a>
              {relatedDoctors.map((doctor) => (
                <Link className="view-all" href={`/doctors/${doctor.slug}`} key={doctor.slug}>
                  Meet {doctor.name} <ClinicIcon name="arrow" size={15}/>
                </Link>
              ))}
            </aside>
          </div>
        </section>

        {authority && (
          <>
            <section className="detail-content">
              <div className="container detail-grid">
                <article>
                  <p className="eyebrow">Clinical assessment</p>
                  <h2>{authority.assessmentTitle}</h2>
                  <ul>
                    {authority.assessmentItems.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
                <article>
                  <p className="eyebrow">Treatment overview</p>
                  <h2>{authority.treatmentTitle}</h2>
                  <ul>
                    {authority.treatmentItems.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
              </div>
            </section>

            <section className="detail-content">
              <div className="container detail-grid">
                <article>
                  <p className="eyebrow">After-care</p>
                  <h2>{authority.aftercareTitle}</h2>
                  {authority.aftercareParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </article>
                <aside className="detail-callout">
                  <h2>Individual assessment matters.</h2>
                  <p>Online information cannot determine which dental treatment is right for an individual patient. The final recommendation depends on examination and clinical findings.</p>
                  <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>Request an appointment</a>
                </aside>
              </div>
            </section>

            <section className="faq-section">
              <div className="container faq-layout">
                <div className="faq-intro">
                  <p className="eyebrow">Patient questions</p>
                  <h2>{treatment.name} FAQs</h2>
                  <p>General answers to common questions. Your own treatment plan may differ after examination.</p>
                  <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
                </div>
                <div className="faq-list">
                  {authority.faq.map((item, index) => (
                    <details className="faq-item" key={item.question} open={index === 0}>
                      <summary>{item.question}<span>+</span></summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {patientGuides.length > 0 && (
          <section className="related-blog-section treatment-guides">
            <div className="container">
              <div className="section-heading">
                <p className="section-mark">✦</p>
                <h2>Helpful Patient Guides</h2>
                <p>Articles related to {treatment.name.toLowerCase()}.</p>
              </div>
              <div className="blog-grid blog-grid-related">
                {patientGuides.map((post) => (
                  <article className="blog-card" key={post.slug}>
                    {post.featuredImage ? (
                      <Link className="blog-card-image" href={`/blog/${post.slug}`}><img src={post.featuredImage} alt={post.imageAlt || post.title} loading="lazy" /></Link>
                    ) : (
                      <div className="blog-card-image blog-card-image-placeholder" aria-hidden="true"><ClinicIcon name="tooth" size={30}/></div>
                    )}
                    <div className="blog-card-content">
                      <div className="blog-card-meta"><span>{post.category}</span><span>{post.readTime}</span></div>
                      <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                      <p>{post.excerpt}</p>
                      <Link className="blog-read-link" href={`/blog/${post.slug}`}>Read guide <ClinicIcon name="arrow" size={16}/></Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="treatment-catalogue related-treatments">
          <div className="container">
            <div className="section-heading"><p className="section-mark">✦</p><h2>Explore other treatments</h2></div>
            <div className="catalogue-grid">
              {treatments.filter((item) => item.slug !== treatment.slug).slice(0, 3).map((item) => (
                <Link className="catalogue-card" href={`/treatments/${item.slug}`} key={item.slug}>
                  <span className="catalogue-icon"><ClinicIcon name={item.icon} size={24}/></span>
                  <div><h3>{item.name}</h3><p>{item.description}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c") }} />
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />}
      </main>
      <SiteFooter />
    </>
  );
}
