import type { NextRequest } from "next/server";
import { contentAction, planTopics } from "@/lib/contentServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export function POST(request: NextRequest) { return contentAction(request, planTopics); }
