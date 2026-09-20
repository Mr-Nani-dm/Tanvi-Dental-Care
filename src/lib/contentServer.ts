import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import type { BlogPost } from "@/content/blog";
import { BLOG_ADMIN_COOKIE, adminConfigReady, verifyAdminSession, verifySameOrigin } from "./adminAuth";
import { aiSetup, generateTopicCandidates, generateDraft, reviewDraft, generateContentImage } from "./contentAi";
import { retrieveSources } from "./contentSources";
import { validateDailyAnswers, validateTopicIdea, validateContentDraft, validatePackage, availableFormats, countWords, contentWorthiness } from "./contentValidation";
import { findPrivateInputIssues, findClaimIssues, findMedicalIssues, findJurisdictionIssues } from "@/config/content-safety";
import { CONTENT_POLICY } from "@/config/content-policy";
import { clinic } from "@/config/clinic";
import { checkDuplicates } from "./duplicateChecker";
import { contentBranch, writeRepoBinary } from "./githubContent";
import { ContentError, readContentContext, reserveAiCall, saveContentPackage, handoffContentPackage } from "./contentStore";
import { signTopic, verifyTopic, signPackage, verifyPackageProvenance, verifyPackageReview } from "./contentIntegrity";
import { estimateReadTime } from "./blogSeo";
import type { ContentPackage, ContentFormat, TopicIdea, SafetyResult, ContentDraft } from "./contentTypes";

