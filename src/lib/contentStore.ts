import { randomUUID } from "node:crypto";
import type { BlogPost } from "@/content/blog";
import type { ContentPackage, HistoryStore } from "./contentTypes";
import { GitHubContentError, readRepoJson, writeRepoFile, repositoryHead, commitRepoFiles } from "./githubContent";

export const HISTORY_PATH = "src/content/content-os-data.json";
export const BLOG_PATH = "src/content/blog-data.json";
export const USAGE_PATH = "src/content/content-os-usage.json";
function serializeHistory(history: ContentPackage[]) {
  const content = JSON.stringify({ version: 1, packages: history }, null, 2) + "\n";
  if (Buffer.byteLength(content, "utf8") > 900_000) throw new ContentError("Content history has reached its V1 size limit. Ask an administrator to archive it before saving more drafts.", 409);
  return content;
}
export class ContentError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}
export function isConflict(error: unknown) { return error instanceof GitHubContentError && [409, 422].includes(error.status); }

export async function readContentContext(ref?: string) {
  const [history, blogs] = await Promise.all([readRepoJson<HistoryStore>(HISTORY_PATH, ref), readRepoJson<BlogPost[]>(BLOG_PATH, ref)]);
  if (history.value.version !== 1 || !Array.isArray(history.value.packages) || !Array.isArray(blogs.value)) throw new ContentError("Content storage needs repair before continuing.", 503);
  return { history: history.value.packages, blogs: blogs.value, historySha: history.sha };
}

type UsageStore = { version: 1; reservations: { id: string; kind: "text" | "image"; at: string }[] };
// Reservation happens before the paid call. SHA compare-and-swap prevents two
// serverless instances spending the same remaining quota. Failure stays charged.
export async function reserveAiCall(kind: "text" | "image") {
  const { CONTENT_POLICY } = await import("@/config/content-policy");
  for (let attempt = 0; attempt < 3; attempt++) {
    const { value, sha } = await readRepoJson<UsageStore>(USAGE_PATH);
    if (value.version !== 1 || !Array.isArray(value.reservations)) throw new ContentError("Usage protection is unavailable. No AI call was made.", 503);
    const now = Date.now();
    const recent = value.reservations.filter(item => Number.isFinite(Date.parse(item.at)) && Date.parse(item.at) > now - 86_400_000);
    const daily = recent.filter(item => item.kind === kind);
    const hourly = daily.filter(item => Date.parse(item.at) > now - 3_600_000);
    const dayLimit = kind === "text" ? CONTENT_POLICY.ai.textPerDay : CONTENT_POLICY.ai.imagesPerDay;
    const hourLimit = kind === "text" ? CONTENT_POLICY.ai.textPerHour : CONTENT_POLICY.ai.imagesPerHour;
    if (daily.length >= dayLimit || hourly.length >= hourLimit) throw new ContentError("The clinic's AI usage limit has been reached. Try again after the usage window resets.", 429);
    recent.push({ id: randomUUID(), kind, at: new Date(now).toISOString() });
    try {
      await writeRepoFile({ path: USAGE_PATH, sha, content: JSON.stringify({ version: 1, reservations: recent }, null, 2) + "\n", message: "Reserve Content OS AI usage" });
      return;
    } catch (error) { if (!isConflict(error) || attempt === 2) throw error; }
  }
}

function checkRevision(pkg: ContentPackage, existing?: ContentPackage) {
  if (existing && (!pkg.revision || existing.revision !== pkg.revision)) throw new ContentError("This draft changed in another session. Reopen it from history before saving.", 409);
  if (!existing && pkg.revision) throw new ContentError("This draft is no longer in history. Refresh before saving.", 409);
}
export async function saveContentPackage(pkg: ContentPackage, validate: (pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[]) => void) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const context = await readContentContext();
    const existing = context.history.find(item => item.id === pkg.id);
    checkRevision(pkg, existing);
    if (existing?.blogSlug) throw new ContentError("This package already has a Blog Manager draft. Continue editing in Blog Manager.", 409);
    validate(pkg, context.history, context.blogs);
    if (!existing && context.history.length >= 250) throw new ContentError("History has reached its V1 capacity. Archive the history with an administrator before adding more drafts.", 409);
    const saved = { ...pkg, updatedAt: new Date().toISOString(), revision: randomUUID() };
    const history = [saved, ...context.history.filter(item => item.id !== saved.id)];
    try {
      await writeRepoFile({ path: HISTORY_PATH, sha: context.historySha, content: serializeHistory(history), message: "Save Content OS draft" });
      return { package: saved, history };
    } catch (error) { if (!isConflict(error) || attempt === 2) throw error; }
  }
  throw new ContentError("Unable to save. Please retry.", 409);
}

export async function handoffContentPackage(pkg: ContentPackage, makeBlog: (pkg: ContentPackage, history: ContentPackage[], blogs: BlogPost[]) => BlogPost) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const head = await repositoryHead();
    const context = await readContentContext(head.sha);
    const existing = context.history.find(item => item.id === pkg.id);
    checkRevision(pkg, existing);
    if (existing?.blogSlug) throw new ContentError("A blog draft already exists for this package. Open it in Blog Manager.", 409);
    if (!existing && context.history.length >= 250) throw new ContentError("Content history is full.", 409);
    const attemptPackage = structuredClone(pkg);
    const blog = makeBlog(attemptPackage, context.history, context.blogs);
    if (context.blogs.some(item => item.slug === blog.slug)) throw new ContentError("That blog URL already exists. Change the draft slug and validate again.", 409);
    const saved: ContentPackage = { ...attemptPackage, blogSlug: blog.slug, status: "handed_off", updatedAt: new Date().toISOString(), revision: randomUUID() };
    const history = [saved, ...context.history.filter(item => item.id !== pkg.id)];
    try {
      await commitRepoFiles(head, [
        { path: HISTORY_PATH, content: serializeHistory(history) },
        { path: BLOG_PATH, content: JSON.stringify([blog, ...context.blogs], null, 2) + "\n" },
      ], "Create Content OS blog draft for human review");
      return { package: saved, history, blogUrl: `/admin/blog?draft=${encodeURIComponent(blog.slug)}` };
    } catch (error) { if (!isConflict(error) || attempt === 2) throw error; }
  }
  throw new ContentError("Another editor changed content. Please retry the handoff.", 409);
}
