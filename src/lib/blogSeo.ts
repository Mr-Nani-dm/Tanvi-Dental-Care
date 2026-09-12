import type { BlogPost } from "@/content/blog";
import { treatments } from "@/config/clinic";

export type SeoCheck = {
  label: string;
  passed: boolean;
  points: number;
  guidance: string;
};

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function cleanText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*>]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function includesTopic(value: string, topic?: string) {
  const target = normalize(topic || "");
  return Boolean(target && normalize(value).includes(target));
}

function firstParagraph(body: string) {
  return body.split(/\n\n+/).map((block) => block.trim()).find((block) => block && !block.startsWith("#") && !block.startsWith("!") && !block.startsWith("- ")) || "";
}

function sentences(body: string) {
  return cleanText(body).split(/[.!?]+(?:\s|$)/).map((item) => item.trim()).filter(Boolean);
}

function paragraphs(body: string) {
  return body.split(/\n\n+/).map((block) => block.trim()).filter((block) => block && !block.startsWith("#") && !block.startsWith("!") && !block.startsWith("- ")).map(cleanText).filter(Boolean);
}

function scoreChecks(checks: SeoCheck[]) {
  const total = checks.reduce((sum, check) => sum + check.points, 0);
  const earned = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0);
  return total ? Math.round((earned / total) * 100) : 0;
}

