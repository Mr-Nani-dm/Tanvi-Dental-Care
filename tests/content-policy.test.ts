import assert from "node:assert/strict";
import { test } from "node:test";
import type { BlogPost } from "@/content/blog";
import { CONTENT_POLICY } from "@/config/content-policy";
import { EXTERNAL_SOURCES, isApprovedInternalUrl, isApprovedSourceUrl } from "@/config/content-sources";
import { findClaimIssues, findPrivateInputIssues } from "@/config/content-safety";
import { checkDuplicates } from "@/lib/duplicateChecker";
import { availableFormats, contentPeriodKeys, contentWorthiness, countWords, getFrequencyUsage, validateContentDraft, validateDailyAnswers, validatePackage, validateTopics } from "@/lib/contentValidation";
import type { ContentPackage, TopicIdea } from "@/lib/contentTypes";

const NOW = new Date("2026-09-20T10:00:00.000Z");
function topic(overrides: Partial<TopicIdea> = {}): TopicIdea {
  return { id: "topic-one", title: "Cleaning around a dental implant", primaryKeyword: "daily implant cleaning", intent: "Practical patient education", treatmentSlug: "dental-implants", angle: "Questions about home cleaning around implant restorations", rationale: "A distinct practical question is not covered in the current article inventory.", psychology: "Clarity", targetPage: "/treatments/dental-implants", evidence: { type: "CONTENT_GAP", reason: "The current content inventory has no article addressing this question." }, blogRecommended: false, recommendedFormats: ["gbp"], duplicate: { status: "NEW", reason: "No similar item found.", score: 0 }, ...overrides };
}
function packageFixture(overrides: Partial<ContentPackage> = {}): ContentPackage {
  return {
    id: "package-one", topic: topic(), formats: ["gbp"], createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(), status: "draft", sources: [], image: null,
    blog: null, instagram: null, reel: null,
    gbp: { text: "Daily cleaning around dental implants supports oral hygiene. Your dentist can explain suitable tools and check your gums during a visit in Mangalagiri. Contact Tanvi Dental Care to discuss an appointment.", targetUrl: "/treatments/dental-implants", cta: "Contact Tanvi Dental Care to discuss an appointment." },
    imageBrief: { kind: "educational", description: "A clean stylised illustration of an implant and surrounding gum tissue on a calm cream background.", alt: "Illustration of a dental implant and surrounding gum tissue", doctor: null },
    safety: { status: "PENDING", checks: [], checkedAt: null, wordCounts: {}, aiReview: { medical: true, claims: true, seo: true, duplication: true, tone: true, issues: [] } },
    ...overrides,
  };
}
function blogFixture(): NonNullable<ContentPackage["blog"]> {
  return {
    title: "Planning implant cleaning in Mangalagiri", slug: "planning-implant-cleaning-mangalagiri", excerpt: "Questions to discuss about cleaning around dental implants.", primaryTopic: "daily implant cleaning", tags: ["Dental implants"], treatmentSlug: "dental-implants", seoTitle: "Implant cleaning questions in Mangalagiri", metaDescription: "Explore practical questions to discuss with your dentist about cleaning around dental implants in Mangalagiri.", cta: "Contact the clinic to discuss a dental visit.",
    body: "## Understanding daily care\nCleaning routines depend on the restoration and your individual oral health. A dentist can explain the areas to focus on.\n\n## Choosing suitable tools\nAsk which cleaning tools are appropriate for your situation. Learn about [dental implants](/treatments/dental-implants) before your consultation.\n\n## Discussing your concerns\nTell your dentist about any discomfort or difficulty cleaning. Explore the [clinic team](/doctors) if you are planning a visit in Mangalagiri.\n\n## Planning a check\nAn examination helps your dentist understand your needs. Contact the clinic to discuss a dental visit.",
  };
}
function publishedBlog(slug: string, at: string = NOW.toISOString()): BlogPost {
  return { slug, title: slug.replace(/-/g, " "), excerpt: "An existing educational topic.", body: "Educational text.", status: "published", publishedAt: at, category: "Patient education", readTime: "3 min", metaDescription: "An existing article.", author: "Tanvi Dental Care", tags: [] };
}

test("daily questions sanitize and reject private patient information before AI", () => {
  assert.deepEqual(validateDailyAnswers({ objective: "auto", treatment: "auto", special: "  Festival update  " }), { objective: "auto", treatment: "auto", special: "Festival update" });
  for (const special of ["patient name: Asha, tooth pain", "Call +91 98765 43210", "records at person@example.in", "my patient aged 46 needs extraction", "Aadhaar 1234 5678 9012"]) {
    assert.throws(() => validateDailyAnswers({ objective: "auto", treatment: "auto", special }));
  }
  assert.ok(findPrivateInputIssues("Tooth pain education").length === 0);
  assert.throws(() => validateDailyAnswers({ objective: "auto", treatment: "auto", special: "a".repeat(501) }));
});

