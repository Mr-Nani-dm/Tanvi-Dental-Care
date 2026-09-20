import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { createAdminSession, BLOG_ADMIN_COOKIE } from "@/lib/adminAuth";
import { contentBranch, readRepoFile, writeRepoFile, repositoryHead, commitRepoFiles } from "@/lib/githubContent";
import { reserveAiCall, ContentError, handoffContentPackage } from "@/lib/contentStore";
import { signTopic, verifyTopic, signPackage, verifyPackageProvenance, verifyPackageReview } from "@/lib/contentIntegrity";
import { CONTENT_POLICY } from "@/config/content-policy";
import type { ContentPackage, TopicIdea } from "@/lib/contentTypes";
import type { BlogPost } from "@/content/blog";
import type { ContentDraft } from "@/lib/contentTypes";
import { countWords } from "@/lib/contentValidation";
import * as topicsRoute from "@/app/api/admin/content/topics/route";
import * as generateRoute from "@/app/api/admin/content/generate/route";
import * as validateRoute from "@/app/api/admin/content/validate/route";
import * as saveRoute from "@/app/api/admin/content/save/route";
import * as imageRoute from "@/app/api/admin/content/image/route";
import * as approveImageRoute from "@/app/api/admin/content/image/approve/route";
import sharp from "sharp";
import * as blogRoute from "@/app/api/admin/blog/route";
import { doctors } from "@/config/site";

const TEST_BRANCH = "feature/tanvi-content-os-v1";
const TEST_ORIGIN = "https://content-preview.example.test";
const TEST_ENV = {
  BLOG_ADMIN_PASSWORD: "test-only-password-never-used-outside-tests",
  BLOG_ADMIN_SESSION_SECRET: "test-only-signing-key-never-used-outside-tests",
  GITHUB_CONTENT_TOKEN: "test-only-github-token",
  GITHUB_CONTENT_REPOSITORY: "Mr-Nani-dm/Tanvi-Dental-Care",
  GITHUB_CONTENT_BRANCH: "main",
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: TEST_BRANCH,
  VERCEL_GIT_REPO_OWNER: "Mr-Nani-dm",
  OPENAI_API_KEY: "test-only-provider-key",
  CONTENT_OS_TEXT_MODEL: "test-text-model",
  CONTENT_OS_REVIEW_MODEL: "test-review-model",
  CONTENT_OS_IMAGE_MODEL: "test-image-model",
};

