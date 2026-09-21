import type { BlogPost } from "@/content/blog";
import { isApprovedArticleImage } from "./articleImages";

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
  "best dental clinic",
  "best dentist",
  "world class",
  "celebrity smile",
  "flawless smile",
];

const editorialWarnings = [
  "advanced",
  "affordable",
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s%]/g, " ").replace(/\s+/g, " ").trim();
}

function wholeArticleText(post: Partial<BlogPost>) {
  return normalize([post.title, post.excerpt, post.seoTitle, post.metaDescription, post.body]
    .filter(Boolean)
    .join(" "));
}

function hasArticleImage(post: Partial<BlogPost>) {
  return Boolean(post.featuredImage?.trim() || /!\[[^\]]*\]\([^)]+\)/.test(post.body || ""));
}

function invalidArticleImages(post: Partial<BlogPost>) {
  const sources = [post.featuredImage || "", ...Array.from((post.body || "").matchAll(/!\[[^\]]*\]\(([^)]+)\)/g), (match) => match[1])]
    .map((source) => source.trim())
    .filter(Boolean);
  return sources.filter((source) => !isApprovedArticleImage(source));
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
    blockers.push("Accessibility check: add accurate alt text for the featured image.");
  }

  if (Array.from((post.body || "").matchAll(/!\[([^\]]*)\]\([^)]+\)/g), (match) => match[1]).some((alt) => !alt.trim())) {
    blockers.push("Accessibility check: add accurate alt text for every inline image.");
  }

  if (hasArticleImage(post) && post.imageRightsConfirmed !== true) {
    blockers.push("Image rights check: confirm that every article image is clinic-owned, properly licensed or otherwise authorised for this publication.");
  }

  if (invalidArticleImages(post).length) {
    blockers.push("Image source check: article images must use files uploaded to the local blog image library.");
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