test("exactly three distinct truthful ideas; unsupported trends and duplicate ideas rejected", () => {
  const ideas = [topic(), topic({ id: "two", title: "Questions about wisdom tooth assessment", primaryKeyword: "wisdom tooth assessment", treatmentSlug: "wisdom-tooth-management", angle: "Understanding an examination", targetPage: "/treatments/wisdom-tooth-management" }), topic({ id: "three", title: "Planning professional teeth cleaning", primaryKeyword: "scaling appointment planning", treatmentSlug: "teeth-cleaning-and-scaling", angle: "Getting ready for a scaling visit", targetPage: "/treatments/teeth-cleaning-and-scaling" })];
  assert.equal(validateTopics(ideas, []).length, 3);
  assert.throws(() => validateTopics(ideas.slice(0, 2), []), /exactly three/);
  assert.throws(() => validateTopics([ideas[0], ideas[0], ideas[2]], []));
  assert.throws(() => validateTopics([topic({ evidence: { type: "GSC_SIGNAL", reason: "The model thinks this is popular." } }), ideas[1], ideas[2]], []), /not connected/);
  assert.throws(() => validateTopics([topic({ rationale: "Trending keyword with high SEO opportunity" }), ideas[1], ideas[2]], []), /measured search demand/);
});

test("duplicate detection weighs title, keyword, intent, treatment and angle", () => {
  assert.equal(checkDuplicates(topic(), [topic()]).status, "DUPLICATE");
  assert.equal(checkDuplicates(topic({ title: "Choosing a toothbrush after an implant", primaryKeyword: "implant toothbrush", angle: "Tool selection" }), [topic()]).status, "RELATED");
  assert.equal(checkDuplicates(topic(), [topic({ title: "Planning a wisdom tooth examination", primaryKeyword: "wisdom tooth", treatmentSlug: "wisdom-tooth-management", angle: "Assessment planning", intent: "Understanding examination" })]).status, "NEW");
  const similar = { ...topic(), blogRecommended: true, recommendedFormats: ["blog", "gbp"] as const, duplicate: { status: "TOO_SIMILAR" as const, score: 0.75, reason: "Overlaps existing article" } };
  const result = contentWorthiness({ ...similar, recommendedFormats: [...similar.recommendedFormats] });
  assert.equal(result.blogRecommended, false);
  assert.deepEqual(result.recommendedFormats, ["gbp"]);
});

test("word counting measures visible text rather than URLs or markdown syntax", () => {
  assert.equal(countWords("## Dental care\n[Visit our team](https://www.tanvidental.in/doctors) today."), 6);
  assert.equal(countWords("Comfort-focused care — for Mangalagiri."), 4);
});

test("local check success stays pending until a separate AI reviewer passes", () => {
  const pkg = packageFixture();
  const ready = validatePackage(pkg, [], [], NOW);
  assert.equal(ready.status, "READY_FOR_HUMAN_REVIEW", JSON.stringify(ready));
  const pending = validatePackage({ ...pkg, safety: { ...pkg.safety, aiReview: null } }, [], [], NOW);
  assert.equal(pending.status, "PENDING");
  const failed = validatePackage({ ...pkg, safety: { ...pkg.safety, aiReview: { ...pkg.safety.aiReview!, medical: false } } }, [], [], NOW);
  assert.equal(failed.status, "NEEDS_REVIEW");
});

test("guarantees, superiority, personal diagnoses and foreign advice cannot pass", () => {
  for (const text of ["100% guaranteed", "completely painless", "best dentist", "permanent cure", "no risks", "guaranteed success", "before and after", "95% success", "five star dental care"]) assert.ok(findClaimIssues(text).length, text);
  for (const text of ["You definitely have an infection.", "Use antibiotics to treat this.", "Your Medicare plan covers this care.", "Before it is too late, act now."]) {
    const pkg = packageFixture();
    pkg.gbp!.text += ` ${text}`;
    assert.equal(validatePackage(pkg, [], [], NOW).status, "NEEDS_REVIEW", text);
  }
});