async function withEnvironment<T>(fn: () => Promise<T> | T, overrides: Record<string, string | undefined> = {}): Promise<T> {
  const next = { ...TEST_ENV, ...overrides };
  const saved = Object.fromEntries(Object.keys(next).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  try { return await fn(); }
  finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

function request(path: string, body: unknown, options: { authenticated?: boolean; origin?: string; raw?: boolean; headers?: Record<string, string> } = {}): NextRequest {
  return new NextRequest(`${TEST_ORIGIN}/api/admin/content/${path}`, {
    method: "POST",
    headers: {
      host: new URL(TEST_ORIGIN).host,
      origin: options.origin ?? TEST_ORIGIN,
      "content-type": "application/json",
      ...(options.authenticated === false ? {} : { cookie: `${BLOG_ADMIN_COOKIE}=${createAdminSession()}` }),
      ...options.headers,
    },
    body: options.raw ? String(body) : JSON.stringify(body),
  });
}

type RecordedRequest = { url: string; method: string; body: any };
type StoredFile = { content: string; sha: string };

/** Emulate GitHub compare-and-swap writes without sending anything to GitHub. */
class FakeGitHub {
  calls: RecordedRequest[] = [];
  files = new Map<string, StoredFile>();
  head = "initial-commit";
  tree = "initial-tree";
  private serial = 0;
  private trees = new Map<string, Map<string, StoredFile>>();
  private commits = new Map<string, { parent: string; tree: string }>();
  conflictWrites = false;
  external: ((url: URL, init?: RequestInit) => Promise<Response>) | undefined;

  constructor() {
    this.set("src/content/content-os-data.json", { version: 1, packages: [] });
    this.set("src/content/content-os-usage.json", { version: 1, reservations: [] });
    this.set("src/content/blog-data.json", []);
    this.trees.set(this.tree, new Map(this.files));
    this.commits.set(this.head, { parent: "", tree: this.tree });
  }
  set(path: string, value: unknown) {
    this.files.set(path, { content: JSON.stringify(value), sha: `blob-${++this.serial}` });
    if (this.trees.has(this.tree)) this.trees.set(this.tree, new Map(this.files));
  }
  get<T>(path: string): T { return JSON.parse(this.files.get(path)!.content) as T; }

  fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
    this.calls.push({ url: url.toString(), method, body });
    if (url.hostname !== "api.github.com") {
      if (this.external) return this.external(url, init);
      throw new Error(`Unexpected external request in test: ${url.hostname}${url.pathname}`);
    }
    const prefix = "/repos/Mr-Nani-dm/Tanvi-Dental-Care/";
    assert.ok(url.pathname.startsWith(prefix), "Only the configured repository may be used");
    const route = decodeURIComponent(url.pathname.slice(prefix.length));
    if (route.startsWith("contents/")) {
      const path = route.slice("contents/".length);
      if (method === "GET") {
        const ref = url.searchParams.get("ref");
        assert.ok(ref === TEST_BRANCH || this.commits.has(ref || ""), "Reads must use the preview branch or its captured commit");
        const snapshot = ref === TEST_BRANCH ? this.files : this.trees.get(this.commits.get(ref!)!.tree)!;
        const file = snapshot.get(path);
        return file ? Response.json({ sha: file.sha, content: Buffer.from(file.content).toString("base64"), encoding: "base64" }) : Response.json({ message: "not found" }, { status: 404 });
      }
      assert.equal(method, "PUT");
      assert.equal(body.branch, TEST_BRANCH, "A preview must never write main");
      const existing = this.files.get(path);
      if (this.conflictWrites || (existing && body.sha !== existing.sha) || (!existing && body.sha)) return Response.json({ message: "sha conflict" }, { status: 409 });
      const file = { content: Buffer.from(body.content, "base64").toString("utf8"), sha: `blob-${++this.serial}` };
      this.files.set(path, file);
      this.tree = `tree-${++this.serial}`;
      this.trees.set(this.tree, new Map(this.files));
      const prior = this.head;
      this.head = `commit-${++this.serial}`;
      this.commits.set(this.head, { parent: prior, tree: this.tree });
      return Response.json({ content: { sha: file.sha }, commit: { sha: this.head } });
    }
    if (route === `git/ref/heads/${TEST_BRANCH}` && method === "GET") return Response.json({ object: { sha: this.head } });
    if (route.startsWith("git/commits/") && method === "GET") {
      const commit = this.commits.get(route.slice("git/commits/".length));
      assert.ok(commit, "Only known commits may be read");
      return Response.json({ tree: { sha: commit.tree } });
    }
    if (route === "git/trees" && method === "POST") {
      const files = new Map(this.trees.get(body.base_tree));
      for (const file of body.tree) files.set(file.path, { content: file.content, sha: `blob-${++this.serial}` });
      const sha = `tree-${++this.serial}`;
      this.trees.set(sha, files);
      return Response.json({ sha });
    }
    if (route === "git/commits" && method === "POST") {
      const sha = `commit-${++this.serial}`;
      this.commits.set(sha, { parent: body.parents[0], tree: body.tree });
      return Response.json({ sha });
    }
    if (route === `git/refs/heads/${TEST_BRANCH}` && method === "PATCH") {
      assert.equal(body.force, false, "Transactions must never force a branch update");
      const commit = this.commits.get(body.sha)!;
      if (this.conflictWrites || commit.parent !== this.head) return Response.json({ message: "not a fast forward" }, { status: 422 });
      this.head = body.sha;
      this.tree = commit.tree;
      this.files = new Map(this.trees.get(this.tree));
      return Response.json({ object: { sha: this.head } });
    }
    throw new Error(`Unhandled GitHub test request: ${method} ${route}`);
  };
}

async function withFakeGitHub<T>(github: FakeGitHub, fn: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = github.fetch as typeof fetch;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

function topicFixture(): TopicIdea {
  return {
    id: "test-topic-1", title: "Preparing questions for a dental check-up in Mangalagiri",
    primaryKeyword: "dental check-up questions", intent: "Prepare for a routine dental appointment",
    treatmentSlug: "general-dental-care", angle: "Bring a short written list of general questions",
    rationale: "A practical planning question is absent from the current inventory.", psychology: "Clarity",
    targetPage: "/treatments/dental-check-ups", evidence: { type: "CONTENT_GAP", reason: "The supplied inventory has no appointment preparation checklist." },
    blogRecommended: true, recommendedFormats: ["blog", "gbp"],
    duplicate: { status: "NEW", score: 0, reason: "Distinct planning question." },
  };
}

function packageFixture(): ContentPackage {
  const now = new Date().toISOString();
  return {
    id: "4b552450-539f-4932-b8d0-0485a037e342", topic: topicFixture(), formats: ["gbp"], createdAt: now, updatedAt: now,
    status: "ready_for_review", sources: [], blog: null,
    gbp: { text: "Planning a dental visit in Mangalagiri? Write down your questions and bring a list of current medicines to help the conversation. Contact Tanvi Dental Care to arrange an appointment.", targetUrl: "/treatments/dental-check-ups", cta: "Contact Tanvi Dental Care to arrange an appointment." },
    instagram: null, reel: null, imageBrief: { kind: "educational", description: "A simple illustration of a tooth next to an appointment notebook.", alt: "Tooth and appointment notebook illustration", doctor: null },
    image: null,
    safety: { status: "READY_FOR_HUMAN_REVIEW", checks: [], aiReview: { medical: true, claims: true, seo: true, duplication: true, tone: true, issues: [] }, checkedAt: now, wordCounts: { gbp: 33 } },
  };
}

function blogDraftFixture(): ContentDraft {
  const blog = {
    title: "Dental check-up questions: preparing for a visit in Mangalagiri",
    slug: "dental-check-up-questions-mangalagiri", excerpt: "A practical guide to organising questions, existing records and appointment details before a dental visit.",
    seoTitle: "Dental check-up questions in Mangalagiri | Tanvi Dental",
    metaDescription: "Prepare questions for a dental check-up in Mangalagiri, organise existing records and discuss your concerns with the dentist.",
    primaryTopic: "dental check-up questions", tags: ["Dental visits", "Patient education"], treatmentSlug: "dental-check-ups",
    cta: "Contact Tanvi Dental Care to arrange an appointment.",
    body: `## Put your main questions in one place

Preparing dental check-up questions can make a visit in Mangalagiri easier to organise. A short written list gives you a place to begin the conversation. You do not need to know the name of a treatment or work out an explanation for a concern before attending. Describe what you would like to understand, then allow the dentist to ask follow-up questions and discuss what an examination can establish. This article is a general planning guide and does not diagnose a condition or recommend a treatment for an individual.

Start with the question that matters most to you. Other useful subjects include how the appointment is organised, what information the clinic needs and when you can ask for clarification. Keep the list in a notebook or on your phone, whichever is easier to use. If the original question changes during the discussion, note the new question. A checklist supports the examination conversation, and some issues may need a further visit. Keep questions concise where possible and allow space beside each item for notes from the discussion.

## Organise the information you already have

Existing dental records can be useful to discuss with the clinic before your appointment. Ask whether any reports or images you already hold are needed, and how to bring them securely. Keep personal health details out of public messages, social comments and online reviews. This planning guide does not ask you to send private records through the website. For general information about an appointment, see the clinic's [dental check-up page](/treatments/dental-check-ups).

It may help to prepare a current list of medicines and relevant health information for the treating dentist. The purpose is to support an accurate conversation, not to change a medicine yourself. If you do not remember a detail, say so and ask how to confirm it. Do not guess a diagnosis or assume that a treatment discussed previously will be appropriate now. The dentist can explain what needs to be assessed and which information is relevant to the present visit. Bring questions about records as well as the records themselves.

## Ask for an explanation you can follow

During the visit, ask the dentist to explain unfamiliar words in ordinary language. Useful questions can include what the examination is intended to assess, what remains uncertain and whether more information is needed before options can be discussed. If treatment is proposed, ask about the purpose of the option, alternatives, practical steps and relevant limitations. Individual recommendations depend on assessment, and this general article does not establish which option is suitable for you.

You can also ask how costs will be explained and whether a written plan is available when appropriate. A clear conversation allows time to understand the proposed next step. Avoid relying on broad online promises about fixed timelines or universal suitability. Those statements cannot replace an individual discussion. The [Indian Dental Association's patient information](https://www.ida.org.in/Public/Details/WhyVisitDentist) is a reference for general background on dental visits; it is not a substitute for advice from the treating dentist. Ask which parts of any general reading apply to your circumstances and which do not.

## Confirm the practical next step

Before leaving, check that you understand what happens next. You might need clarification about a future discussion, a document to bring or how to contact the clinic with an administrative question. Write down the agreed next step in your own words and ask if you have understood it correctly. This is especially helpful when several topics have been discussed. Keep any personalised instructions from the dentist separate from general information you read online.

For a visit in Mangalagiri, confirm the appointment time with the clinic and allow enough time for your journey. The website's [contact information](/#contact) provides a starting point for arranging a visit. Availability and individual plans should be confirmed directly. If you are helping a family member organise an appointment, support their questions while respecting their privacy and choices. A useful checklist remains brief enough to follow and flexible enough for new questions to arise. You can review it again after the visit to identify anything that still needs an explanation.

Contact Tanvi Dental Care to arrange an appointment.`,
  };
  return { blog, gbp: packageFixture().gbp, instagram: null, reel: null, imageBrief: packageFixture().imageBrief };
}

function providerTopicFixture(): Record<string, unknown>[] {
  const first = topicFixture();
  const second: TopicIdea = { ...first, id: "test-topic-2", title: "Discussing cleaning and scaling at a convenient clinic visit", primaryKeyword: "cleaning consultation", intent: "Plan a discussion about cleaning", treatmentSlug: "teeth-cleaning-and-scaling", angle: "Ask the clinic how a cleaning discussion can fit an appointment", rationale: "A short clinic planning reminder can support patient questions.", targetPage: "/treatments/teeth-cleaning-and-scaling", blogRecommended: false, recommendedFormats: ["gbp"] };
  const third: TopicIdea = { ...first, id: "test-topic-3", title: "Existing records for a wisdom tooth assessment conversation", primaryKeyword: "wisdom tooth records", intent: "Ask which existing records to bring", treatmentSlug: "wisdom-tooth-management", angle: "Organising existing reports before an assessment conversation", rationale: "A practical records reminder has a different intent from treatment explanations.", targetPage: "/treatments/wisdom-tooth-management", blogRecommended: false, recommendedFormats: ["gbp"] };
  return [first, second, third].map(({ id: _id, duplicate: _duplicate, token: _token, ...topic }) => topic);
}

function mockProviderAndSources(github: FakeGitHub, options: { draft?: ContentDraft; draftResponses?: ContentDraft[]; reviewPass?: boolean; imageBytes?: Uint8Array } = {}) {
  let draftIndex = 0;
  github.external = async (url, init) => {
    if (url.hostname === "www.ida.org.in" || url.hostname === "www.iacde.in") {
      assert.equal(init?.redirect, "manual", "Source fetches must reject redirects rather than follow them");
      return new Response(`<html><body><h1>Patient information</h1><p>A dental visit gives people an opportunity to discuss oral health, ask questions and arrange an individual assessment with their dentist before making treatment decisions.</p><p>${"General patient education supports a conversation with a dentist about appropriate dental care. ".repeat(8)}</p></body></html>`, { headers: { "content-type": "text/html" } });
    }
    assert.equal(url.hostname, "api.openai.com");
    const body = JSON.parse(String(init?.body));
    if (url.pathname === "/v1/images/generations") {
      assert.ok(options.imageBytes, "An image request was not expected in this fixture");
      return Response.json({ data: [{ b64_json: Buffer.from(options.imageBytes).toString("base64") }] });
    }
    assert.equal(url.pathname, "/v1/responses");
    assert.equal(body.store, false, "Content generation must disable provider response storage");
    assert.equal(body.text.format.strict, true);
    const schema = body.text.format.name;
    const output = schema === "tanvi_topic_ideas" ? { topics: providerTopicFixture() }
      : schema === "tanvi_content_draft" ? options.draftResponses?.[Math.min(draftIndex++, options.draftResponses.length - 1)] || options.draft || blogDraftFixture()
      : schema === "tanvi_independent_review" ? { medical: options.reviewPass !== false, claims: options.reviewPass !== false, seo: true, duplication: true, tone: true, issues: options.reviewPass === false ? [{ category: "medical", message: "The claim needs clinical review." }] : [], claimChecks: [] }
      : undefined;
    assert.ok(output, `Unexpected provider schema ${schema}`);
    assert.equal(body.model, schema === "tanvi_independent_review" ? "test-review-model" : "test-text-model");
    return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] });
  };
}

