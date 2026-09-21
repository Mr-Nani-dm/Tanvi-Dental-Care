import type { AiReview, ContentDraft, TopicIdea } from "@/lib/contentTypes";
import { CONTENT_POLICY } from "@/config/content-policy";

type Schema = {
  type?: string | string[];
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Schema;
  anyOf?: Schema[];
  enum?: readonly (string | number | boolean | null)[];
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
};
const text = (maxLength = 800): Schema => ({ type: "string", maxLength });
const object = (properties: Record<string, Schema>): Schema => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const nullable = (schema: Schema): Schema => ({ anyOf: [schema, { type: "null" }] });
const array = (items: Schema, maxItems: number, minItems = 0): Schema => ({ type: "array", items, minItems, maxItems });
const formats: Schema = { type: "string", enum: CONTENT_POLICY.formats };

export const TOPICS_SCHEMA = object({
  topics: array(object({
    title: text(180), primaryKeyword: text(160), intent: text(300), treatmentSlug: text(100), angle: text(400), rationale: text(700), psychology: text(160), targetPage: text(300),
    evidence: object({ type: { type: "string", enum: ["CONTENT_GAP", "MANUAL_IDEA", "SEASONAL_OPPORTUNITY"] }, reason: text(700) }),
    blogRecommended: { type: "boolean" }, recommendedFormats: array(formats, 5, 1),
  }), CONTENT_POLICY.topicCount, CONTENT_POLICY.topicCount),
});

export const DRAFT_SCHEMA = object({
  blog: nullable(object({
    title: text(180), slug: text(140), excerpt: text(500), body: text(18_000), seoTitle: text(120), metaDescription: text(300), primaryTopic: text(160),
    tags: array(text(50), 8), treatmentSlug: text(100), cta: text(200),
  })),
  gbp: nullable(object({ text: text(600), targetUrl: text(300), cta: text(200) })),
  instagram: nullable(object({ format: { type: "string", enum: ["static", "carousel"] }, caption: text(1600), hashtags: array(text(50), CONTENT_POLICY.instagram.maxHashtags), slides: array(object({ title: text(160), text: text(450) }), CONTENT_POLICY.instagram.maxSlides), cta: text(200) })),
  reel: nullable(object({ hook: text(180), scenes: array(object({ visual: text(400), voiceover: text(600) }), CONTENT_POLICY.reel.maxScenes, 1), caption: text(1200), thumbnailBrief: text(600), cta: text(200), durationSeconds: { type: "integer", minimum: CONTENT_POLICY.reel.minSeconds, maximum: CONTENT_POLICY.reel.maxSeconds } })),
  imageBrief: object({ kind: { type: "string", enum: ["educational", "doctor"] }, description: text(1200), alt: text(250), doctor: { type: ["string", "null"], enum: ["naga-swathi", "prathap-naidu", null] } }),
});

export const REVIEW_SCHEMA = object({
  medical: { type: "boolean" }, claims: { type: "boolean" }, seo: { type: "boolean" }, duplication: { type: "boolean" }, tone: { type: "boolean" }, issues: array(object({ category: { type: "string", enum: ["medical", "claims", "seo", "duplication", "tone"] }, message: text(600) }), 20),
  claimChecks: array(object({ claim: text(600), sourceUrl: text(1000), evidenceQuote: text(1000), supported: { type: "boolean" } }), 80),
});

/** Model output is untrusted even when the API claims strict structured output. */
function matches(value: unknown, schema: Schema): boolean {
  if (schema.anyOf) return schema.anyOf.some((option) => matches(value, option));
  if (schema.enum && !schema.enum.includes(value as string | number | boolean | null)) return false;
  if (Array.isArray(schema.type)) return schema.type.some((type) => matches(value, { ...schema, type }));
  if (schema.type === "null") return value === null;
  if (schema.type === "string") return typeof value === "string" && (schema.minLength === undefined || value.length >= schema.minLength) && (schema.maxLength === undefined || value.length <= schema.maxLength);
  if (schema.type === "boolean") return typeof value === "boolean";
  if (schema.type === "integer" || schema.type === "number") return typeof value === "number" && Number.isFinite(value) && (schema.type !== "integer" || Number.isInteger(value)) && (schema.minimum === undefined || value >= schema.minimum) && (schema.maximum === undefined || value <= schema.maximum);
  if (schema.type === "array") return Array.isArray(value) && value.length >= (schema.minItems || 0) && value.length <= (schema.maxItems ?? Infinity) && value.every((entry) => matches(entry, schema.items!));
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    const properties = schema.properties || {};
    return (schema.required || []).every((key) => Object.prototype.hasOwnProperty.call(record, key)) && Object.keys(record).every((key) => Object.prototype.hasOwnProperty.call(properties, key) && matches(record[key], properties[key]));
  }
  return false;
}

export function parseTopicOutput(value: unknown): Omit<TopicIdea, "id" | "duplicate" | "token">[] {
  if (!matches(value, TOPICS_SCHEMA)) throw new Error("AI returned an invalid topic structure. Try again.");
  return (value as { topics: Omit<TopicIdea, "id" | "duplicate" | "token">[] }).topics;
}
export function parseDraftOutput(value: unknown): ContentDraft {
  if (!matches(value, DRAFT_SCHEMA)) throw new Error("AI returned an invalid draft structure. Try again.");
  return value as ContentDraft;
}
export function parseReviewOutput(value: unknown): AiReview {
  if (!matches(value, REVIEW_SCHEMA)) throw new Error("AI returned an invalid review structure. Try validation again.");
  const raw = value as Omit<AiReview, "issues"> & { issues: NonNullable<AiReview["typedIssues"]> };
  const review: AiReview = { ...raw, typedIssues: raw.issues, issues: raw.issues.map(issue => issue.message) };
  for (const issue of raw.issues) review[issue.category] = false;
  return review;
}