test("blog hard limit, one H1, useful sections, single CTA and internal links are enforced", () => {
  const pkg = packageFixture({ formats: ["blog"], gbp: null, blog: blogFixture(), topic: topic({ blogRecommended: true, recommendedFormats: ["blog"] }) });
  assert.equal(validatePackage(pkg, [], [], NOW).status, "READY_FOR_HUMAN_REVIEW");
  const long = structuredClone(pkg); long.blog!.body += `\n${"education ".repeat(1001)}`;
  assert.ok(validatePackage(long, [], [], NOW).checks.find((check) => check.key === "words")?.messages.some((message) => message.includes("at most 1000")));
  for (const body of [`# Extra H1\n${pkg.blog!.body}`, pkg.blog!.body.replace("## Choosing suitable tools", "Choosing suitable tools"), `${pkg.blog!.body}\n${pkg.blog!.cta}`, pkg.blog!.body.replace("[clinic team](/doctors)", "clinic team")]) {
    assert.equal(validatePackage({ ...pkg, blog: { ...pkg.blog!, body } }, [], [], NOW).status, "NEEDS_REVIEW");
  }
  assert.equal(CONTENT_POLICY.blog.maxWords, 1000);
});

test("a new blog cannot evade duplicate detection by selecting an existing slug", () => {
  const blog = blogFixture();
  const existing = { ...publishedBlog(blog.slug), title: topic().title, primaryTopic: topic().primaryKeyword, treatmentSlug: "dental-implants" };
  const pkg = packageFixture({ blog, gbp: null, formats: ["blog"], topic: topic({ blogRecommended: true, recommendedFormats: ["blog"] }) });
  assert.equal(validatePackage(pkg, [], [existing], NOW).checks.find((check) => check.key === "duplicate")?.status, "NEEDS_REVIEW");
});

test("exact allowlists reject invented links, lookalike hosts and unverified sources", () => {
  assert.equal(isApprovedInternalUrl("https://www.tanvidental.in/doctors"), true);
  for (const url of ["https://www.tanvidental.in.evil.example/doctors", "//evil.example/path", "javascript:alert(1)", "https://www.tanvidental.in/doctors?return=https://evil.example", "/unpublished-article"]) assert.equal(isApprovedInternalUrl(url), false, url);
  assert.equal(isApprovedSourceUrl("https://www.ida.org.in/made-up"), false);
  const source = EXTERNAL_SOURCES[0];
  const pkg = packageFixture();
  pkg.gbp!.text += ` [Source](${source.url})`;
  assert.equal(validatePackage(pkg, [], [], NOW).checks.find((check) => check.key === "links")?.status, "NEEDS_REVIEW");
  pkg.sources = [{ id: source.id, title: source.title, url: source.url, retrievedAt: NOW.toISOString(), excerpt: "A source excerpt actually retrieved by the server.", status: "VERIFIED" }];
  assert.equal(validatePackage(pkg, [], [], NOW).checks.find((check) => check.key === "links")?.status, "PASS");
});

test("source copying and invented doctor credentials need review", () => {
  const pkg = packageFixture();
  const source = EXTERNAL_SOURCES[0];
  pkg.sources = [{ id: source.id, title: source.title, url: source.url, retrievedAt: NOW.toISOString(), excerpt: pkg.gbp!.text, status: "VERIFIED" }];
  assert.ok(validatePackage(pkg, [], [], NOW).checks.find((check) => check.key === "claims")?.messages.some((message) => message.includes("original language")));
  pkg.sources = [];
  pkg.gbp!.text += " Dr. Invented Person offers care.";
  assert.equal(validatePackage(pkg, [], [], NOW).checks.find((check) => check.key === "claims")?.status, "NEEDS_REVIEW");
  assert.ok(findClaimIssues("Dr. Naga Swathi Pokala has 25 years of clinical experience.").length);
  assert.ok(findClaimIssues("Clinically reviewed by Dr. Naga Swathi Pokala").length);
});

test("GBP, Instagram, carousel and reel platform limits fail closed", () => {
  const tooLong = packageFixture(); tooLong.gbp!.text += ` ${"extra ".repeat(15)}`;
  assert.equal(validatePackage(tooLong, [], [], NOW).checks.find((check) => check.key === "words")?.status, "NEEDS_REVIEW");
  const caption = `Mangalagiri ${"oral health education ".repeat(20)}Contact the clinic.`;
  const instagram = packageFixture({ formats: ["instagram_static"], gbp: null, instagram: { format: "static", caption, hashtags: ["#Mangalagiri"], slides: [], cta: "Contact the clinic." } });
  assert.equal(validatePackage(instagram, [], [], NOW).checks.find((check) => check.key === "words")?.status, "PASS");
  instagram.instagram!.hashtags = ["#A", "#B", "#C", "#D", "#E", "#F"];
  assert.equal(validatePackage(instagram, [], [], NOW).checks.find((check) => check.key === "words")?.status, "NEEDS_REVIEW");
  instagram.instagram = { ...instagram.instagram!, format: "carousel", hashtags: [], slides: Array.from({ length: 6 }, () => ({ title: "A question", text: "A useful explanation." })) }; instagram.formats = ["instagram_carousel"];
  assert.equal(validatePackage(instagram, [], [], NOW).checks.find((check) => check.key === "words")?.status, "NEEDS_REVIEW");
  const reel = packageFixture({ formats: ["reel"], gbp: null, reel: { hook: "A cleaning question", scenes: [{ visual: "Tooth illustration", voiceover: "education ".repeat(100) }], caption: "Questions about oral health.", thumbnailBrief: "Tooth illustration", cta: "Contact the clinic.", durationSeconds: 30 } });
  assert.equal(validatePackage(reel, [], [], NOW).checks.find((check) => check.key === "words")?.status, "NEEDS_REVIEW");
});