const routes = { topics: topicsRoute.POST, generate: generateRoute.POST, validate: validateRoute.POST, save: saveRoute.POST, image: imageRoute.POST, "image/approve": approveImageRoute.POST };

async function successfulPackage(response: Response): Promise<ContentPackage> {
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.ok(payload.package?.id);
  return payload.package as ContentPackage;
}

function seedHandoff(github: FakeGitHub): BlogPost {
  const draft = blogDraftFixture();
  const pkg: ContentPackage = {
    ...packageFixture(), ...draft, gbp: null, formats: ["blog"], status: "handed_off", blogSlug: draft.blog!.slug,
    sources: [{ id: "ida-dental-visits", title: "Indian Dental Association: visiting a dentist", url: "https://www.ida.org.in/Public/Details/WhyVisitDentist", excerpt: "Dental visits offer an opportunity to discuss oral health and questions with a dentist.", retrievedAt: new Date().toISOString(), status: "VERIFIED" }],
  };
  const post: BlogPost = {
    ...draft.blog!, status: "draft", category: "Dental Health", author: "Tanvi Dental Care Editorial Team", readTime: "4 min read",
    contentOsId: pkg.id, contentOsCta: draft.blog!.cta,
  };
  github.set("src/content/content-os-data.json", { version: 1, packages: [pkg] });
  github.set("src/content/blog-data.json", [post]);
  return post;
}

