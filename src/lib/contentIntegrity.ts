import { createHmac, timingSafeEqual } from "node:crypto";
import type { ContentPackage, TopicIdea } from "./contentTypes";
import { contentBranch } from "./githubContent";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
function mac(kind: string, payload: unknown, issued: string) {
  const key = process.env.BLOG_ADMIN_SESSION_SECRET;
  if (!key) throw new Error("Admin session configuration is required.");
  return createHmac("sha256", key).update(`${contentBranch()}:${kind}:${issued}:${canonical(payload)}`).digest("hex");
}
function sign(kind: string, payload: unknown) {
  const issued = String(Date.now());
  return `${issued}.${mac(kind, payload, issued)}`;
}
function verify(kind: string, payload: unknown, token: unknown, ttl: number) {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^\d{13}$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1])) return false;
  const age = Date.now() - Number(parts[0]);
  if (age < -60_000 || age > ttl) return false;
  const expected = mac(kind, payload, parts[0]);
  return timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected));
}
function topicPayload(topic: TopicIdea) { const { token: _token, ...rest } = topic; return rest; }
function provenance(pkg: ContentPackage) {
  return { id: pkg.id, createdAt: pkg.createdAt, topic: topicPayload(pkg.topic), formats: pkg.formats, sources: pkg.sources, image: pkg.image };
}
function reviewPayload(pkg: ContentPackage) {
  return { ...provenance(pkg), blog: pkg.blog, gbp: pkg.gbp, instagram: pkg.instagram, reel: pkg.reel, imageBrief: pkg.imageBrief, safety: pkg.safety };
}
export function signTopic(topic: TopicIdea): TopicIdea { return { ...topic, token: sign("topic", topicPayload(topic)) }; }
export function verifyTopic(topic: TopicIdea) { return verify("topic", topicPayload(topic), topic.token, 4 * 60 * 60_000); }
export function signPackage(pkg: ContentPackage, reviewed = false): ContentPackage {
  return { ...pkg, proof: sign("provenance", provenance(pkg)), reviewToken: reviewed ? sign("review", reviewPayload(pkg)) : undefined };
}
export function verifyPackageProvenance(pkg: ContentPackage) { return verify("provenance", provenance(pkg), pkg.proof, 12 * 60 * 60_000); }
export function verifyPackageReview(pkg: ContentPackage) { return verify("review", reviewPayload(pkg), pkg.reviewToken, 2 * 60 * 60_000); }
