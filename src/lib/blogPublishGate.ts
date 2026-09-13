import type { BlogPost } from "@/content/blog";

const hardBlocked = [
  "guaranteed",
  "100" + "%" + " painless",
  "permanent solution",
];

const editorialBlocked = [
  "best dental clinic",
  "best dentist",
  "celebrity smile",
  "flawless smile",
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s%]/g, " ").replace(/\s+/g, " ").trim();
}

function isEditoriallyExempt(post: Partial<BlogPost>, phrase: string) {
  const target = normalize(phrase);
  return (post.seoExceptions || []).some((exception) => {
    const allowed = normalize(exception.phrase || "");
    return Boolean(allowed && (target.includes(allowed) || allowed.includes(target)));
  });
}

export function publishBlockers(post: Partial<BlogPost>) {
  const content = normalize([post.title, post.excerpt, post.seoTitle, post.metaDescription, post.body]
    .filter(Boolean)
    .join(" "));
  const issues: string[] = [];

  for (const phrase of hardBlocked) {
    if (content.includes(normalize(phrase))) {
      issues.push(`Remove unsupported medical, outcome or permanence claim: ${phrase}.`);
    }
  }

  for (const phrase of editorialBlocked) {
    if (content.includes(normalize(phrase)) && !isEditoriallyExempt(post, phrase)) {
      issues.push(`Remove unsupported promotional claim or add an approved SEO exception: ${phrase}.`);
    }
  }

  if (!post.primaryTopic?.trim()) issues.push("Add one clear primary patient/search topic before publishing.");
  if (post.featuredImage && !post.imageAlt?.trim()) issues.push("Add descriptive alt text for the featured image.");

  const hasReviewer = Boolean(post.reviewedBy?.trim());
  const hasReviewDate = Boolean(post.reviewedAt?.trim());
  if (hasReviewer !== hasReviewDate) issues.push("Reviewer name and review date must both be completed or both be blank.");

  return issues;
}