const ALL_FORMATS: ContentFormat[] = ["blog", "gbp", "instagram_static", "instagram_carousel", "reel"];
const pendingSafety = (): SafetyResult => ({ status: "PENDING", checks: [], aiReview: null, checkedAt: null, wordCounts: {} });
export function contentJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" } });
}
export function requireContentAuth(request: NextRequest, write = true) {
  if (!verifyAdminSession(request.cookies.get(BLOG_ADMIN_COOKIE)?.value)) throw new ContentError("Sign in required.", 401);
  if (write && !verifySameOrigin(request)) throw new ContentError("Request origin is not allowed.", 403);
  if (!adminConfigReady()) throw new ContentError("Admin configuration is incomplete.", 503);
}
export async function readContentBody(request: NextRequest): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ContentError("Send a JSON request.", 415);
  if (Number(request.headers.get("content-length")) > 150_000) throw new ContentError("This draft request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ContentError("A request body is required.", 400);
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    length += chunk.value.length;
    if (length > 150_000) { await reader.cancel(); throw new ContentError("This draft request is too large.", 413); }
    chunks.push(chunk.value);
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ContentError("Invalid JSON request.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ContentError("Invalid request.", 400);
  return body as Record<string, unknown>;
}
export async function contentAction(request: NextRequest, handler: (body: Record<string, unknown>) => Promise<unknown>) {
  try { requireContentAuth(request); return contentJson(await handler(await readContentBody(request))); }
  catch (error) { return contentErrorResponse(error); }
}
export function contentErrorResponse(error: unknown) {
  if (error instanceof ContentError) return contentJson({ error: error.message }, error.status);
  // Provider modules only throw public, credential-free diagnostics. Network and
  // GitHub failures never include upstream response bodies or authorization.
  const message = error instanceof Error ? error.message : "Unable to complete this request.";
  return contentJson({ error: message.slice(0, 400) }, /configured|configuration|unavailable/i.test(message) ? 503 : 422);
}
function requireTextSetup() { if (!aiSetup().textReady) throw new ContentError("Text AI setup is required. Ask the administrator to configure the server-side API key and text/review models.", 503); }
function publicPermission(body: Record<string, unknown>) {
  if (body.publicStorageConfirmed !== true) throw new ContentError("Confirm that this draft may be stored in the public repository and contains no private or patient information.");
}
function rejectPrivate(text: string) {
  const issues = findPrivateInputIssues(text.replace(new RegExp(`(?:\\+91|91)?[\\s-]*${clinic.phone}`, "g"), ""));
  if (issues.length) throw new ContentError(issues.join(" "));
}
function candidates(blogs: BlogPost[], history: ContentPackage[], excludeId?: string): Partial<TopicIdea>[] {
  const excludeSlug = history.find(item => item.id === excludeId)?.blogSlug;
  return [...blogs.filter(p => p.slug !== excludeSlug).map(post => ({ title: post.title, primaryKeyword: post.primaryTopic || post.title, treatmentSlug: post.treatmentSlug, intent: "patient education", angle: post.excerpt })), ...history.filter(p => p.id !== excludeId).map(p => p.topic)];
}
function rawPackage(body: Record<string, unknown>) {
  const input = body.package;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ContentError("A generated content package is required.", 400);
  const pkg = input as ContentPackage;
  if (!verifyPackageProvenance(pkg)) throw new ContentError("This draft's source information changed or expired. Reopen it from saved history or generate a new draft.", 409);
  const draft = validateContentDraft(pkg);
  rejectPrivate(JSON.stringify(draft));
  const reviewed = verifyPackageReview(pkg);
  // Only the allowed draft fields are editable. Status, AI review, identifiers,
  // source evidence and image provenance cannot be forged by the browser.
  return {
    id: pkg.id, createdAt: pkg.createdAt, updatedAt: new Date().toISOString(), topic: pkg.topic, formats: pkg.formats,
    sources: pkg.sources, image: pkg.image, ...draft, status: "draft" as const,
    safety: reviewed ? pkg.safety : pendingSafety(), proof: pkg.proof, reviewToken: reviewed ? pkg.reviewToken : undefined,
    ...(typeof pkg.revision === "string" ? { revision: pkg.revision } : {}),
  } satisfies ContentPackage;
}
function syncStatus(pkg: ContentPackage) {
  pkg.status = pkg.safety.status === "READY_FOR_HUMAN_REVIEW" ? "ready_for_review" : pkg.safety.status === "NEEDS_REVIEW" ? "needs_review" : "draft";
  return pkg;
}
function hardSizeGate(pkg: ContentPackage) {
  if (pkg.blog && countWords(pkg.blog.title + " " + pkg.blog.body) > CONTENT_POLICY.blog.maxWords) throw new ContentError("The blog exceeds 1,000 words. Shorten it and validate again.");
}
function enforceFrequency(pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[]) {
  const available = availableFormats(history, blogs, new Date(), pkg.id);
  if (pkg.formats.some(format => !available.includes(format))) throw new ContentError("A content frequency limit has been reached. Reopen the planner for currently available formats.", 409);
}
function deterministic(pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[]) {
  pkg.safety = validatePackage(pkg, history, blogs);
  return syncStatus(pkg);
}
async function review(pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[]) {
  rejectPrivate(JSON.stringify({ blog: pkg.blog, gbp: pkg.gbp, instagram: pkg.instagram, reel: pkg.reel, imageBrief: pkg.imageBrief }));
  await reserveAiCall("text");
  pkg.safety = { ...pendingSafety(), aiReview: await reviewDraft({ package: pkg, history, blogs }) };
  deterministic(pkg, history, blogs);
  return signPackage(pkg, true);
}

export async function contentSession(request: NextRequest) {
  try {
    requireContentAuth(request, false);
    const setup = aiSetup();
    let branch = ""; let storageReady = false;
    let history: ContentPackage[] = [];
    const missing = [...setup.missing];
    try {
      branch = contentBranch();
      const context = await readContentContext();
      history = context.history.map(pkg => signPackage(pkg, Boolean(pkg.safety.aiReview && pkg.safety.checkedAt && Date.now() - Date.parse(pkg.safety.checkedAt) < 2 * 3_600_000)));
      storageReady = true;
    } catch { missing.push("Content storage is unavailable on this branch."); }
    return contentJson({ authenticated: true, configured: true, setup: { ...setup, storageReady, branch, preview: process.env.VERCEL_ENV !== "production", missing }, history });
  } catch (error) {
    if (error instanceof ContentError && error.status === 401) return contentJson({ authenticated: false, configured: adminConfigReady(), error: error.message }, 401);
    return contentErrorResponse(error);
  }
}

export async function planTopics(body: Record<string, unknown>) {
  requireTextSetup();
  const answers = validateDailyAnswers(body.answers);
  rejectPrivate(answers.special);
  const context = await readContentContext();
  const formats = availableFormats(context.history, context.blogs);
  if (!formats.length) throw new ContentError("This week's content slots are already reserved. Review or reuse saved content.", 409);
  const selected: TopicIdea[] = [];
  for (let attempt = 0; attempt < 2 && selected.length < 3; attempt++) {
    await reserveAiCall("text");
    const proposed = await generateTopicCandidates({ answers, blogs: context.blogs, history: context.history, availableFormats: formats });
    for (const value of proposed) {
      const idea = validateTopicIdea(value);
      const text = [idea.title, idea.rationale, idea.angle, idea.primaryKeyword].join(" ");
      if ([...findClaimIssues(text), ...findMedicalIssues(text), ...findPrivateInputIssues(text), ...findJurisdictionIssues(text)].length) continue;
      const duplicate = checkDuplicates(idea, [...candidates(context.blogs, context.history), ...selected]);
      if (duplicate.status === "DUPLICATE" || selected.some(item => item.title.toLowerCase() === idea.title.toLowerCase())) continue;
      idea.id = randomUUID(); idea.duplicate = duplicate;
      // V1 has no connected GSC/SERP feed. Model assertions are not evidence.
      idea.evidence = answers.special.trim() && !/^none$/i.test(answers.special.trim())
        ? { type: "MANUAL_IDEA", reason: "Based on the clinic's planning input; no search-demand claim is made." }
        : { type: "CONTENT_GAP", reason: "Compared with the clinic's current articles and saved content. Search demand has not been measured." };
      idea.blogRecommended = contentWorthiness(idea).blogRecommended && formats.includes("blog");
      idea.recommendedFormats = idea.recommendedFormats.filter(format => formats.includes(format) && (format !== "blog" || idea.blogRecommended));
      if (!idea.recommendedFormats.length) idea.recommendedFormats = formats.filter(format => format !== "blog").slice(0, 2);
      if (!idea.recommendedFormats.length) continue;
      selected.push(signTopic(idea));
      if (selected.length === 3) break;
    }
  }
  if (selected.length !== 3) throw new ContentError("Three distinct, suitable ideas could not be verified. Adjust the treatment focus and try again; no topic has been saved.");
  return { topics: selected, notice: "Ideas use clinic facts and content gaps. Search Console and live search trends are not connected. Saved drafts reserve frequency slots; nothing publishes automatically." };
}

export async function generateContent(body: Record<string, unknown>) {
  requireTextSetup();
  const rawTopic = body.topic as TopicIdea;
  if (!rawTopic || !verifyTopic(rawTopic)) throw new ContentError("This topic changed or expired. Generate today's ideas again.", 409);
  const topic = { ...validateTopicIdea(rawTopic), duplicate: rawTopic.duplicate, token: rawTopic.token };
  if (!Array.isArray(body.formats) || !body.formats.length || body.formats.some(item => !ALL_FORMATS.includes(item as ContentFormat))) throw new ContentError("Choose one or more supported formats.");
  const formats = Array.from(new Set(body.formats)) as ContentFormat[];
  if (formats.includes("instagram_static") && formats.includes("instagram_carousel")) throw new ContentError("Choose one Instagram format per package.");
  if (formats.includes("blog") && !topic.blogRecommended) throw new ContentError("This topic is suitable for social content or updating an existing article, not a new blog.");
  const { history, blogs } = await readContentContext();
  if (checkDuplicates(topic, candidates(blogs, history)).status === "DUPLICATE") throw new ContentError("This topic has since been saved. Reopen it from history.", 409);
  const available = availableFormats(history, blogs);
  if (formats.some(item => !available.includes(item))) throw new ContentError("A selected format has reached its planning limit.", 409);
  const sources = await retrieveSources(topic);
  await reserveAiCall("text");
  let draft = validateContentDraft(await generateDraft({ topic, formats, sources }));
  if (draft.blog && countWords(draft.blog.title + " " + draft.blog.body) > 1000) {
    await reserveAiCall("text");
    draft = validateContentDraft(await generateDraft({ topic, formats, sources, draft, correction: "The article exceeded its hard limit. Reduce the title plus body to 700–900 words, preserve the safety caveats, useful sections and source links. Never exceed 1,000 words." }));
  }
  const now = new Date().toISOString();
  const pkg: ContentPackage = { ...draft, id: randomUUID(), topic, formats, sources, createdAt: now, updatedAt: now, status: "draft", safety: pendingSafety(), image: null };
  hardSizeGate(pkg);
  return { package: await review(pkg, history, blogs) };
}

export async function validateContent(body: Record<string, unknown>) {
  requireTextSetup();
  const pkg = rawPackage(body);
  hardSizeGate(pkg);
  const context = await readContentContext();
  // Re-retrieve exact allowlisted sources after edits; failed URLs lose VERIFIED.
  pkg.sources = await retrieveSources(pkg.topic);
  return { package: await review(pkg, context.history, context.blogs) };
}

function requireReviewed(pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[]) {
  if (!verifyPackageReview(pkg)) throw new ContentError("Validate this exact draft before creating an image or a Blog Manager draft.");
  hardSizeGate(pkg); enforceFrequency(pkg, history, blogs);
  deterministic(pkg, history, blogs);
  if (pkg.safety.status !== "READY_FOR_HUMAN_REVIEW") throw new ContentError("Resolve the safety checks and validate again before continuing.");
}

export async function saveContent(body: Record<string, unknown>) {
  publicPermission(body);
  const pkg = rawPackage(body);
  hardSizeGate(pkg);
  if (body.action === "handoff") {
    const result = await handoffContentPackage(pkg, (record, history, blogs) => {
      requireReviewed(record, history, blogs);
      if (!record.blog || !record.topic.blogRecommended || !record.formats.includes("blog")) throw new ContentError("This package does not recommend a new blog.");
      return {
        ...record.blog, status: "draft", category: "Dental Health", readTime: estimateReadTime(record.blog.body), author: "Tanvi Dental Care Editorial Team",
        // A real clinician must add their review name/date in Blog Manager.
        featuredImage: record.image?.path || "", imageAlt: record.image?.alt || "", imageRightsConfirmed: false,
        updatedAt: new Date().toISOString().slice(0, 10), contentOsId: record.id, contentOsCta: record.blog.cta,
      };
    });
    return { ...result, package: signPackage(result.package, false) };
  }
  if (body.action !== "save") throw new ContentError("Choose save or handoff.", 400);
  const result = await saveContentPackage(pkg, (record, history, blogs) => {
    enforceFrequency(record, history, blogs);
    const priorReview = Boolean(record.safety.aiReview);
    deterministic(record, history, blogs);
    Object.assign(record, signPackage(record, priorReview));
  });
  return result;
}

export async function createContentImage(body: Record<string, unknown>) {
  publicPermission(body);
  if (body.rightsConfirmed !== true) throw new ContentError("Confirm the image rights and review requirements before continuing.");
  const pkg = rawPackage(body);
  const { history, blogs } = await readContentContext();
  requireReviewed(pkg, history, blogs);
  if (pkg.imageBrief.kind === "doctor") {
    if (!pkg.imageBrief.doctor) throw new ContentError("Choose one of the clinic's approved real doctor photos.");
    pkg.image = { path: `/images/doctors/${pkg.imageBrief.doctor}.webp`, alt: pkg.imageBrief.doctor === "naga-swathi" ? "Dr. Naga Swathi Pokala" : "Dr. Prathap Naidu", provenance: "APPROVED_DOCTOR_PHOTO", model: "existing-clinic-photo", createdAt: new Date().toISOString(), needsHumanReview: true };
    return { package: signPackage(pkg, true) };
  }
  if (!aiSetup().imageReady) throw new ContentError("Image AI setup is required. You can continue without an image.", 503);
  await reserveAiCall("image");
  const generated = await generateContentImage(pkg);
  if (generated.bytes.byteLength > 15_000_000) throw new ContentError("The generated image was too large. No image was saved.");
  const bytes = await sharp(generated.bytes, { limitInputPixels: 20_000_000 }).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  if (bytes.byteLength > 3_000_000) throw new ContentError("The optimized image is too large. No image was saved.");
  const now = new Date().toISOString();
  const path = `/images/content/${now.slice(0, 4)}/${now.slice(5, 7)}/${randomUUID()}.webp`;
  await writeRepoBinary({ path: `public${path}`, bytes, message: "Save Content OS educational illustration for human review" });
  pkg.image = { path, alt: pkg.imageBrief.alt, provenance: "AI_GENERATED", model: generated.model, createdAt: now, needsHumanReview: true };
  return { package: signPackage(pkg, true), imagePreview: `data:image/webp;base64,${bytes.toString("base64")}` };
}
