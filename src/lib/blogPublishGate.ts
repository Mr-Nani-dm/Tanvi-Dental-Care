import type { BlogPost } from "@/content/blog";

const blocked = [
  "guaranteed",
  "100" + "%" + " painless",
  "permanent solution",
  "best dental clinic",
  "best dentist",
  "celebrity smile",
  "flawless smile",
];

export function publishBlockers(post: Partial<BlogPost>) {
  const content = [post.title, post.excerpt, post.seoTitle, post.metaDescription, post.body]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const issues: string[] = [];

  for (const phrase of blocked) {
    if (content.includes(phrase)) issues.push(`Remove unsupported promotional or absolute claim: ${phrase}.`);
  }

  if (!post.primaryTopic?.trim()) issues.push("Add one clear primary patient/search topic before publishing.");
  if (post.featuredImage && !post.imageAlt?.trim()) issues.push("Add descriptive alt text for the featured image.");

  const hasReviewer = Boolean(post.reviewedBy?.trim());
  const hasReviewDate = Boolean(post.reviewedAt?.trim());
  if (hasReviewer !== hasReviewDate) issues.push("Reviewer name and review date must both be completed or both be blank.");

  return issues;
}
