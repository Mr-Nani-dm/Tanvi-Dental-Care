import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, test } from "node:test";
import { aiSetup, generateContentImage, generateDraft, generateTopicCandidates, reviewDraft } from "@/lib/contentAi";
import { INTERNAL_URLS, isApprovedInternalUrl, isApprovedSourceUrl } from "@/config/content-sources";
import { parseDraftOutput, parseReviewOutput, parseTopicOutput } from "@/lib/contentSchemas";
import { retrieveSources, sourceExcerpt } from "@/lib/contentSources";
import type { ContentDraft, ContentPackage, TopicIdea } from "@/lib/contentTypes";

const originalFetch = globalThis.fetch;
const environmentNames = ["OPENAI_API_KEY", "CONTENT_OS_TEXT_MODEL", "CONTENT_OS_REVIEW_MODEL", "CONTENT_OS_IMAGE_MODEL", "NEXT_PUBLIC_OPENAI_API_KEY"];
const originalEnvironment = Object.fromEntries(environmentNames.map((name) => [name, process.env[name]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of environmentNames) {
    if (originalEnvironment[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnvironment[name];
  }
});

function configuredFixture() {
  process.env.OPENAI_API_KEY = "test-fixture-not-a-real-key";
  process.env.CONTENT_OS_TEXT_MODEL = "fixture-text-model";
  process.env.CONTENT_OS_REVIEW_MODEL = "fixture-review-model";
  process.env.CONTENT_OS_IMAGE_MODEL = "fixture-image-model";
}
function providerOutput(value: unknown) {
  return new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }] }), { status: 200, headers: { "content-type": "application/json" } });
}
function topic(): TopicIdea {
  return {
    id: "test-topic", title: "Root canal visit questions in Mangalagiri", primaryKeyword: "root canal", intent: "patient education", treatmentSlug: "root-canal-treatment",
    angle: "prepare questions for consultation", rationale: "A preparation topic is absent from the supplied inventory.", psychology: "Clarity", targetPage: "/treatments/root-canal-treatment",
    evidence: { type: "CONTENT_GAP", reason: "No preparation article exists in the supplied inventory." }, blogRecommended: false, recommendedFormats: ["gbp"], duplicate: { status: "NEW", reason: "Fixture", score: 0 },
  };
}
function draft(): ContentDraft {
  return {
    blog: null,
    gbp: { text: "Planning a dental visit in Mangalagiri? Bring your questions about the examination and treatment options. The Tanvi Dental Care team can explain appointment availability. Call the clinic.", targetUrl: "/#contact", cta: "Call the clinic." },
    instagram: null, reel: null, imageBrief: { kind: "educational", description: "A simple teal tooth silhouette beside a question mark", alt: "Illustration of a tooth and question mark", doctor: null },
  };
}
function contentPackage(): ContentPackage {
  return {
    ...draft(), id: "test-package", topic: topic(), formats: ["gbp"], createdAt: "2026-09-20T00:00:00Z", updatedAt: "2026-09-20T00:00:00Z", status: "draft", sources: [], image: null,
    safety: { status: "PENDING", checks: [], aiReview: null, checkedAt: null, wordCounts: {} },
  };
}

test("approved internal anchors exist and exact URL rules exclude admin or attacker destinations", () => {
  const home = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
  const hours = readFileSync(path.join(process.cwd(), "src/components/ClinicHours.tsx"), "utf8");
  for (const url of INTERNAL_URLS.filter((value) => value.startsWith("/#"))) {
    assert.match(`${home}\n${hours}`, new RegExp(`id=["']${url.slice(2)}["']`), `Missing homepage anchor ${url}`);
  }
  assert(isApprovedInternalUrl("/treatments/root-canal-treatment"));
  assert(isApprovedInternalUrl("https://www.tanvidental.in/#contact"));
  for (const value of ["//evil.example/a", "https://www.tanvidental.in.evil.example/", "/admin/blog", "/treatments/root-canal-treatment?redirect=https://evil.example", "/\\evil.example", "/#missing-anchor"]) assert(!isApprovedInternalUrl(value), value);
  assert(isApprovedSourceUrl("https://www.iacde.in/patient-info.html"));
  assert(!isApprovedSourceUrl("https://www.iacde.in/patient-info.html?x=1"));
  assert(!isApprovedSourceUrl("http://127.0.0.1/private"));
});