test("preview branch ignores inherited production content branch and rejects unsafe configuration", async () => {
  await withEnvironment(() => assert.equal(contentBranch(), TEST_BRANCH));
  for (const ref of [undefined, "main", "master"]) {
    await withEnvironment(() => assert.throws(() => contentBranch(), /separate preview/i), { VERCEL_GIT_COMMIT_REF: ref });
  }
  await withEnvironment(() => assert.throws(() => contentBranch(), /fork/i), { VERCEL_GIT_REPO_OWNER: "untrusted-fork-owner" });
  await withEnvironment(() => assert.throws(() => contentBranch(), /development branch/i), { VERCEL_ENV: undefined, GITHUB_CONTENT_BRANCH: "main" });
});

test("repository reads and writes remain confined to the preview branch", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const file = await readRepoFile("src/content/content-os-data.json");
      await writeRepoFile({ path: "src/content/content-os-data.json", content: JSON.stringify({ version: 1, packages: [] }), sha: file.sha, message: "Test draft save" });
      assert.equal(github.calls.length, 2);
      assert.equal(github.calls[1].body.branch, TEST_BRANCH);
    });
  });
});

test("GitHub handoff transaction rejects a competing update without partially writing files", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const head = await repositoryHead();
      const beforeHistory = github.get("src/content/content-os-data.json");
      const beforeBlogs = github.get("src/content/blog-data.json");
      github.conflictWrites = true;
      await assert.rejects(() => commitRepoFiles(head, [
        { path: "src/content/content-os-data.json", content: JSON.stringify({ version: 1, packages: [{ id: "should-not-save" }] }) },
        { path: "src/content/blog-data.json", content: JSON.stringify([{ slug: "should-not-save", status: "draft" }]) },
      ], "Test atomic handoff"), /transaction failed/i);
      assert.deepEqual(github.get("src/content/content-os-data.json"), beforeHistory);
      assert.deepEqual(github.get("src/content/blog-data.json"), beforeBlogs);
    });
  });
});

test("signed topic and source provenance reject client tampering", async () => {
  await withEnvironment(() => {
    const topic = signTopic(topicFixture());
    assert.equal(verifyTopic(topic), true);
    assert.equal(verifyTopic({ ...topic, blogRecommended: false }), false);
    assert.equal(verifyTopic({ ...topic, targetPage: "https://unapproved.example.test" }), false);
    assert.equal(verifyTopic({ ...topic, token: `${topic.token}.extra` }), false);
    const pkg = signPackage(packageFixture(), true);
    assert.equal(verifyPackageProvenance(pkg), true);
    assert.equal(verifyPackageProvenance({ ...pkg, sources: [{ id: "forged", title: "Unverified claim", url: "https://unapproved.example.test", status: "VERIFIED", excerpt: "Forged evidence", retrievedAt: new Date().toISOString() }] }), false);
    assert.equal(verifyPackageProvenance({ ...pkg, formats: ["blog"] }), false);
    assert.equal(verifyPackageProvenance({ ...pkg, image: { path: "/images/content/2026/09/forged.webp", alt: "Forged", provenance: "AI_GENERATED", model: "forged", createdAt: new Date().toISOString(), needsHumanReview: true } }), false);
  });
});

test("editing content invalidates the separate review signature while permitting revalidation", async () => {
  await withEnvironment(() => {
    const pkg = signPackage(packageFixture(), true);
    assert.equal(verifyPackageReview(pkg), true);
    const edited = { ...pkg, gbp: { ...pkg.gbp!, text: `${pkg.gbp!.text} Guaranteed results.` } };
    assert.equal(verifyPackageProvenance(edited), true, "Ordinary body editing is allowed before a fresh review");
    assert.equal(verifyPackageReview(edited), false, "Old review must never approve edited content");
    assert.equal(verifyPackageReview({ ...pkg, safety: { ...pkg.safety, aiReview: null } }), false);
    assert.equal(verifyPackageReview({ ...pkg, reviewToken: pkg.proof }), false, "A provenance token cannot substitute for AI review");
  });
});

test("concurrent AI reservations cannot spend the same final quota slot", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    const reservations = Array.from({ length: CONTENT_POLICY.ai.textPerHour - 1 }, (_, i) => ({ id: `prior-${i}`, kind: "text", at: new Date().toISOString() }));
    github.set("src/content/content-os-usage.json", { version: 1, reservations });
    await withFakeGitHub(github, async () => {
      const results = await Promise.allSettled([reserveAiCall("text"), reserveAiCall("text")]);
      assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
      const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected")!;
      assert.ok(rejected.reason instanceof ContentError);
      assert.equal(rejected.reason.status, 429);
      const store = github.get<{ reservations: unknown[] }>("src/content/content-os-usage.json");
      assert.equal(store.reservations.length, CONTENT_POLICY.ai.textPerHour);
    });
  });
});

test("image quotas are stricter and storage failures fail closed", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    github.set("src/content/content-os-usage.json", { version: 1, reservations: Array.from({ length: CONTENT_POLICY.ai.imagesPerHour }, (_, i) => ({ id: `image-${i}`, kind: "image", at: new Date().toISOString() })) });
    await withFakeGitHub(github, async () => {
      await assert.rejects(() => reserveAiCall("image"), (error: unknown) => error instanceof ContentError && error.status === 429);
      github.set("src/content/content-os-usage.json", { version: 9, reservations: [] });
      await assert.rejects(() => reserveAiCall("text"), (error: unknown) => error instanceof ContentError && error.status === 503);
      github.set("src/content/content-os-usage.json", { version: 1, reservations: [] });
      github.conflictWrites = true;
      await assert.rejects(() => reserveAiCall("text"), /Unable to write content/);
      assert.equal(github.get<{ reservations: unknown[] }>("src/content/content-os-usage.json").reservations.length, 0);
    });
  });
});

