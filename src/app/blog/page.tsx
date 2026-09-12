import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic } from "@/config/clinic";
import { blogPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Dental Health Blog",
  description: "Patient-friendly dental health guides from Tanvi Dental Care & Implant Centre in Mangalagiri, including tooth pain, treatments and preventive care.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Dental Health Blog | Tanvi Dental Care",
    description: "Clear, patient-friendly dental education from Tanvi Dental Care & Implant Centre in Mangalagiri.",
    type: "website",
    url: "/blog",
  },
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main className="blog-page">
        <section className="blog-hero">
          <div className="container blog-hero-inner">
            <div>
              <p className="eyebrow">Dental Health Library</p>
              <h1>Clear dental guidance for everyday questions.</h1>
              <p className="blog-hero-copy">Practical, patient-friendly articles designed to help you understand common dental concerns before you speak with a dentist.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a>
                <a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>Ask on WhatsApp</a>
              </div>
            </div>
            <aside className="blog-hero-note" aria-label="Medical information note"><ClinicIcon name="info" size={20}/><div><strong>Educational information only</strong><p>Articles are general guidance and do not replace an examination, diagnosis or personalised treatment plan.</p></div></aside>
          </div>
        </section>

        <section className="blog-index-section">
          <div className="container">
            <div className="section-heading blog-index-heading"><p className="section-mark">✦</p><h2>Latest Dental Guides</h2><p>Useful reading connected to the treatment information already available on this website.</p></div>
            <div className="blog-grid">
              {blogPosts.map((post) => (
                <article className="blog-card" key={post.slug}>
                  {post.featuredImage ? <Link className="blog-card-image" href={`/blog/${post.slug}`}><img src={post.featuredImage} alt={post.imageAlt || post.title} loading="lazy" /></Link> : <div className="blog-card-image blog-card-image-placeholder" aria-hidden="true"><ClinicIcon name="tooth" size={34}/></div>}
                  <div className="blog-card-content">
                    <div className="blog-card-meta"><span>{post.category}</span><span>{post.readTime}</span></div>
                    <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                    <p>{post.excerpt}</p>
                    <div className="blog-card-footer"><time dateTime={post.publishedAt}>{post.publishedAt ? new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</time><Link className="blog-read-link" href={`/blog/${post.slug}`}>Read guide <ClinicIcon name="arrow" size={16}/></Link></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="blog-topic-strip"><div className="container blog-topic-inner"><div><p className="eyebrow">Looking for treatment information?</p><h2>Explore the treatment catalogue.</h2><p>Read concise treatment pages, then contact the clinic if you need an individual assessment.</p></div><Link className="btn btn-secondary" href="/treatments">View Treatments <ClinicIcon name="arrow" size={16}/></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
