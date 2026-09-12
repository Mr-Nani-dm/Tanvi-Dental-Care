import type { BlogPost } from "@/content/blog";

export type SeoCheck = {
  label: string;
  passed: boolean;
  points: number;
  guidance: string;
};

function wordCount(body: string) {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadTime(body: string) {
  const minutes = Math.max(1, Math.ceil(wordCount(body) / 220));
  return `${minutes} min read`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function seoChecks(post: Partial<BlogPost>): SeoCheck[] {
  const title = (post.seoTitle || post.title || "").trim();
  const description = (post.metaDescription || "").trim();
  const body = post.body || "";
  const image = Boolean(post.featuredImage);
  const alt = Boolean(post.imageAlt?.trim());
  const internalLinks = (body.match(/\]\(\//g) || []).length;
  const headingCount = (body.match(/^##\s+/gm) || []).length;
  const words = wordCount(body);

  return [
    { label: "SEO title", passed: title.length >= 35 && title.length <= 65, points: 15, guidance: "Aim for 35–65 characters." },
    { label: "Meta description", passed: description.length >= 110 && description.length <= 165, points: 15, guidance: "Aim for 110–165 characters." },
    { label: "Clean URL slug", passed: Boolean(post.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)), points: 10, guidance: "Use a short lowercase hyphenated URL." },
    { label: "Featured image", passed: image, points: 10, guidance: "Add a relevant featured image." },
    { label: "Image alt text", passed: !image || alt, points: 10, guidance: "Describe the image for accessibility and search." },
    { label: "Related treatment", passed: Boolean(post.treatmentSlug), points: 10, guidance: "Link the article to the most relevant treatment page." },
    { label: "Useful article depth", passed: words >= 400, points: 15, guidance: `Current length: ${words} words. Aim for at least 400 useful words.` },
    { label: "Clear section headings", passed: headingCount >= 2, points: 5, guidance: "Use at least two H2 sections." },
    { label: "Internal link", passed: internalLinks >= 1 || Boolean(post.treatmentSlug), points: 5, guidance: "Link to useful pages on the Tanvi website." },
    { label: "Primary search topic", passed: Boolean(post.primaryTopic?.trim()), points: 5, guidance: "Set the main patient question or topic." },
  ];
}

export function seoScore(post: Partial<BlogPost>) {
  return seoChecks(post).reduce((score, check) => score + (check.passed ? check.points : 0), 0);
}