test("educational images cannot impersonate doctors; real photo selection is required", () => {
  assert.throws(() => validateContentDraft({ ...packageFixture(), imageBrief: { kind: "doctor", description: "Portrait", alt: "Doctor", doctor: null } }));
  const pkg = packageFixture(); pkg.imageBrief.description = "A photorealistic dentist presenting a new smile";
  assert.equal(validatePackage(pkg, [], [], NOW).checks.find((check) => check.key === "medical")?.status, "NEEDS_REVIEW");
});

test("standalone reel CTAs and renamed FAQ sections cannot bypass safety checks", () => {
  const reel = packageFixture({ formats: ["reel"], gbp: null, reel: { hook: "Cleaning questions", scenes: [{ visual: "Tooth illustration", voiceover: "A dentist can explain suitable tools for cleaning your teeth and help you plan your oral hygiene routine." }], caption: "Oral health education", thumbnailBrief: "Tooth illustration", cta: "Contact us for guaranteed results at https://unapproved.example/", durationSeconds: 20 } });
  const review = validatePackage(reel, [], [], NOW);
  assert.equal(review.checks.find((check) => check.key === "claims")?.status, "NEEDS_REVIEW");
  assert.equal(review.checks.find((check) => check.key === "links")?.status, "NEEDS_REVIEW");
  const pkg = packageFixture({ formats: ["blog"], gbp: null, blog: blogFixture(), topic: topic({ blogRecommended: true, recommendedFormats: ["blog"] }) });
  pkg.blog!.body += "\n\n## Common questions\n### Is cleaning suitable?\nAsk your dentist.\n### Which tool helps?\nIt depends on your needs.\n### How is care planned?\nDiscuss your routine.\n### When should I ask?\nAt your visit.";
  assert.ok(validatePackage(pkg, [], [], NOW).checks.find((check) => check.key === "seo")?.messages.some((message) => /three.*questions/i.test(message)));
});

test("weekly and monthly limits use IST and drafts reserve slots without claiming publication", () => {
  assert.deepEqual(contentPeriodKeys(new Date("2026-09-20T18:29:59Z")), { week: "2026-09-14", month: "2026-09" });
  assert.deepEqual(contentPeriodKeys(new Date("2026-09-20T18:30:00Z")), { week: "2026-09-21", month: "2026-09" });
  const history = Array.from({ length: 5 }, (_, index) => packageFixture({ id: `p-${index}` }));
  assert.ok(!availableFormats(history, [], NOW).includes("gbp"));
  assert.ok(availableFormats(history, [], NOW, "p-0").includes("gbp"));
  const weeklyBlogs = [publishedBlog("one"), publishedBlog("two")];
  assert.ok(!availableFormats([], weeklyBlogs, NOW).includes("blog"));
  const monthlyBlogs = Array.from({ length: 6 }, (_, index) => publishedBlog(`old-${index}`, "2026-09-01T10:00:00Z"));
  assert.ok(!availableFormats([], monthlyBlogs, NOW).includes("blog"));
  assert.ok(availableFormats([], monthlyBlogs, new Date("2026-10-01T10:00:00Z")).includes("blog"));
});

test("a handed-off draft and its published blog count once; a new package consumes a new slot", () => {
  const pkg = packageFixture({ formats: ["blog"], blog: blogFixture(), gbp: null, status: "handed_off", blogSlug: "published-handoff" });
  const posts = [publishedBlog("published-handoff")];
  assert.equal(getFrequencyUsage([pkg], posts, NOW).blog.weekly, 1);
  assert.equal(getFrequencyUsage([pkg], posts, NOW, pkg.id).blog.weekly, 0);
  const duplicateHistory = [pkg, structuredClone(pkg)];
  assert.equal(getFrequencyUsage(duplicateHistory, posts, NOW).blog.weekly, 1);
  assert.equal(getFrequencyUsage([pkg], [...posts, publishedBlog("another")], NOW).blog.weekly, 2);
  const unhanded = packageFixture({ formats: ["blog"], blog: blogFixture(), gbp: null });
  assert.equal(getFrequencyUsage([unhanded, { ...structuredClone(unhanded), id: "another-draft" }], [], NOW).blog.weekly, 2);
});
