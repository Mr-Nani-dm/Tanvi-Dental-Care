import data from "./blog-data.json";

export type BlogStatus = "draft" | "published";
export type SeoExceptionRule = "topic-title" | "topic-intro";

export type SeoValidationException = {
  id: string;
  phrase: string;
  rules: SeoExceptionRule[];
  reason: string;
  createdAt: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: BlogStatus;
  publishedAt?: string;
  updatedAt?: string;
  readTime: string;
  treatmentSlug?: string;
  featuredImage?: string;
  imageAlt?: string;
  seoTitle?: string;
  metaDescription: string;
  primaryTopic?: string;
  seoExceptions?: SeoValidationException[];
  author: string;
  reviewedBy?: string;
  reviewedAt?: string;
  tags: string[];
  body: string;
};

export const allBlogPosts = data as unknown as BlogPost[];

export const blogPosts = allBlogPosts
  .filter((post) => post.status === "published")
  .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(post: BlogPost, limit = 2) {
  return blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      let score = 0;
      if (post.treatmentSlug && candidate.treatmentSlug === post.treatmentSlug) score += 5;
      if (candidate.category === post.category) score += 3;
      const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag)).length;
      score += sharedTags;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || (b.candidate.publishedAt || "").localeCompare(a.candidate.publishedAt || ""))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function getTreatmentBlogPosts(treatmentSlug: string, limit = 3) {
  return blogPosts
    .filter((post) => post.treatmentSlug === treatmentSlug)
    .slice(0, limit);
}