test("handoff refuses to overwrite an existing published URL", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    const published: BlogPost = { slug: "existing-published-post", title: "Existing published post", status: "published", excerpt: "Existing article", category: "Patient education", readTime: "3 min read", metaDescription: "An existing article", author: "Tanvi Dental Care", tags: [], body: "Existing published content" };
    github.set("src/content/blog-data.json", [published]);
    await withFakeGitHub(github, async () => {
      await assert.rejects(() => handoffContentPackage(packageFixture(), () => ({ ...published, status: "draft", body: "Attempted replacement" })), (error: unknown) => error instanceof ContentError && error.status === 409);
      assert.deepEqual(github.get("src/content/blog-data.json"), [published]);
      assert.equal(github.calls.filter((call) => call.method === "POST" || call.method === "PUT" || call.method === "PATCH").length, 0);
    });
  });
});

test("every Content OS write route rejects anonymous and cross-origin requests before external calls", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      for (const [name, handler] of Object.entries(routes)) {
        const anonymous = await handler(request(name, {}, { authenticated: false }));
        assert.equal(anonymous.status, 401, `${name} must require authentication`);
        assert.match(anonymous.headers.get("cache-control") || "", /no-store/);
        const foreign = await handler(request(name, {}, { origin: "https://unrelated.example.test" }));
        assert.equal(foreign.status, 403, `${name} must reject a foreign origin`);
        const forged = await handler(request(name, {}, { headers: { cookie: `${BLOG_ADMIN_COOKIE}=forged-session` } }));
        assert.equal(forged.status, 401, `${name} must reject a forged session`);
      }
      const session = await saveRoute.GET(new NextRequest(`${TEST_ORIGIN}/api/admin/content/save`));
      assert.equal(session.status, 401);
      assert.equal((await session.json()).authenticated, false);
      assert.equal(github.calls.length, 0);
    });
  });
});

test("request parser bounds streamed input, rejects malformed JSON and requires JSON content type", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const oversized = JSON.stringify({ answers: { special: "x".repeat(150_001) } });
      assert.equal((await topicsRoute.POST(request("topics", oversized, { raw: true, headers: { "content-length": "10" } }))).status, 413, "A dishonest small Content-Length cannot bypass the stream limit");
      assert.equal((await topicsRoute.POST(request("topics", {}, { headers: { "content-length": "150001" } }))).status, 413);
      assert.equal((await topicsRoute.POST(request("topics", "{invalid", { raw: true }))).status, 400);
      assert.equal((await topicsRoute.POST(request("topics", [], {}))).status, 400);
      assert.equal((await topicsRoute.POST(request("topics", {}, { headers: { "content-type": "text/plain" } }))).status, 415);
      assert.equal(github.calls.length, 0);
    });
  });
});

test("missing AI setup returns an actionable setup response without spending or leaking secrets", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const response = await topicsRoute.POST(request("topics", { answers: { objective: "auto", treatment: "auto", special: "" } }));
      assert.equal(response.status, 503);
      const text = await response.text();
      assert.match(text, /setup is required/i);
      assert.doesNotMatch(text, /test-only|Bearer/);
      assert.equal(github.calls.length, 0);
    });
  }, { OPENAI_API_KEY: undefined });
});

test("planner rejects private patient details before GitHub or AI requests", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const response = await topicsRoute.POST(request("topics", { answers: { objective: "patient_education", treatment: "auto", special: "Patient name: Example Person, phone 9876543210" } }));
      assert.equal(response.status, 422);
      assert.equal(github.calls.length, 0);
    });
  });
});