export function estimateReadTime(body: string) {
  const minutes = Math.max(1, Math.ceil(wordCount(cleanText(body)) / 220));
  return `${minutes} min read`;
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function technicalSeoChecks(post: Partial<BlogPost>): SeoCheck[] {
  const title = (post.seoTitle || post.title || "").trim();
  const description = (post.metaDescription || "").trim();
  const body = post.body || "";
  const topic = post.primaryTopic?.trim();
  const image = Boolean(post.featuredImage);
  const alt = Boolean(post.imageAlt?.trim());
  const headings = (body.match(/^##\s+/gm) || []).length;
  const internalLinks = (body.match(/\]\(\//g) || []).length;
  const treatment = treatments.find((item) => item.slug === post.treatmentSlug);
  const linkGuidance = treatment ? `Suggested internal destination: ${treatment.name} (/treatments/${treatment.slug}).` : "Select the most relevant treatment so the article can link into the clinic content structure.";

  return [
    { label: "SEO · Title", passed: title.length >= 35 && title.length <= 65, points: 14, guidance: `Current: ${title.length} characters. Aim for roughly 35–65.` },
    { label: "SEO · Meta description", passed: description.length >= 110 && description.length <= 165, points: 14, guidance: `Current: ${description.length} characters. Aim for roughly 110–165.` },
    { label: "SEO · Clean URL", passed: Boolean(post.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)), points: 8, guidance: "Use a short lowercase hyphenated URL." },
    { label: "SEO · Featured image", passed: image, points: 8, guidance: "Add a relevant featured image for the article and social sharing." },
    { label: "SEO · Image alt text", passed: !image || alt, points: 8, guidance: "Describe what the image shows in plain language." },
    { label: "SEO · Focus topic", passed: Boolean(topic), points: 10, guidance: "Set one natural patient search topic rather than a list of keyword variants." },
    { label: "SEO · Topic in title", passed: Boolean(topic && includesTopic(title, topic)), points: 10, guidance: "Use the focus topic naturally in the search title when it reads well." },
    { label: "SEO · Topic introduced early", passed: Boolean(topic && includesTopic(firstParagraph(body), topic)), points: 8, guidance: "Introduce the main topic naturally in the opening paragraph." },
    { label: "SEO · Clear H2 sections", passed: headings >= 2, points: 8, guidance: "Use at least two descriptive H2 sections." },
    { label: "SEO · Internal linking", passed: internalLinks >= 1 || Boolean(post.treatmentSlug), points: 12, guidance: linkGuidance },
  ];
}

function readabilityChecks(post: Partial<BlogPost>): SeoCheck[] {
  const body = post.body || "";
  const bodyText = cleanText(body);
  const allSentences = sentences(body);
  const sentenceLengths = allSentences.map(wordCount);
  const averageSentence = sentenceLengths.length ? sentenceLengths.reduce((sum, count) => sum + count, 0) / sentenceLengths.length : 0;
  const longSentenceRatio = sentenceLengths.length ? sentenceLengths.filter((count) => count > 28).length / sentenceLengths.length : 1;
  const allParagraphs = paragraphs(body);
  const longestParagraph = allParagraphs.length ? Math.max(...allParagraphs.map(wordCount)) : 0;
  const introWords = wordCount(cleanText(firstParagraph(body)));
  const headings = (body.match(/^##\s+/gm) || []).length;
  const words = wordCount(bodyText);
  const hasList = /^-\s+/m.test(body);

  return [
    { label: "Readability · Clear opening", passed: introWords >= 20 && introWords <= 100, points: 18, guidance: `Opening paragraph: ${introWords} words. Give patients a concise orientation first.` },
    { label: "Readability · Sentence length", passed: averageSentence > 0 && averageSentence <= 24, points: 22, guidance: `Average sentence length: ${averageSentence ? averageSentence.toFixed(1) : "0"} words.` },
    { label: "Readability · Dense sentences", passed: longSentenceRatio <= 0.25, points: 18, guidance: `${Math.round(longSentenceRatio * 100)}% of sentences are over 28 words. Split dense sentences where useful.` },
    { label: "Readability · Short paragraphs", passed: longestParagraph > 0 && longestParagraph <= 120, points: 18, guidance: `Longest paragraph: ${longestParagraph} words. Keep mobile reading comfortable.` },
    { label: "Readability · Scannable sections", passed: headings >= 2, points: 14, guidance: "Use descriptive H2 headings so patients can scan the article." },
    { label: "Readability · Lists for long guides", passed: words < 600 || hasList, points: 10, guidance: "For longer guides, a short list can make steps or takeaways easier to scan." },
  ];
}

function trustChecks(post: Partial<BlogPost>): SeoCheck[] {
  const content = cleanText(`${post.title || ""} ${post.excerpt || ""} ${post.body || ""}`);
  const normalized = normalize(content);
  const absoluteClaims = ["guaranteed", "100 safe", "100% safe", "completely painless", "permanent cure", "no risk", "best dentist", "best dental clinic"];
  const certaintyClaims = ["you definitely have", "this proves you have", "this means you have", "you certainly have"];
  const hasAbsoluteClaim = absoluteClaims.some((phrase) => normalized.includes(normalize(phrase)));
  const hasCertaintyClaim = certaintyClaims.some((phrase) => normalized.includes(normalize(phrase)));
  const reviewer = Boolean(post.reviewedBy?.trim());
  const reviewDate = Boolean(post.reviewedAt?.trim());
  const assessmentFraming = /(dentist|clinical).*(assess|assessment|examin|diagnos)|depends on|individual case|treatment plan/i.test(content);

  return [
    { label: "Trust · Content owner", passed: Boolean(post.author?.trim()), points: 15, guidance: "Keep a clear author or editorial owner for the article." },
    { label: "Trust · Reviewer details", passed: (reviewer && reviewDate) || (!reviewer && !reviewDate), points: 15, guidance: "If a doctor is named as reviewer, include the actual review date. Otherwise leave both blank." },
    { label: "Trust · Review completed", passed: reviewer && reviewDate, points: 15, guidance: "Recommended for treatment guidance. Add a reviewer only after the review has genuinely happened." },
    { label: "Trust · No absolute promises", passed: !hasAbsoluteClaim, points: 20, guidance: hasAbsoluteClaim ? "Remove absolute promotional or outcome promises." : "No obvious absolute outcome language detected." },
    { label: "Trust · No certainty diagnosis", passed: !hasCertaintyClaim, points: 20, guidance: hasCertaintyClaim ? "Avoid telling a reader they definitely have a condition without examination." : "No obvious certainty-based diagnosis language detected." },
    { label: "Trust · Assessment-first wording", passed: assessmentFraming, points: 15, guidance: "Remind readers that diagnosis and treatment suitability depend on examination or individual findings." },
  ];
}

export function seoChecks(post: Partial<BlogPost>): SeoCheck[] {
  const seo = technicalSeoChecks(post);
  const readability = readabilityChecks(post);
  const trust = trustChecks(post);
  const seoValue = scoreChecks(seo);
  const readabilityValue = scoreChecks(readability);
  const trustValue = scoreChecks(trust);

  return [
    { label: `SEO score · ${seoValue}/100`, passed: seoValue >= 80, points: 0, guidance: "Search presentation, topic clarity, image metadata and internal linking." },
    { label: `Readability score · ${readabilityValue}/100`, passed: readabilityValue >= 80, points: 0, guidance: "Patient-friendly sentence, paragraph and section structure." },
    { label: `Trust score · ${trustValue}/100`, passed: trustValue >= 80, points: 0, guidance: "Authorship, review consistency and careful health-content wording." },
    ...seo,
    ...readability,
    ...trust,
  ];
}

export function seoScore(post: Partial<BlogPost>) {
  const seo = scoreChecks(technicalSeoChecks(post));
  const readability = scoreChecks(readabilityChecks(post));
  const trust = scoreChecks(trustChecks(post));
  return Math.round(seo * 0.45 + readability * 0.3 + trust * 0.25);
}
