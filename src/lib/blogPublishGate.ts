import type { BlogPost } from "@/content/blog";

export type PublishValidation = {
  blockers: string[];
  warnings: string[];
  exempted: string[];
};

const hardBlocked = [
  "guaranteed",
  "100" + "%" + " painless",
  "completely painless",
  "permanent solution",
  "permanent cure",
  "no risk",
  "zero risk",
  "you definitely have",
  "this proves you have",
  "this means you have",
  "you certainly have",
];

const editorialWarnings = [
  "best dental clinic",
  "best dentist",
  "world class",
  "advanced",
  "affordable",
  "celebrity smile",
  "flawless smile",
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s%]/g, " ").replace(/\s+/g, " ").trim();
}

function wholeArticleText(post: Partial<BlogPost>) {
  return normalize([post.title, post.excerpt, post.seoTitle, post.metaDescription, post.body]
    .filter(Boolean)
    .join(" "));
}

function isEditoriallyExempt(post: Partial<BlogPost>, phrase: string) {
  const target = normalize(phrase);
  return (post.seoExceptions || []).some((exception) => {
    const allowed = normalize(exception.phrase || "");
    return Boolean(allowed && (target.includes(allowed) || allowed.includes(target)));
  });
}

export function publishValidation(post: Partial<BlogPost>): PublishValidation {
  const content = wholeArticleText(post);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const exempted: string[] = [];

  for (const phrase of hardBlocked) {
    if (content.includes(normalize(phrase))) {
      blockers.push(`Medical/trust blocker: review or remove the absolute claim “${phrase}”.`);
    }
  }

  for (const phrase of editorialWarnings) {
    if (!content.includes(normalize(phrase))) continue;
    if (isEditoriallyExempt(post, phrase)) {
      exempted.push(`Accepted editorial exception: ${phrase}.`);
    } else {
      warnings.push(`Review promotional wording or add an SEO exception if intentional: ${phrase}.`);
    }
  }

  if (!post.primaryTopic?.trim()) {
    warnings.push("Primary search topic is empty. Recommended for SEO, but it does not block publishing.");
  }

  if (post.featuredImage && !post.imageAlt?.trim()) {
    warnings.push("Featured image alt text is missing. Recommended for accessibility and SEO, but it does not block publishing.");
  }

  const hasReviewer = Boolean(post.reviewedBy?.trim());
  const hasReviewDate = Boolean(post.reviewedAt?.trim());
  if (hasReviewer !== hasReviewDate) {
    blockers.push("Reviewer integrity check: reviewer name and review date must both be completed or both be blank.");
  }

  return { blockers, warnings, exempted };
}

export function publishBlockers(post: Partial<BlogPost>) {
  return publishValidation(post).blockers;
}