test("three topics → generation → edited revalidation → save → Blog Manager handoff stays a draft", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    mockProviderAndSources(github);
    await withFakeGitHub(github, async () => {
      const topicResponse = await topicsRoute.POST(request("topics", { answers: { objective: "patient_education", treatment: "auto", special: "" } }));
      const topicBody = await topicResponse.json();
      assert.equal(topicResponse.status, 200, JSON.stringify(topicBody));
      const topics = topicBody.topics as TopicIdea[];
      assert.equal(topics.length, 3);
      assert.equal(new Set(topics.map((item) => item.title)).size, 3);
      assert.ok(topics.every((topic) => verifyTopic(topic) && topic.evidence.type === "CONTENT_GAP" && topic.duplicate.status !== "DUPLICATE"));
      const generated = await successfulPackage(await generateRoute.POST(request("generate", { topic: topics[0], formats: ["blog", "gbp"] })));
      assert.equal(generated.safety.status, "READY_FOR_HUMAN_REVIEW", JSON.stringify(generated.safety));
      assert.ok(countWords(`${generated.blog!.title} ${generated.blog!.body}`) >= 700);
      assert.ok(countWords(`${generated.blog!.title} ${generated.blog!.body}`) <= 900);
      assert.ok(generated.sources.length > 0);
      assert.ok(generated.sources.every((source) => source.excerpt.split(/\s+/).length <= 24));
      const aiRequests = github.calls.filter((call) => call.url === "https://api.openai.com/v1/responses");
      assert.deepEqual(aiRequests.map((call) => call.body.text.format.name), ["tanvi_topic_ideas", "tanvi_content_draft", "tanvi_independent_review"]);
      assert.equal(verifyPackageReview(generated), true);
      const edited = { ...generated, blog: { ...generated.blog!, body: generated.blog!.body.replace("A short written list", "A short paper checklist") } };
      assert.equal(verifyPackageReview(edited), false);
      const imageBeforeReview = await imageRoute.POST(request("image", { package: edited, publicStorageConfirmed: true, rightsConfirmed: true }));
      assert.equal(imageBeforeReview.status, 422, "An edited draft cannot use its old image approval");
      const validated = await successfulPackage(await validateRoute.POST(request("validate", { package: edited })));
      assert.equal(validated.safety.status, "READY_FOR_HUMAN_REVIEW", JSON.stringify(validated.safety));
      const saved = await successfulPackage(await saveRoute.POST(request("save", { package: validated, action: "save", publicStorageConfirmed: true })));
      assert.ok(saved.revision);
      assert.equal(github.get<{ packages: ContentPackage[] }>("src/content/content-os-data.json").packages.length, 1);
      const handoffResponse = await saveRoute.POST(request("save", { package: saved, action: "handoff", publicStorageConfirmed: true }));
      const handoff = await handoffResponse.json();
      assert.equal(handoffResponse.status, 200, JSON.stringify(handoff));
      assert.equal(handoff.package.status, "handed_off");
      assert.match(handoff.blogUrl, /^\/admin\/blog\?draft=/);
      const blogs = github.get<BlogPost[]>("src/content/blog-data.json");
      assert.equal(blogs.length, 1);
      assert.equal(blogs[0].status, "draft");
      assert.equal(blogs[0].reviewedBy, undefined, "AI must never invent a clinician sign-off");
      assert.equal(blogs[0].reviewedAt, undefined);
      assert.equal(blogs[0].imageRightsConfirmed, false);
      assert.equal(blogs[0].contentOsId, generated.id);
      const repeated = await saveRoute.POST(request("save", { package: handoff.package, action: "handoff", publicStorageConfirmed: true }));
      assert.equal(repeated.status, 409);
      assert.equal(github.get<BlogPost[]>("src/content/blog-data.json").length, 1);
      const history = await saveRoute.GET(new NextRequest(`${TEST_ORIGIN}/api/admin/content/save`, { headers: { cookie: `${BLOG_ADMIN_COOKIE}=${createAdminSession()}` } }));
      const historyPayload = await history.json();
      assert.equal(history.status, 200);
      assert.equal(historyPayload.history.length, 1);
      assert.equal(historyPayload.history[0].blogSlug, blogs[0].slug);
      assert.equal(historyPayload.setup.branch, TEST_BRANCH);
      assert.equal(historyPayload.setup.preview, true);
    });
  });
});

test("forged source evidence and missing public-storage acknowledgement cannot be saved", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const pkg = signPackage(packageFixture(), true);
      const unacknowledged = await saveRoute.POST(request("save", { package: pkg, action: "save" }));
      assert.equal(unacknowledged.status, 422);
      const forged = { ...pkg, sources: [{ id: "forged", title: "Unverified", url: "https://unapproved.example.test", status: "VERIFIED", excerpt: "Fake evidence", retrievedAt: new Date().toISOString() }] };
      const response = await saveRoute.POST(request("save", { package: forged, action: "save", publicStorageConfirmed: true }));
      assert.equal(response.status, 409);
      assert.equal(github.calls.length, 0);
    });
  });
});

test("independent AI rejection keeps content under review and blocks image generation", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    mockProviderAndSources(github, { reviewPass: false });
    await withFakeGitHub(github, async () => {
      const validated = await successfulPackage(await validateRoute.POST(request("validate", { package: signPackage(packageFixture(), false) })));
      assert.equal(validated.status, "needs_review");
      assert.equal(validated.safety.status, "NEEDS_REVIEW");
      const response = await imageRoute.POST(request("image", { package: validated, publicStorageConfirmed: true, rightsConfirmed: true }));
      assert.equal(response.status, 422);
      assert.equal(github.calls.some((call) => call.url.includes("/images/generations")), false);
      assert.equal(github.calls.some((call) => call.method === "PUT" && call.url.includes("/public/images/")), false);
    });
  });
});

test("image route stages private pixels and only stores the exact approved WebP in the preview branch", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    const fixtureImage = await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 20, g: 130, b: 135 } } }).png().withMetadata().toBuffer();
    mockProviderAndSources(github, { imageBytes: fixtureImage });
    await withFakeGitHub(github, async () => {
      const unreviewed = signPackage(packageFixture(), false);
      assert.equal((await imageRoute.POST(request("image", { package: unreviewed, publicStorageConfirmed: true, rightsConfirmed: true }))).status, 422);
      const reviewed = signPackage(packageFixture(), true);
      assert.equal((await imageRoute.POST(request("image", { package: reviewed, publicStorageConfirmed: true }))).status, 422);
      const stagedResponse = await imageRoute.POST(request("image", { package: reviewed, publicStorageConfirmed: true, rightsConfirmed: true }));
      assert.equal(stagedResponse.status, 200);
      const staged = await stagedResponse.json();
      assert.equal(staged.package.image, null);
      assert.equal(github.calls.some(call => call.method === "PUT" && call.url.includes("/contents/public/images/")), false, "Unreviewed pixels must not enter public GitHub");
      const payload = { package: staged.package, stagedImage: staged.stagedImage, imageBase64: staged.imagePreview.split(",")[1], publicStorageConfirmed: true, rightsConfirmed: true, visualApproved: true };
      assert.equal((await approveImageRoute.POST(request("image/approve", { ...payload, visualApproved: false }))).status, 422);
      const tampered = await approveImageRoute.POST(request("image/approve", { ...payload, imageBase64: Buffer.from("tampered bytes").toString("base64") })); assert.equal(tampered.status, 409, JSON.stringify(await tampered.json()));
      assert.equal((await approveImageRoute.POST(request("image/approve", { ...payload, stagedImage: staged.stagedImage + "x" }))).status, 409);
      assert.equal((await approveImageRoute.POST(request("image/approve", { ...payload, package: signPackage({ ...reviewed, id: "different-package" }, true) }))).status, 409);
      const generated = await successfulPackage(await approveImageRoute.POST(request("image/approve", payload)));
      assert.ok(generated.image?.visualApprovedAt);
      assert.match(generated.image!.sha256!, /^[a-f0-9]{64}$/);
      assert.equal(generated.image?.provenance, "AI_GENERATED");
      assert.equal(generated.image?.needsHumanReview, true);
      assert.match(generated.image!.path, /^\/images\/content\/\d{4}\/\d{2}\/[a-f0-9-]+\.webp$/);
      assert.equal(verifyPackageProvenance(generated), true);
      const writes = github.calls.filter((call) => call.method === "PUT" && call.url.includes("/contents/public/images/content/"));
      assert.equal(writes.length, 1);
      assert.equal(writes[0].body.branch, TEST_BRANCH);
      const metadata = await sharp(Buffer.from(writes[0].body.content, "base64")).metadata();
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.exif, undefined);
      assert.equal(metadata.icc, undefined);
      assert.equal(github.get<BlogPost[]>("src/content/blog-data.json").length, 0);
    });
  });
});

