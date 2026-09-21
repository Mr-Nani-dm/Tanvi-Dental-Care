import { CONTENT_POLICY } from "@/config/content-policy";
import { clinic, treatments } from "@/config/clinic";
import { doctors } from "@/config/site";
import { findClaimIssues, findJurisdictionIssues, findMedicalIssues, findPrivateInputIssues, normaliseSafetyText } from "@/config/content-safety";
import { isApprovedInternalUrl, isApprovedSourceUrl } from "@/config/content-sources";
import type { BlogPost } from "@/content/blog";
import type { AiReview, ContentDraft, ContentFormat, ContentPackage, DailyAnswers, EvidenceType, SafetyCheck, SafetyResult, TopicIdea } from "@/lib/contentTypes";
import { checkDuplicates } from "@/lib/duplicateChecker";
import { countWords, visibleText } from "@/lib/contentText";
export { countWords, visibleText } from "@/lib/contentText";

const objectives = ["auto", "local_discovery", "patient_education", "treatment_awareness", "doctor_trust", "preventive_care"] as const;
const focusTreatments = ["auto", "root-canal-treatment", "dental-implants", "wisdom-tooth-management", "teeth-cleaning-and-scaling", "general-dental-care"] as const;
const publishedTreatmentSlugs = new Set<string>(treatments.map((treatment) => treatment.slug));
const knownTreatmentSlugs = new Set<string>([...publishedTreatmentSlugs, "general-dental-care"]);
const evidenceTypes: EvidenceType[] = ["GSC_SIGNAL", "SERP_OBSERVATION", "SEASONAL_OPPORTUNITY", "CONTENT_GAP", "MANUAL_IDEA"];

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim()) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new Error(`${label} must be ${allowEmpty ? "" : "non-empty "}text of at most ${max} characters.`);
  return value.trim();
}
function member<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new Error(`${label} is not supported.`);
  return value as T;
}
function list<T>(value: unknown, label: string, max: number, parse: (item: unknown, index: number) => T): T[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${label} must be an array with at most ${max} entries.`);
  return value.map(parse);
}
function boolean(value: unknown, label: string) {
  if (typeof value !== "boolean") throw new Error(`${label} must be true or false.`);
  return value;
}

export function validateDailyAnswers(value: unknown): DailyAnswers {
  const input = record(value, "Daily answers");
  const special = string(input.special ?? "", "Today's update", CONTENT_POLICY.specialMaxCharacters, true);
  const issues = findPrivateInputIssues(special);
  if (issues.length) throw new Error(issues.join(" "));
  if (/\b(?:ignore\s+(?:all|previous|the)\s+instructions|system\s+prompt|developer\s+message)\b/i.test(special)) throw new Error("Please enter a clinic update or educational topic only.");
  return { objective: member(input.objective, objectives, "Objective"), treatment: member(input.treatment, focusTreatments, "Treatment focus"), special };
}

export function validateTopicIdea(value: unknown): TopicIdea {
  const input = record(value, "Topic");
  const evidence = record(input.evidence, "Topic evidence");
  const type = member(evidence.type, evidenceTypes, "Evidence type");
  // V1 has no live Search Console or SERP ingestion; a model-supplied label is not evidence.
  if (type === "GSC_SIGNAL" || type === "SERP_OBSERVATION") throw new Error("Live search evidence is not connected in V1. Use an honest content-gap, seasonal or manual idea label.");
  const sourceUrl = evidence.sourceUrl == null ? undefined : string(evidence.sourceUrl, "Evidence URL", 1000);
  if (sourceUrl && !isApprovedSourceUrl(sourceUrl) && !isApprovedInternalUrl(sourceUrl)) throw new Error("Topic evidence URL is not approved.");
  const formats = [...new Set(list(input.recommendedFormats, "Recommended formats", 5, (format) => member(format, CONTENT_POLICY.formats, "Content format")))];
  if (!formats.length || (formats.includes("instagram_static") && formats.includes("instagram_carousel"))) throw new Error("Choose at least one format and only one Instagram format per package.");
  const treatmentSlug = string(input.treatmentSlug, "Treatment", 100);
  if (!knownTreatmentSlugs.has(treatmentSlug)) throw new Error("Topic treatment is not in the clinic catalogue.");
  const targetPage = string(input.targetPage, "Target page", 1000);
  if (!isApprovedInternalUrl(targetPage)) throw new Error("Topic target page is not an approved clinic URL.");
  const topic: TopicIdea = {
    id: string(input.id, "Topic ID", 100), title: string(input.title, "Topic title", 180), primaryKeyword: string(input.primaryKeyword, "Primary keyword", 160),
    intent: string(input.intent, "Search intent", 300), treatmentSlug, angle: string(input.angle, "Topic angle", 400), rationale: string(input.rationale, "Topic rationale", 1000),
    psychology: string(input.psychology, "Psychology", 160), targetPage, evidence: { type, reason: string(evidence.reason, "Evidence explanation", 1000), ...(sourceUrl ? { sourceUrl } : {}) },
    blogRecommended: boolean(input.blogRecommended, "Blog recommendation"), recommendedFormats: formats,
    duplicate: { status: "NEW", score: 0, reason: "Awaiting deterministic comparison against current content." },
    ...(input.token == null ? {} : { token: string(input.token, "Topic token", 8000) }),
  };
  if (!/^[a-zA-Z0-9_-]+$/.test(topic.id)) throw new Error("Topic ID contains unsupported characters.");
  const topicText = [topic.title, topic.primaryKeyword, topic.intent, topic.angle, topic.rationale, topic.psychology, topic.evidence.reason].join(" ");
  const issues = [...findClaimIssues(topicText), ...findMedicalIssues(topicText), ...findJurisdictionIssues(topicText), ...findPrivateInputIssues(topicText)];
  if (/\b(?:trending|high\s+seo\s+opportunity|high\s+search\s+volume|fastest\s+growing\s+search)\b/i.test(topicText)) issues.push("Do not imply measured search demand without verified search data.");
  if (issues.length) throw new Error(issues.join(" "));
  return topic;
}

export function contentWorthiness(topic: TopicIdea): { blogRecommended: boolean; recommendedFormats: ContentFormat[]; reason: string } {
  const overlap = topic.duplicate.status === "TOO_SIMILAR" || topic.duplicate.status === "DUPLICATE";
  const shortUpdate = /\b(?:festival\s+greeting|happy\s+(?:diwali|holi|new\s+year)|clinic\s+(?:timings|hours|update)|doctor\s+availability|holiday\s+hours)\b/i.test(`${topic.title} ${topic.angle}`);
  const blogRecommended = topic.blogRecommended && !overlap && !shortUpdate;
  return {
    blogRecommended,
    recommendedFormats: topic.recommendedFormats.filter((format) => format !== "blog" || blogRecommended),
    reason: overlap ? "Reuse existing material or make a distinct social post; another blog is not recommended."
      : shortUpdate ? "A short clinic or seasonal update is suitable for social content rather than a new blog."
      : blogRecommended ? "A distinct educational explanation may justify a blog after review." : "Use the selected social formats for this topic.",
  };
}

export function validateTopics(value: unknown, candidates: Array<Partial<TopicIdea>>, allowedFormats: ContentFormat[] = [...CONTENT_POLICY.formats]): TopicIdea[] {
  if (!Array.isArray(value) || value.length !== CONTENT_POLICY.topicCount) throw new Error("The planner must return exactly three topic ideas.");
  const validated: TopicIdea[] = [];
  for (const raw of value) {
    const topic = validateTopicIdea(raw);
    if (validated.some((other) => other.id === topic.id)) throw new Error("Topic IDs must be unique.");
    topic.duplicate = checkDuplicates(topic, [...candidates, ...validated]);
    if (topic.duplicate.status === "DUPLICATE") throw new Error("A topic duplicates existing content. Generate a different patient question.");
    const worthiness = contentWorthiness(topic);
    topic.blogRecommended = worthiness.blogRecommended;
    topic.recommendedFormats = worthiness.recommendedFormats.filter((format) => allowedFormats.includes(format));
    if (!topic.recommendedFormats.length) throw new Error("A proposed idea has no available format within the content policy.");
    validated.push(topic);
  }
  return validated;
}

export function validateContentDraft(value: unknown): ContentDraft {
  const input = record(value, "Content draft");
  const b = input.blog == null ? null : record(input.blog, "Blog");
  const g = input.gbp == null ? null : record(input.gbp, "GBP");
  const i = input.instagram == null ? null : record(input.instagram, "Instagram");
  const r = input.reel == null ? null : record(input.reel, "Reel");
  const image = record(input.imageBrief, "Image brief");
  const blog = b ? {
    title: string(b.title, "Blog title", 180), slug: string(b.slug, "Blog slug", 150), excerpt: string(b.excerpt, "Blog excerpt", 500), body: string(b.body, "Blog body", 25000),
    seoTitle: string(b.seoTitle, "SEO title", 180), metaDescription: string(b.metaDescription, "Meta description", 500), primaryTopic: string(b.primaryTopic, "Blog primary topic", 180),
    tags: list(b.tags, "Blog tags", 8, (tag) => string(tag, "Tag", 60)), treatmentSlug: string(b.treatmentSlug, "Blog treatment", 100), cta: string(b.cta, "Blog CTA", 400),
  } : null;
  if (blog && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blog.slug) || !publishedTreatmentSlugs.has(blog.treatmentSlug))) throw new Error("Blog slug or treatment is not supported. General-care blogs should use the dental-check-ups treatment page.");
  const instagram = i ? {
    format: member(i.format, ["static", "carousel"] as const, "Instagram format"), caption: string(i.caption, "Instagram caption", 5000),
    hashtags: list(i.hashtags, "Hashtags", 20, (tag) => string(tag, "Hashtag", 70)),
    slides: list(i.slides, "Slides", 10, (slide) => { const item = record(slide, "Slide"); return { title: string(item.title, "Slide title", 180), text: string(item.text, "Slide text", 1000) }; }),
    cta: string(i.cta, "Instagram CTA", 400),
  } : null;
  if (r && (typeof r.durationSeconds !== "number" || !Number.isFinite(r.durationSeconds))) throw new Error("Reel duration must be a number.");
  const kind = member(image.kind, ["educational", "doctor"] as const, "Image kind");
  const doctor = image.doctor == null ? null : member(image.doctor, ["naga-swathi", "prathap-naidu"] as const, "Doctor photo");
  if ((kind === "doctor") !== Boolean(doctor)) throw new Error("Doctor image requests must select an approved real doctor photo; educational images cannot replace a doctor.");
  return {
    blog,
    gbp: g ? { text: string(g.text, "GBP text", 3000), targetUrl: string(g.targetUrl, "GBP target URL", 1000), cta: string(g.cta, "GBP CTA", 400) } : null,
    instagram,
    reel: r ? { hook: string(r.hook, "Reel hook", 400), scenes: list(r.scenes, "Reel scenes", 12, (scene) => { const item = record(scene, "Scene"); return { visual: string(item.visual, "Scene visual", 1000), voiceover: string(item.voiceover, "Voiceover", 1500) }; }), caption: string(r.caption, "Reel caption", 3000), thumbnailBrief: string(r.thumbnailBrief, "Thumbnail brief", 1500), cta: string(r.cta, "Reel CTA", 400), durationSeconds: r.durationSeconds as number } : null,
    imageBrief: { kind, description: string(image.description, "Image description", 3000), alt: string(image.alt, "Image alt text", 300), doctor },
  };
}

/** All boundaries use IST rather than the server's timezone. */
export function contentPeriodKeys(date: Date) {
  if (!Number.isFinite(date.getTime())) return null;
  const local = new Date(date.getTime() + 330 * 60 * 1000);
  const year = local.getUTCFullYear(), month = local.getUTCMonth(), day = local.getUTCDate();
  const monday = new Date(Date.UTC(year, month, day - ((local.getUTCDay() + 6) % 7)));
  return { week: monday.toISOString().slice(0, 10), month: `${year}-${String(month + 1).padStart(2, "0")}` };
}
export type FrequencyUsage = Record<ContentFormat, { weekly: number; monthly: number }>;
export function getFrequencyUsage(history: ContentPackage[], blogs: BlogPost[], now = new Date(), excludeId?: string): FrequencyUsage {
  const usage = Object.fromEntries(CONTENT_POLICY.formats.map((format) => [format, { weekly: 0, monthly: 0 }])) as FrequencyUsage;
  const current = contentPeriodKeys(now)!;
  const published = new Map(blogs.filter((blog) => blog.status === "published").map((blog) => [blog.slug, blog]));
  const countedBlogs = new Set<string>();
  const excluded = history.find((pkg) => pkg.id === excludeId);
  const excludedSlug = excluded?.blogSlug;
  if (excludedSlug) countedBlogs.add(excludedSlug);
  const add = (format: ContentFormat, date: string | undefined) => {
    const keys = contentPeriodKeys(new Date(date || ""));
    // Malformed reservation dates fail closed rather than silently opening a slot.
    if (!keys || keys.week === current.week) usage[format].weekly++;
    if (!keys || keys.month === current.month) usage[format].monthly++;
  };
  const packageIds = new Set<string>();
  for (const pkg of history) {
    if (pkg.id === excludeId || packageIds.has(pkg.id)) continue;
    packageIds.add(pkg.id);
    for (const format of new Set(pkg.formats)) {
      if (!CONTENT_POLICY.formats.includes(format)) continue;
      if (format === "blog") {
        // Only a recorded handoff can be de-duplicated against a published blog.
        // Separate drafts with coincidentally equal proposed slugs reserve separate slots.
        const slug = pkg.blogSlug;
        if (slug && countedBlogs.has(slug)) continue;
        const post = slug ? published.get(slug) : undefined;
        add(format, post?.publishedAt || pkg.createdAt);
        if (slug) countedBlogs.add(slug);
      } else add(format, pkg.createdAt);
    }
  }
  for (const blog of published.values()) {
    if (!countedBlogs.has(blog.slug)) add("blog", blog.publishedAt);
  }
  return usage;
}
export function availableFormats(history: ContentPackage[], blogs: BlogPost[], now = new Date(), excludeId?: string): ContentFormat[] {
  const usage = getFrequencyUsage(history, blogs, now, excludeId);
  return CONTENT_POLICY.formats.filter((format) => {
    const limit = CONTENT_POLICY.frequency[format];
    return usage[format].weekly < limit.weekly && (limit.monthly === null || usage[format].monthly < limit.monthly);
  });
}

export function blogTopicCandidates(blogs: BlogPost[]): Array<Partial<TopicIdea>> {
  return blogs.map((blog) => ({ title: blog.title, primaryKeyword: blog.primaryTopic || blog.title, intent: "Patient education", treatmentSlug: blog.treatmentSlug, angle: blog.excerpt }));
}
function occursOnce(text: string, cta: string) {
  const whole = normaliseSafetyText(visibleText(text)), needle = normaliseSafetyText(visibleText(cta));
  return Boolean(needle && whole.split(needle).length === 2);
}
function extractLinks(text: string): string[] {
  return [...new Set([
    ...Array.from(text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g), (match) => match[1].trim()),
    ...Array.from(text.matchAll(/https?:\/\/[^\s<>"')\]]+/gi), (match) => match[0].replace(/[.,;:!?]+$/, "")),
  ])];
}
function containsCopiedPassage(content: string, reference: string, runLength = 20) {
  const tokenize = (value: string) => normaliseSafetyText(visibleText(value)).match(/[\p{L}\p{N}]+/gu) || [];
  const sourceTokens = tokenize(reference), bodyTokens = tokenize(content);
  if (sourceTokens.length < runLength || bodyTokens.length < runLength) return false;
  const passages = new Set(Array.from({ length: sourceTokens.length - runLength + 1 }, (_, index) => sourceTokens.slice(index, index + runLength).join(" ")));
  return bodyTokens.some((_, index) => index <= bodyTokens.length - runLength && passages.has(bodyTokens.slice(index, index + runLength).join(" ")));
}
export function publicContentText(pkg: ContentDraft): string {
  return [pkg.blog?.title, pkg.blog?.excerpt, pkg.blog?.body, pkg.blog?.seoTitle, pkg.blog?.metaDescription, pkg.blog?.primaryTopic, pkg.blog?.cta, ...(pkg.blog?.tags || []), pkg.gbp?.text, pkg.gbp?.cta, pkg.instagram?.caption, pkg.instagram?.cta, ...(pkg.instagram?.hashtags || []), ...(pkg.instagram?.slides.flatMap((slide) => [slide.title, slide.text]) || []), pkg.reel?.hook, ...(pkg.reel?.scenes.flatMap((scene) => [scene.visual, scene.voiceover]) || []), pkg.reel?.caption, pkg.reel?.cta, pkg.reel?.thumbnailBrief, pkg.imageBrief.description, pkg.imageBrief.alt].filter(Boolean).join("\n");
}
export function validateAiReview(value: unknown): AiReview {
  const input = record(value, "AI review");
  return { medical: boolean(input.medical, "Medical review"), claims: boolean(input.claims, "Claims review"), seo: boolean(input.seo, "SEO review"), duplication: boolean(input.duplication, "Duplicate review"), tone: boolean(input.tone, "Tone review"), issues: list(input.issues, "Review issues", 30, (issue) => string(issue, "Review issue", 600)) };
}

export function validatePackage(pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[], now = new Date()): SafetyResult {
  const keys: SafetyCheck["key"][] = ["medical", "claims", "seo", "duplicate", "links", "words", "brand", "frequency"];
  const messages = Object.fromEntries(keys.map((key) => [key, [] as string[]])) as Record<SafetyCheck["key"], string[]>;
  const wordCounts: Record<string, number> = {};
  const add = (key: SafetyCheck["key"], message: string) => messages[key].push(message);
  let draft: ContentDraft;
  try { draft = validateContentDraft(pkg); } catch (error) {
    return { status: "NEEDS_REVIEW", checks: keys.map((key) => ({ key, status: "NEEDS_REVIEW", messages: [key === "medical" ? (error instanceof Error ? error.message : "Invalid content structure.") : "Cannot validate malformed content."] })), aiReview: null, checkedAt: now.toISOString(), wordCounts };
  }
  const text = publicContentText(draft);
  messages.medical.push(...findMedicalIssues(text));
  messages.claims.push(...findClaimIssues(text));
  messages.brand.push(...findJurisdictionIssues(text));
  let namesRemoved = text;
  for (const doctor of doctors) {
    const name = doctor.name.replace(/^Dr\.\s+/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    namesRemoved = namesRemoved.replace(new RegExp(`\\bdr\\.?\\s+${name}\\b`, "gi"), "approved clinician");
  }
  if (/\bdr\.?\s+[\p{L}]+/iu.test(namesRemoved)) add("claims", "Use only the clinic's approved doctor names and credentials; do not invent a clinician.");
  const privateText = text.replace(new RegExp(`(?:\\+91|91)?[\\s-]*${clinic.phone}`, "g"), "");
  messages.medical.push(...findPrivateInputIssues(privateText));
  if (/<\/?[a-z][^>]*>/i.test(text) || /!\[[^\]]*\]\(/.test(text)) add("seo", "Use plain text or supported Markdown; generated bodies cannot embed HTML or unreviewed images.");
  if (/\b(?:synthetic|generated|invented|fictional)\s+(?:doctor|dentist|patient)|\b(?:graphic\s+surgery|blood|gore|testimonial|before\s*(?:and|&|\/)\s*after)\b/i.test(`${draft.imageBrief.description} ${draft.reel?.thumbnailBrief || ""}`)) add("medical", "Image instructions must avoid graphic surgery, synthetic people and before-and-after or testimonial imagery.");
  if (draft.imageBrief.kind === "educational" && /\b(?:doctor|dentist|surgeon|patient|photorealistic\s+person|realistic\s+face|portrait)\b/i.test(draft.imageBrief.description)) add("medical", "Educational image briefs must describe an anatomy or conceptual illustration. Use an approved real photo for doctor content.");
  const actualFormats: ContentFormat[] = [draft.blog && "blog", draft.gbp && "gbp", draft.instagram && (draft.instagram.format === "static" ? "instagram_static" : "instagram_carousel"), draft.reel && "reel"].filter(Boolean) as ContentFormat[];
  if (!Array.isArray(pkg.formats) || !actualFormats.length || new Set(pkg.formats).size !== pkg.formats.length || pkg.formats.some((format) => !actualFormats.includes(format)) || actualFormats.some((format) => !pkg.formats.includes(format))) add("seo", "The selected formats must match the generated content exactly.");
  // Only a persisted handoff may identify an existing blog as its own. An untrusted
  // new draft cannot hide a duplicate by choosing an existing article's slug.
  const persisted = history.find((item) => item.id === pkg.id);
  const ownBlogSlug = persisted?.blogSlug;
  const duplicate = checkDuplicates(pkg.topic, [...blogTopicCandidates(blogs.filter((blog) => blog.slug !== ownBlogSlug)), ...history.filter((item) => item.id !== pkg.id).map((item) => item.topic)]);
  if (duplicate.status === "DUPLICATE") add("duplicate", duplicate.reason);
  if (draft.blog && duplicate.status === "TOO_SIMILAR") add("duplicate", "The proposed blog is too similar to existing content; reuse the existing article or create social content.");
  if (draft.blog && (!pkg.topic.blogRecommended || !contentWorthiness({ ...pkg.topic, duplicate }).blogRecommended)) add("seo", "This topic has not passed the blog-worthiness gate.");
  const permitted = availableFormats(history, blogs, now, pkg.id);
  for (const format of actualFormats) if (!permitted.includes(format)) add("frequency", `The ${format.replace(/_/g, " ")} reservation limit has been reached for the current IST week or month.`);

  const verified = new Set<string>();
  for (const source of pkg.sources || []) {
    if (source.status !== "VERIFIED" || !isApprovedSourceUrl(source.url) || !source.title?.trim() || !source.excerpt?.trim() || !Number.isFinite(Date.parse(source.retrievedAt)) || Date.parse(source.retrievedAt) > now.getTime() + 60000) add("links", "A source lacks valid retrieved evidence from the approved source list.");
    else verified.add(source.url);
    if (source.excerpt && containsCopiedPassage(text, source.excerpt)) add("claims", "A long passage matches a retrieved source. Rewrite it in original language and retain the source link.");
  }
  const links = [...extractLinks(text), pkg.topic.targetPage, ...(draft.gbp ? [draft.gbp.targetUrl] : [])];
  if (pkg.topic.evidence.sourceUrl) links.push(pkg.topic.evidence.sourceUrl);
  for (const url of new Set(links)) {
    if (!isApprovedInternalUrl(url) && !(isApprovedSourceUrl(url) && verified.has(url))) add("links", `An unapproved or unretrieved URL must be removed: ${url.slice(0, 160)}`);
  }
  if (pkg.topic.evidence.type === "GSC_SIGNAL" || pkg.topic.evidence.type === "SERP_OBSERVATION") add("seo", "No live GSC or SERP evidence is connected in V1.");
  if (!isApprovedInternalUrl(pkg.topic.targetPage)) add("links", "The topic must target an approved clinic page.");
  if (draft.blog) {
    const blog = draft.blog;
    wordCounts.blog = countWords(`${blog.title}\n${blog.body}`);
    wordCounts.blogBody = countWords(blog.body);
    if (wordCounts.blog > CONTENT_POLICY.blog.maxWords) add("words", `Blog contains ${wordCounts.blog} words; reduce it to at most ${CONTENT_POLICY.blog.maxWords} and revalidate.`);
    if (/^\s*#(?!#)\s+.+$/m.test(blog.body)) add("seo", "The blog title supplies the single H1; remove H1 headings from the body.");
    const headings = Array.from(blog.body.matchAll(/^\s*##(?!#)\s+(.+)$/gm));
    if (headings.length < CONTENT_POLICY.blog.minSections || headings.length > CONTENT_POLICY.blog.maxSections) add("seo", "Use four to six useful H2 sections in the blog body.");
    const questionHeadings = blog.body.match(/^\s*###(?!#)\s+[^\n]*\?[^\n]*$/gm) || [];
    if (questionHeadings.length > CONTENT_POLICY.blog.maxFaqs) add("seo", "Use at most three FAQ questions, including questions under alternative section names.");
    const faqHeading = /^\s*##\s+[^\n]*(?:\bFAQs?\b|frequently\s+asked|common\s+questions|questions\s+about)[^\n]*$/im.exec(blog.body);
    if (faqHeading) {
      const rest = blog.body.slice((faqHeading.index || 0) + faqHeading[0].length);
      const faq = rest.split(/^\s*##(?!#)\s+/m)[0];
      const questions = faq.match(/^\s*(?:###\s+.+|(?:\*\*|\d+[.)]\s*)[^\n]*\?[^\n]*)$/gm) || [];
      if (questions.length > CONTENT_POLICY.blog.maxFaqs || questions.length === 0) add("seo", "Use at most three clearly marked FAQ questions under the FAQ heading.");
    }
    const bodyLinks = extractLinks(blog.body);
    if (pkg.safety?.aiReview?.claimChecks?.length && !bodyLinks.some(url => verified.has(url))) add("links", "Clinical articles need visible links to their supporting retrieved sources.");
    for (const claim of pkg.safety?.aiReview?.claimChecks || []) {
      if (claim.supported && !bodyLinks.includes(claim.sourceUrl)) add("links", "Link the supporting source for each clinical claim in the blog body.");
    }
    if (/^\s*```|^\s*\|.+\|\s*$/m.test(blog.body)) add("seo", "Use supported headings, paragraphs and lists instead of code fences or tables.");
    const internal = [...new Set(bodyLinks.filter(isApprovedInternalUrl))];
    if (internal.length < CONTENT_POLICY.blog.minInternalLinks || internal.length > CONTENT_POLICY.blog.maxInternalLinks) add("links", "Include two to four distinct approved internal links in the blog body.");
    if (blog.seoTitle.length > CONTENT_POLICY.blog.maxSeoTitleCharacters || blog.metaDescription.length > CONTENT_POLICY.blog.maxMetaDescriptionCharacters) add("seo", "Keep SEO title within 65 characters and meta description within 160 characters.");
    if (!occursOnce(blog.body, blog.cta)) add("seo", "The blog's CTA must appear exactly once in its visible body.");
    if (!/\bmangalagiri\b/i.test(`${blog.title} ${blog.body}`)) add("brand", "Add natural Mangalagiri relevance to the blog.");
  }
  if (draft.gbp) {
    wordCounts.gbp = countWords(draft.gbp.text);
    if (wordCounts.gbp < CONTENT_POLICY.gbp.minWords || wordCounts.gbp > CONTENT_POLICY.gbp.maxWords) add("words", "GBP text must contain 25–40 words, including its CTA.");
    if (!occursOnce(draft.gbp.text, draft.gbp.cta)) add("seo", "The GBP CTA must occur exactly once in the post text.");
    if (!isApprovedInternalUrl(draft.gbp.targetUrl)) add("links", "GBP must link to an approved clinic page.");
    if (!/\bmangalagiri\b/i.test(draft.gbp.text)) add("brand", "Add natural Mangalagiri relevance to the GBP post.");
  }
  if (draft.instagram) {
    const instagram = draft.instagram;
    wordCounts.instagram = countWords(instagram.caption);
    if (wordCounts.instagram < CONTENT_POLICY.instagram.minCaptionWords || wordCounts.instagram > CONTENT_POLICY.instagram.maxCaptionWords) add("words", "Instagram captions must contain 60–120 words, excluding separately listed hashtags.");
    if (instagram.hashtags.length > CONTENT_POLICY.instagram.maxHashtags || new Set(instagram.hashtags.map((tag) => tag.toLowerCase())).size !== instagram.hashtags.length || instagram.hashtags.some((tag) => !/^#[\p{L}\p{N}_]+$/u.test(tag)) || /#[\p{L}\p{N}_]+/u.test(instagram.caption)) add("words", "Use at most five unique hashtags in the separate hashtag list, with no hashtags in the caption.");
    if (instagram.format === "carousel" && (!instagram.slides.length || instagram.slides.length > CONTENT_POLICY.instagram.maxSlides)) add("words", "A carousel must contain one to five slides.");
    if (instagram.format === "static" && instagram.slides.length) add("seo", "A static Instagram post must not include carousel slides.");
    if (!occursOnce(instagram.caption, instagram.cta)) add("seo", "The Instagram CTA must occur exactly once in the caption.");
    if (!/\bmangalagiri\b/i.test(instagram.caption)) add("brand", "Add natural Mangalagiri relevance to the Instagram caption.");
  }
  if (draft.reel) {
    const reel = draft.reel;
    const sceneSpeech = reel.scenes.map((scene) => scene.voiceover).join(" ");
    wordCounts.reelSpoken = countWords([sceneSpeech.includes(reel.hook) ? "" : reel.hook, sceneSpeech, sceneSpeech.includes(reel.cta) ? "" : reel.cta].join(" "));
    if (reel.durationSeconds < CONTENT_POLICY.reel.minSeconds || reel.durationSeconds > CONTENT_POLICY.reel.maxSeconds) add("words", "A reel script must be planned for 20–40 seconds.");
    if (wordCounts.reelSpoken > reel.durationSeconds * CONTENT_POLICY.reel.maxSpokenWordsPerSecond) add("words", "The spoken script is too long for its stated duration; shorten and recount it.");
    if (!reel.scenes.length || reel.scenes.length > CONTENT_POLICY.reel.maxScenes) add("seo", "Use one to six clear scenes for the reel script.");
  }
  const review = pkg.safety?.aiReview || null;
  if (review) {
    if (!review.medical) add("medical", "The separate AI review flagged medical safety.");
    if (!review.claims) add("claims", "The separate AI review flagged unsupported claims.");
    if (!review.seo) add("seo", "The separate AI review flagged content quality or SEO.");
    if (!review.duplication) add("duplicate", "The separate AI review flagged duplicate content.");
    if (!review.tone) add("brand", "The separate AI review flagged tone or local relevance.");
    const categories = { medical: "medical", claims: "claims", seo: "seo", duplication: "duplicate", tone: "brand" } as const;
    if (review.typedIssues) for (const issue of review.typedIssues) add(categories[issue.category], `Separate AI review: ${issue.message}`);
    else for (const issue of review.issues) add("claims", `Legacy review needs a fresh categorized check: ${issue}`);
  }
  const checks: SafetyCheck[] = keys.map((key) => ({ key, status: messages[key].length ? "NEEDS_REVIEW" : "PASS", messages: [...new Set(messages[key])] }));
  return { status: checks.some((check) => check.status === "NEEDS_REVIEW") ? "NEEDS_REVIEW" : review ? "READY_FOR_HUMAN_REVIEW" : "PENDING", checks, aiReview: review, checkedAt: now.toISOString(), wordCounts };
}
