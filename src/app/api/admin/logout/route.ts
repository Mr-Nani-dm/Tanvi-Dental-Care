import { NextResponse } from "next/server";
import { BLOG_ADMIN_COOKIE } from "@/lib/adminAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(BLOG_ADMIN_COOKIE);
  return response;
}
