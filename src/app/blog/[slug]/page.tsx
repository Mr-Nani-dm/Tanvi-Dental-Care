import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogBody from "@/components/BlogBody";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ClinicIcon from "@/components/ui/ClinicIcon";
import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { blogPosts, getBlogPost, getRelatedBlogPosts } from "@/content/blog";

const siteUrl = siteConfig.url;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Dental Health Guide" };
  const image = post.featuredImage ? [{ url: post.featuredImage, alt: post.imageAlt || post.title }] : undefined;

  return {
    title: { absolute: post.seoTitle || post.title },
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.metaDescription,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author],
      images: image,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.metaDescription,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getRelatedBlogPosts(post, 2);
  const articleUrl = `${siteUrl}/blog/${post.slug}`;
  const treatmentUrl = post.treatmentSlug ? `/treatments/${post.treatmentSlug}` : "/treatments";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: articleUrl,
    ...(post.featuredImage ? { image: `${siteUrl}${post.featuredImage}` } : {}),
    author: { "@type": "Organization", name: post.author, url: siteUrl },
    ...(post.reviewedBy ? { reviewedBy: { "@type": "Person", name: post.reviewedBy } } : {}),
    publisher: { "@type": "Organization", name: "Tanvi Dental Care & Implant Centre", url: siteUrl },
    about: post.primaryTopic || post.category,
    keywords: post.tags.join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Dental Health Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="blog-post-page">
        <section className="blog-post-hero">
          <div className="container blog-post-hero-inner">
            <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span aria-current="page">{post.category}</span></nav>
            <div className="blog-post-meta"><span>{post.category}</span><span>{post.readTime}</span></div>
            <h1>{post.title}</h1>
            <p>{post.excerpt}</p>
            <div className="blog-byline"><span>Written by {post.author}</span>{post.publishedAt && <time dateTime={post.publishedAt}>{new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</time>}{post.reviewedBy && <span>Clinically reviewed by {post.reviewedBy}{post.reviewedAt ? ` · ${new Date(`${post.reviewedAt}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</span>}</div>
            {post.featuredImage && <figure className="blog-featured-image"><img src={post.featuredImage} alt={post.imageAlt || post.title} /><figcaption>{post.imageAlt}</figcaption></figure>}
          </div>
        </section>

        <section className="blog-article-section">
          <div className="container blog-article-layout">
            <article className="blog-article">
              <div className="blog-medical-note"><ClinicIcon name="info" size={18}/><p><strong>Important:</strong> This article provides general dental education. It is not a diagnosis and cannot determine which treatment is appropriate for you.</p></div>
              <BlogBody body={post.body} />
              <div className="blog-treatment-link"><div><p className="eyebrow">Related patient information</p><h2>Read the related treatment guide</h2><p>Explore the clinic's treatment information, including the reminder that suitability is confirmed after clinical assessment.</p></div><Link className="btn btn-secondary" href={treatmentUrl}>View Treatment <ClinicIcon name="arrow" size={16}/></Link></div>
            </article>

            <aside className="blog-sidebar"><div className="blog-sidebar-card"><p className="eyebrow">Need individual advice?</p><h2>Speak with the clinic.</h2><p>A dentist can assess your symptoms and explain the options appropriate for your situation.</p><a className="btn btn-primary" href={clinic.phoneHref}><ClinicIcon name="phone" size={18}/>Call {clinic.phone}</a><a className="btn btn-secondary" href={clinic.whatsappHref}><ClinicIcon name="whatsapp" size={18}/>WhatsApp</a></div></aside>
          </div>
        </section>

        {related.length > 0 && <section className="related-blog-section"><div className="container"><div className="section-heading"><p className="section-mark">✦</p><h2>Continue Reading</h2></div><div className="blog-grid blog-grid-related">{related.map((item) => <article className="blog-card" key={item.slug}>{item.featuredImage && <Link className="blog-card-image" href={`/blog/${item.slug}`}><img src={item.featuredImage} alt={item.imageAlt || item.title} loading="lazy" /></Link>}<div className="blog-card-content"><div className="blog-card-meta"><span>{item.category}</span><span>{item.readTime}</span></div><h2><Link href={`/blog/${item.slug}`}>{item.title}</Link></h2><p>{item.excerpt}</p><Link className="blog-read-link" href={`/blog/${item.slug}`}>Read guide <ClinicIcon name="arrow" size={16}/></Link></div></article>)}</div></div></section>}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />
      </main>
      <SiteFooter />
    </>
  );
}
