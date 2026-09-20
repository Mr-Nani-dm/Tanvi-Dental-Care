import { NextRequest, NextResponse } from "next/server";
import { BLOG_ADMIN_COOKIE, verifySameOrigin } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(BLOG_ADMIN_COOKIE);
  return response;
}
