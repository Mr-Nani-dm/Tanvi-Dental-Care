import { NextRequest, NextResponse } from "next/server";
import { adminConfigReady, BLOG_ADMIN_COOKIE, createAdminSession, verifyAdminPassword } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!adminConfigReady()) {
    return NextResponse.json({ error: "Blog admin is not configured yet.", setupRequired: true }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { password?: string } | null;
  if (!body?.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(BLOG_ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