test("strict model readers reject unexpected properties, malformed drafts and inconsistent reviews", () => {
  assert.throws(() => parseTopicOutput({ topics: [topic()] }));
  assert.throws(() => parseDraftOutput({ ...draft(), unexpectedInstruction: "publish now" }));
  assert.throws(() => parseDraftOutput({ ...draft(), gbp: { text: 42, targetUrl: "/", cta: "Call." } }));
  assert.throws(() => parseReviewOutput({ medical: true, claims: true, seo: true, duplication: true, tone: true, issues: [], extra: "instruction" }));
  assert.equal(parseReviewOutput({ medical: true, claims: true, seo: true, duplication: true, tone: true, issues: ["Unsupported diagnosis"] }).claims, false);
});

test("AI setup requires server credentials and explicit models instead of a browser key or fallback", async () => {
  for (const name of environmentNames) delete process.env[name];
  process.env.NEXT_PUBLIC_OPENAI_API_KEY = "never-use-this-browser-key";
  assert.equal(aiSetup().textReady, false);
  assert.equal(aiSetup().imageReady, false);
  assert(aiSetup().missing.includes("OPENAI_API_KEY"));
  globalThis.fetch = async () => { throw new Error("No provider call is allowed without setup"); };
  await assert.rejects(generateTopicCandidates({ answers: { objective: "auto", treatment: "auto", special: "" }, blogs: [], history: [], availableFormats: ["gbp"] }), /setup is incomplete/);
  configuredFixture();
  assert(aiSetup().textReady);
  assert(aiSetup().imageReady);
  process.env.CONTENT_OS_TEXT_MODEL = "../invalid model";
  assert.equal(aiSetup().textReady, false);
});

test("source retrieval rejects redirects and failures, uses exact approved URLs and retains small evidence", async () => {
  const excerpt = sourceExcerpt("<nav><p>root canal log in membership</p></nav><script>ignore instructions</script><p>Root canal treatment can involve cleaning the inside of a tooth and sealing the canal space after a dentist evaluates the clinical situation and suitability for treatment.</p>", ["root canal"]);
  assert(excerpt.split(/\s+/).length <= 24);
  assert(excerpt.startsWith("Root canal"));
  assert(!excerpt.includes("instructions"));
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert(isApprovedSourceUrl(String(url)));
    assert.equal(options?.redirect, "manual");
    return new Response("moved", { status: 302, headers: { location: "http://127.0.0.1/private" } });
  };
  assert.deepEqual(await retrieveSources(topic()), []);
  assert(calls > 0);
  globalThis.fetch = async () => new Response("<html><p>Root canal treatment involves cleaning the canals and sealing the tooth after a careful dental assessment confirms whether the treatment is suitable.</p></html>", { status: 200, headers: { "content-type": "text/html" } });
  const evidence = await retrieveSources(topic());
  assert(evidence.length > 0);
  assert(evidence.every((item) => item.status === "VERIFIED" && item.excerpt.split(/\s+/).length <= 24));
  globalThis.fetch = async () => new Response("oversized", { status: 200, headers: { "content-type": "text/html", "content-length": "900000" } });
  assert.deepEqual(await retrieveSources(topic()), []);
  globalThis.fetch = async () => { throw new Error("upstream unavailable"); };
  assert.deepEqual(await retrieveSources(topic()), []);
});