test("doctor image selection reuses the approved portrait without a paid image request", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    await withFakeGitHub(github, async () => {
      const pkg = packageFixture();
      pkg.imageBrief = { kind: "doctor", doctor: "naga-swathi", description: "Use the existing approved portrait of Dr. Naga Swathi Pokala.", alt: "Dr. Naga Swathi Pokala" };
      const generated = await successfulPackage(await imageRoute.POST(request("image", { package: signPackage(pkg, true), publicStorageConfirmed: true, rightsConfirmed: true })));
      assert.equal(generated.image?.path, "/images/doctors/naga-swathi.webp");
      assert.equal(generated.image?.provenance, "APPROVED_DOCTOR_PHOTO");
      assert.equal(github.calls.some((call) => call.url.includes("api.openai.com")), false);
      assert.equal(github.calls.some((call) => call.method !== "GET"), false);
    });
  }, { CONTENT_OS_IMAGE_MODEL: undefined });
});

test("generation repairs an oversized article once and recounts before separate review", async () => {
  await withEnvironment(async () => {
    const normal = blogDraftFixture();
    const overlong: ContentDraft = { ...normal, blog: { ...normal.blog!, body: `${normal.blog!.body}\n\n${"General planning questions support a clear conversation. ".repeat(70)}` } };
    assert.ok(countWords(`${overlong.blog!.title} ${overlong.blog!.body}`) > 1000);
    const github = new FakeGitHub();
    mockProviderAndSources(github, { draftResponses: [overlong, normal] });
    await withFakeGitHub(github, async () => {
      const pkg = await successfulPackage(await generateRoute.POST(request("generate", { topic: signTopic(topicFixture()), formats: ["blog", "gbp"] })));
      assert.ok(countWords(`${pkg.blog!.title} ${pkg.blog!.body}`) <= 1000);
      assert.equal(pkg.safety.status, "READY_FOR_HUMAN_REVIEW");
      const ai = github.calls.filter((call) => call.url === "https://api.openai.com/v1/responses");
      assert.deepEqual(ai.map((call) => call.body.text.format.name), ["tanvi_content_draft", "tanvi_content_draft", "tanvi_independent_review"]);
      const correction = JSON.parse(ai[1].body.input[0].content[0].text);
      assert.match(correction.correction, /Reduce.*700.?900 words/);
      assert.equal(correction.previousDraft.blog.body, overlong.blog!.body.trim());
    });
    const failedRepair = new FakeGitHub();
    mockProviderAndSources(failedRepair, { draft: overlong });
    await withFakeGitHub(failedRepair, async () => {
      const response = await generateRoute.POST(request("generate", { topic: signTopic(topicFixture()), formats: ["blog", "gbp"] }));
      assert.equal(response.status, 422);
      assert.match((await response.json()).error, /exceeds 1,000 words/);
      const ai = failedRepair.calls.filter((call) => call.url === "https://api.openai.com/v1/responses");
      assert.equal(ai.length, 2);
      assert.equal(ai.some((call) => call.body.text.format.name === "tanvi_independent_review"), false);
      assert.equal(failedRepair.get<{ packages: ContentPackage[] }>("src/content/content-os-data.json").packages.length, 0);
    });
  });
});

test("Blog Manager retains Content OS safeguards and requires a real clinician review", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    const post = seedHandoff(github);
    await withFakeGitHub(github, async () => {
      const missingReview = await blogRoute.POST(request("../blog", { post: { ...post, contentOsId: undefined }, originalSlug: post.slug, action: "publish", publicStorageConfirmed: true }));
      assert.equal(missingReview.status, 422);
      assert.match((await missingReview.json()).error, /clinician must review/i);
      const impossibleDate = await blogRoute.POST(request("../blog", { post: { ...post, reviewedBy: doctors[0].name, reviewedAt: "2026-02-31" }, originalSlug: post.slug, action: "publish", publicStorageConfirmed: true }));
      assert.equal(impossibleDate.status, 422);
      assert.match((await impossibleDate.json()).error, /valid review date/i);
      const changedUrl = await blogRoute.POST(request("../blog", { post: { ...post, slug: "renamed-to-evade-the-source-record", contentOsId: "" }, originalSlug: post.slug, action: "draft", publicStorageConfirmed: true }));
      assert.equal(changedUrl.status, 422);
      assert.match((await changedUrl.json()).error, /handoff URL is fixed/);
      assert.equal(github.get<BlogPost[]>("src/content/blog-data.json")[0].status, "draft");
      assert.equal(github.calls.some((call) => call.method !== "GET"), false);
    });
  });
});

test("Blog Manager ignores a malicious backdate on first Content OS publication and independently reviews the final text", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    const post = seedHandoff(github);
    mockProviderAndSources(github);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    await withFakeGitHub(github, async () => {
      const response = await blogRoute.POST(request("../blog", { post: { ...post, publishedAt: "2001-01-01", contentOsId: "forged-id", contentOsCta: `  ${post.contentOsCta}  `, reviewedBy: doctors[0].name, reviewedAt: today }, originalSlug: post.slug, action: "publish", publicStorageConfirmed: true }));
      const payload = await response.json();
      assert.equal(response.status, 200, JSON.stringify(payload));
      assert.equal(payload.post.status, "published");
      assert.equal(payload.post.publishedAt, today);
      assert.equal(payload.post.contentOsId, post.contentOsId);
      assert.equal(payload.post.contentOsCta, post.contentOsCta);
      const providerCalls = github.calls.filter((call) => call.url === "https://api.openai.com/v1/responses");
      assert.equal(providerCalls.length, 1);
      assert.equal(providerCalls[0].body.text.format.name, "tanvi_independent_review");
      assert.equal(github.get<BlogPost[]>("src/content/blog-data.json")[0].publishedAt, today);
    });
  });
});

