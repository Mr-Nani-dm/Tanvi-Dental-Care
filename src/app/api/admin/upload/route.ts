import { NextRequest, NextResponse } from "next/server";
import { BLOG_ADMIN_COOKIE, adminConfigReady, verifyAdminSession } from "@/lib/adminAuth";
import { slugify } from "@/lib/blogSeo";
import { writeRepoBinary } from "@/lib/githubContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function POST(request: NextRequest) {
  if (!adminConfigReady()) return NextResponse.json({ error: "Blog admin is not configured." }, { status: 503 });
  if (!verifyAdminSession(request.cookies.get(BLOG_ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const label = String(form.get("name") || "blog-image");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
    const extension = TYPES[file.type];
    if (!extension) return NextResponse.json({ error: "Use JPG, PNG or WebP." }, { status: 415 });
    if (file.size > 3000000) return NextResponse.json({ error: "Image must be below 3 MB." }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const filename = `${slugify(label) || "blog-image"}-${Date.now()}.${extension}`;
    const repoPath = `public/images/blog/${filename}`;
    const result = await writeRepoBinary({ path: repoPath, bytes, message: `Add blog image ${filename}` });
    return NextResponse.json({ ok: true, url: `/images/blog/${filename}`, commitSha: result.commit?.sha });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image." }, { status: 500 });
  }
}
