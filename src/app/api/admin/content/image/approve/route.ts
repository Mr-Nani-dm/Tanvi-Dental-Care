import type { NextRequest } from "next/server";
import { requireContentAuth, readContentBody, approveContentImage, contentJson, contentErrorResponse } from "@/lib/contentServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    requireContentAuth(request);
    return contentJson(await approveContentImage(await readContentBody(request, 4_150_000)));
  } catch (error) { return contentErrorResponse(error); }
}
