import { NextRequest, NextResponse } from "next/server";
import { adminConfigReady, BLOG_ADMIN_COOKIE, createAdminSession, verifyAdminPassword } from "@/lib/adminAuth";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 8;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function currentAttempt(key: string) {
  const now = Date.now();
  const existing = failedAttempts.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    failedAttempts.set(key, fresh);
    return fresh;
  }
  return existing;
}

export async function POST(request: NextRequest) {
  if (!adminConfigReady()) {
    return NextResponse.json({ error: "Blog admin is not configured yet.", setupRequired: true }, { status: 503 });
  }

  const key = clientKey(request);
  const attempt = currentAttempt(key);
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((attempt.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null) as { password?: string } | null;
  if (!body?.password || !verifyAdminPassword(body.password)) {
    attempt.count += 1;
    failedAttempts.set(key, attempt);
    return NextResponse.json({ error: "Incorrect password." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  failedAttempts.delete(key);
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(BLOG_ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
