import { createHmac, timingSafeEqual } from "node:crypto";

export const BLOG_ADMIN_COOKIE = "tanvi_blog_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  return process.env.BLOG_ADMIN_SESSION_SECRET || "";
}

function sign(payload: string) {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function adminConfigReady() {
  return Boolean(
    process.env.BLOG_ADMIN_PASSWORD &&
    process.env.BLOG_ADMIN_SESSION_SECRET &&
    process.env.GITHUB_CONTENT_TOKEN,
  );
}

export function createAdminSession() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function verifyAdminSession(value?: string | null) {
  if (!value || !secret()) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;
  const timestamp = Number(issuedAt);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > SESSION_TTL_MS || timestamp > Date.now() + 60_000) return false;
  const expected = sign(issuedAt);
  return Boolean(expected && safeEqual(signature, expected));
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.BLOG_ADMIN_PASSWORD || "";
  if (!expected) return false;
  const suppliedDigest = createHmac("sha256", "tanvi-blog-login").update(password).digest("hex");
  const expectedDigest = createHmac("sha256", "tanvi-blog-login").update(expected).digest("hex");
  return safeEqual(suppliedDigest, expectedDigest);
}
