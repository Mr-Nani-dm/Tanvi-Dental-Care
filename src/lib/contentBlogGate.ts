import type { BlogPost } from "@/content/blog";
import type { ContentPackage, HistoryStore } from "./contentTypes";
import { readRepoJson } from "./githubContent";
import { HISTORY_PATH } from "./contentStore";
import { validatePackage } from "./contentValidation";
import { reviewDraft, aiSetup } from "./contentAi";
import { reserveAiCall } from "./contentStore";
import { retrieveSources } from "./contentSources";
import { doctors } from "@/config/site";

/** Blog Manager remains the only publisher. Content OS drafts retain their
 * source/word/frequency safeguards even if edited after the handoff. */
export async function contentBlogPublishBlockers(post: BlogPost, blogs: BlogPost[]) {
  const { value } = await readRepoJson<HistoryStore>(HISTORY_PATH);
  const original = value.packages.find(item => item.id === post.contentOsId);
  if (!original?.blog || !original.blogSlug) return ["This handoff's source record is missing."];
  if (!post.reviewedBy?.trim() || !post.reviewedAt?.trim()) return ["A clinician must review the article and record their real name and review date before publication."];
  const normalizedName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");
  if (!doctors.some(doctor => normalizedName(doctor.name) === normalizedName(post.reviewedBy!))) return ["Record the name of the Tanvi clinician who actually reviewed this article."];
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const reviewTime = Date.parse(`${post.reviewedAt}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.reviewedAt) || !Number.isFinite(reviewTime) || new Date(reviewTime).toISOString().slice(0, 10) !== post.reviewedAt || post.reviewedAt > today) return ["Enter a valid review date that is not in the future."];
  if (!aiSetup().textReady) return ["The independent review service must be configured before publishing this Content OS article."];
  const pkg: ContentPackage = {
    ...original, formats: ["blog"], gbp: null, instagram: null, reel: null,
    blog: { ...original.blog, title: post.title, slug: post.slug, body: post.body, excerpt: post.excerpt, seoTitle: post.seoTitle || post.title, metaDescription: post.metaDescription, primaryTopic: post.primaryTopic || "", tags: post.tags, treatmentSlug: post.treatmentSlug || "dental-check-ups", cta: post.contentOsCta || original.blog.cta },
    safety: { status: "PENDING", checks: [], checkedAt: null, wordCounts: {}, aiReview: null },
  };
  const local = validatePackage(pkg, value.packages, blogs);
  const blockers = local.checks.filter(check => check.status === "NEEDS_REVIEW").flatMap(check => check.messages);
  if (blockers.length) return blockers;
  pkg.sources = await retrieveSources(pkg.topic);
  await reserveAiCall("text");
  pkg.safety.aiReview = await reviewDraft({ package: pkg, history: value.packages, blogs });
  const checked = validatePackage(pkg, value.packages, blogs);
  return checked.checks.filter(check => check.status === "NEEDS_REVIEW").flatMap(check => check.messages);
}
