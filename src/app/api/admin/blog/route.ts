import { NextRequest, NextResponse } from "next/server";
import type { BlogPost, BlogStatus, SeoExceptionRule, SeoValidationException } from "@/content/blog";
import { treatments } from "@/config/clinic";
import { BLOG_ADMIN_COOKIE, adminConfigReady, verifyAdminSession } from "@/lib/adminAuth";
import { publishBlockers } from "@/lib/blogPublishGate";
import { estimateReadTime, slugify } from "@/lib/blogSeo";
import { readRepoJson, writeRepoFile } from "@/lib/githubContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_PATH = "src/content/blog-data.json";
const PRIVATE_HEADERS = { "Cache-Control": "no-store, max-age=0" };
const SEO_EXCEPTION_RULES = new Set<SeoExceptionRule>(["topic-title", "topic-intro"]);

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

function authorized(request: NextRequest) {
  return verifyAdminSession(request.cookies.get(BLOG_ADMIN_COOKIE)?.value);
}

function cleanText(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeSeoExceptions(value: unknown, today: string): SeoValidationException[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 20)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<SeoValidationException>;
      const phrase = cleanText(candidate.phrase, 100);
      const reason = cleanText(candidate.reason, 240);
      const rules = Array.isArray(candidate.rules)
        ? candidate.rules.filter((rule): rule is SeoExceptionRule => SEO_EXCEPTION_RULES.has(rule as SeoExceptionRule))
        : [];
      if (!phrase || !reason || !rules.length) return null;
      const incomingId = slugify(cleanText(candidate.id, 90));
      return {
        id: incomingId || `seo-exception-${index + 1}-${slugify(phrase).slice(0, 36)}`,
        phrase,
        rules: Array.from(new Set(rules)),
        reason,
        createdAt: /^\d{4}-\d{2}-\d{2}$/.test(cleanText(candidate.createdAt, 10)) ? cleanText(candidate.createdAt, 10) : today,
      } satisfies SeoValidationException;
    })
    .filter((item): item is SeoValidationException => Boolean(item));
}

function normalizePost(input: Partial<BlogPost>, action: "draft" | "publish", existing?: BlogPost): BlogPost {
  const title = cleanText(input.title, 140);
  const slug = slugify(cleanText(input.slug, 100) || title);
  const body = typeof input.body === "string" ? input.body.trim().slice(0, 60_000) : "";
  const excerpt = cleanText(input.excerpt, 360);
  const metaDescription = cleanText(input.metaDescription, 180) || excerpt;
  const treatmentSlug = cleanText(input.treatmentSlug, 100);
  const validTreatment = treatmentSlug && treatments.some((treatment) => treatment.slug === treatmentSlug) ? treatmentSlug : undefined;
  const status: BlogStatus = action === "publish" ? "published" : "draft";
  const today = new Date().toISOString().slice(0, 10);

  if (!title || !slug || !body || !excerpt || !metaDescription) {
    throw new Error("Title, slug, short description, SEO description and article content are required.");
  }

  return {
    slug,
    title,
    excerpt,
    category: cleanText(input.category, 60) || "Dental Health",
    status,
    publishedAt: status === "published" ? (existing?.publishedAt || cleanText(input.publishedAt, 10) || today) : existing?.publishedAt,
    updatedAt: today,
    readTime: estimateReadTime(body),
    treatmentSlug: validTreatment,
    featuredImage: cleanText(input.featuredImage, 300),
    imageAlt: cleanText(input.imageAlt, 180),
    seoTitle: cleanText(input.seoTitle, 80) || title,
    metaDescription,
    primaryTopic: cleanText(input.primaryTopic, 100),
    seoExceptions: normalizeSeoExceptions(input.seoExceptions, today),
    author: cleanText(input.author, 100) || "Tanvi Dental Care Editorial Team",
    reviewedBy: cleanText(input.reviewedBy, 100),
    reviewedAt: cleanText(input.reviewedAt, 10),
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => cleanText(tag, 50)).filter(Boolean).slice(0, 12) : [],
    body,
  };
}

export async function GET(request: NextRequest) {
  if (!adminConfigReady()) {
    return privateJson({ error: "Blog admin is not configured.", setupRequired: true }, 503);
  }
  if (!authorized(request)) return privateJson({ error: "Sign in required." }, 401);

  try {
    const { value } = await readRepoJson<BlogPost[]>(DATA_PATH);
    return privateJson({ posts: value.sort((a, b) => (b.updatedAt || b.publishedAt || "").localeCompare(a.updatedAt || a.publishedAt || "")) });
  } catch (error) {
    return privateJson({ error: error instanceof Error ? error.message : "Unable to load posts." }, 500);
  }
}

export async function POST(request: NextRequest) {
  if (!adminConfigReady()) {
    return privateJson({ error: "Blog admin is not configured.", setupRequired: true }, 503);
  }
  if (!authorized(request)) return privateJson({ error: "Sign in required." }, 401);

  try {
    const payload = await request.json() as { post?: Partial<BlogPost>; originalSlug?: string; action?: "draft" | "publish" };
    if (!payload.post || !payload.action) return privateJson({ error: "Invalid post payload." }, 400);

    const { value: posts, sha } = await readRepoJson<BlogPost[]>(DATA_PATH);
    const originalSlug = slugify(payload.originalSlug || payload.post.slug || "");
    const existingIndex = posts.findIndex((post) => post.slug === originalSlug);
    const existing = existingIndex >= 0 ? posts[existingIndex] : undefined;
    const normalized = normalizePost(payload.post, payload.action, existing);

    if (payload.action === "publish") {
      const blockers = publishBlockers(normalized);
      if (blockers.length) {
        return privateJson({ error: `Publishing blocked: ${blockers.join(" ")}`, blockers }, 422);
      }
    }

    const duplicate = posts.find((post, index) => post.slug === normalized.slug && index !== existingIndex);
    if (duplicate) return privateJson({ error: "Another blog post already uses this URL slug." }, 409);

    if (existingIndex >= 0) posts[existingIndex] = normalized;
    else posts.unshift(normalized);

    const result = await writeRepoFile({
      path: DATA_PATH,
      sha,
      content: `${JSON.stringify(posts, null, 2)}\n`,
      message: `${payload.action === "publish" ? "Publish" : "Save draft"}: ${normalized.title}`,
    });

    return privateJson({
      ok: true,
      post: normalized,
      commitSha: result.commit?.sha,
      deploymentExpected: true,
    });
  } catch (error) {
    return privateJson({ error: error instanceof Error ? error.message : "Unable to save blog post." }, 500);
  }
}