test("legacy Blog Manager drafts retain their existing publication flow without Content OS or AI setup", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    const legacy: BlogPost = { ...blogDraftFixture().blog!, status: "draft", category: "Dental Health", author: "Tanvi Dental Care Editorial Team", readTime: "4 min read" };
    github.set("src/content/blog-data.json", [legacy]);
    await withFakeGitHub(github, async () => {
      const response = await blogRoute.POST(request("../blog", { post: legacy, originalSlug: legacy.slug, action: "publish", publicStorageConfirmed: true }));
      const payload = await response.json();
      assert.equal(response.status, 200, JSON.stringify(payload));
      assert.equal(payload.post.status, "published");
      assert.equal(payload.post.contentOsId, undefined);
      assert.equal(github.calls.some((call) => call.url.includes("api.openai.com")), false);
      assert.equal(github.calls.some((call) => call.url.includes("content-os-data.json")), false);
    });
  }, { OPENAI_API_KEY: undefined, CONTENT_OS_TEXT_MODEL: undefined, CONTENT_OS_REVIEW_MODEL: undefined });
});

test("explicit treatment focus rejects unrelated model topics on both bounded attempts", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    mockProviderAndSources(github);
    await withFakeGitHub(github, async () => {
      const response = await topicsRoute.POST(request("topics", { answers: { objective: "patient_education", treatment: "root-canal-treatment", special: "" } }));
      assert.equal(response.status, 422);
      const calls = github.calls.filter(call => call.url === "https://api.openai.com/v1/responses");
      assert.equal(calls.length, 2);
      assert.match(JSON.parse(calls[1].body.input[0].content[0].text).correction, /Strictly match treatment root-canal-treatment/);
    });
  });
});

test("review outage preserves generated draft without an approval signature", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    mockProviderAndSources(github);
    const external = github.external!;
    github.external = async (url, init) => {
      if (url.hostname === "api.openai.com" && JSON.parse(String(init?.body)).text?.format?.name === "tanvi_independent_review") return new Response("unavailable", { status: 503 });
      return external(url, init);
    };
    await withFakeGitHub(github, async () => {
      const pkg = await successfulPackage(await generateRoute.POST(request("generate", { topic: signTopic(topicFixture()), formats: ["blog", "gbp"] })));
      assert.ok(pkg.blog?.body);
      assert.equal(pkg.safety.status, "PENDING");
      assert.equal(pkg.safety.aiReview, null);
      assert.equal(verifyPackageReview(pkg), false);
      assert.equal(verifyPackageProvenance(pkg), true);
      assert.match(pkg.safety.checks.flatMap(check => check.messages).join(" "), /draft is preserved/);
    });
  });
});

test("generation corrects failed word checks and independently reviews the replacement", async () => {
  await withEnvironment(async () => {
    const normal = blogDraftFixture();
    const short = { ...normal, gbp: { ...normal.gbp!, text: normal.gbp!.cta } };
    const github = new FakeGitHub();
    mockProviderAndSources(github, { draftResponses: [short, normal] });
    await withFakeGitHub(github, async () => {
      const pkg = await successfulPackage(await generateRoute.POST(request("generate", { topic: signTopic(topicFixture()), formats: ["blog", "gbp"] })));
      assert.equal(pkg.safety.status, "READY_FOR_HUMAN_REVIEW");
      const ai = github.calls.filter(call => call.url === "https://api.openai.com/v1/responses");
      assert.deepEqual(ai.map(call => call.body.text.format.name), ["tanvi_content_draft", "tanvi_independent_review", "tanvi_content_draft", "tanvi_independent_review"]);
      const repair = JSON.parse(ai[2].body.input[0].content[0].text);
      assert.match(repair.correction, /GBP|Google|words/i);
      assert.equal(pkg.image, null);
      assert.equal(verifyPackageReview(pkg), true);
    });
  });
});

test("automatic correction is bounded and cannot override independent rejection", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    mockProviderAndSources(github, { reviewPass: false });
    await withFakeGitHub(github, async () => {
      const pkg = await successfulPackage(await generateRoute.POST(request("generate", { topic: signTopic(topicFixture()), formats: ["blog", "gbp"] })));
      assert.equal(pkg.safety.status, "NEEDS_REVIEW");
      assert.equal(github.calls.filter(call => call.body?.text?.format?.name === "tanvi_content_draft").length, 2);
      const image = await imageRoute.POST(request("image", { package: pkg, publicStorageConfirmed: true, rightsConfirmed: true }));
      assert.equal(image.status, 422);
      assert.equal(github.calls.some(call => call.url.endsWith("/images/generations")), false);
    });
  });
});

test("failed correction preserves the previously reviewed draft", async () => {
  await withEnvironment(async () => {
    const github = new FakeGitHub();
    mockProviderAndSources(github, { reviewPass: false });
    const original = github.external!;
    let writes = 0;
    github.external = async (url, init) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (body.text?.format?.name === "tanvi_content_draft" && ++writes > 1) return Response.json({ error: { message: "private provider error" } }, { status: 503 });
      return original(url, init);
    };
    await withFakeGitHub(github, async () => {
      const response = await generateRoute.POST(request("generate", { topic: signTopic(topicFixture()), formats: ["blog", "gbp"] }));
      const result = await response.json();
      assert.equal(response.status, 200);
      assert.equal(result.package.safety.status, "NEEDS_REVIEW");
      assert.match(result.notice, /preserved/);
      assert.doesNotMatch(JSON.stringify(result), /private provider error/);
    });
  });
});