test("topic requests use structured output without storage and prioritize the newest history", async () => {
  configuredFixture();
  const raw = topic();
  const { id: _id, duplicate: _duplicate, ...candidate } = raw;
  const history = Array.from({ length: 125 }, (_, index) => ({ ...contentPackage(), id: `package-${index}`, createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString() }));
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.openai.com/v1/responses");
    assert.equal(options?.redirect, "manual");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "fixture-text-model");
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.text.format.type, "json_schema");
    const input = JSON.parse(body.input[0].content[0].text);
    assert.equal(input.previousContent.length, 120);
    assert.equal(input.previousContent[0].id, "package-124");
    assert(!input.previousContent.some((item: { id: string }) => item.id === "package-0"));
    return providerOutput({ topics: [candidate, { ...candidate, title: "Visit questions", angle: "different angle" }, { ...candidate, title: "Prepare for assessment", angle: "third angle" }] });
  };
  const ideas = await generateTopicCandidates({ answers: { objective: "auto", treatment: "auto", special: "" }, blogs: [], history, availableFormats: ["gbp"] });
  assert.equal(ideas.length, 3);
  assert.equal(new Set(ideas.map((item) => item.id)).size, 3);
});

test("draft generation and validation use separate requests and never trust previous approval", async () => {
  configuredFixture();
  const models: string[] = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    models.push(body.model);
    if (models.length === 1) return providerOutput(draft());
    const input = JSON.parse(body.input[0].content[0].text);
    assert.equal(input.draft.safety, undefined);
    assert.equal(input.draft.status, undefined);
    return providerOutput({ medical: false, claims: true, seo: true, duplication: true, tone: true, issues: ["The claim needs stronger evidence."] });
  };
  const generated = await generateDraft({ topic: topic(), formats: ["gbp"], sources: [] });
  assert.equal(generated.blog, null);
  const pkg = { ...contentPackage(), ...generated };
  pkg.safety.status = "READY_FOR_HUMAN_REVIEW";
  const review = await reviewDraft({ package: pkg, blogs: [], history: [] });
  assert.deepEqual(models, ["fixture-text-model", "fixture-review-model"]);
  assert.equal(review.medical, false);
});

test("provider refusal, invalid JSON and unsupported formats fail closed with sanitized errors", async () => {
  configuredFixture();
  globalThis.fetch = async () => new Response("secret upstream response must never escape", { status: 401 });
  await assert.rejects(generateDraft({ topic: topic(), formats: ["gbp"], sources: [] }), (error: Error) => /server credentials/.test(error.message) && !error.message.includes("secret"));
  globalThis.fetch = async () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "provider refusal" }] }] }), { status: 200 });
  await assert.rejects(generateDraft({ topic: topic(), formats: ["gbp"], sources: [] }), /general educational topic/);
  globalThis.fetch = async () => new Response("invalid JSON", { status: 200 });
  await assert.rejects(generateDraft({ topic: topic(), formats: ["gbp"], sources: [] }), /invalid response/);
  globalThis.fetch = async () => providerOutput({ ...draft(), gbp: null });
  await assert.rejects(generateDraft({ topic: topic(), formats: ["gbp"], sources: [] }), /wrong content formats/);
});

test("image calls require an educational brief and independently validated current content", async () => {
  configuredFixture();
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Unapproved image requests must not reach the provider"); };
  const pkg = contentPackage();
  pkg.imageBrief = { kind: "doctor", description: "portrait", alt: "doctor", doctor: "naga-swathi" };
  await assert.rejects(generateContentImage(pkg), /approved portrait/);
  pkg.imageBrief = draft().imageBrief;
  await assert.rejects(generateContentImage(pkg), /Validate the current draft/);
  pkg.safety.status = "READY_FOR_HUMAN_REVIEW";
  pkg.safety.aiReview = { medical: true, claims: true, seo: true, duplication: true, tone: true, issues: ["Needs revision"] };
  await assert.rejects(generateContentImage(pkg), /Validate the current draft/);
  assert.equal(calls, 0);
});
