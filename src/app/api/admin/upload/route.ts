import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { BLOG_ADMIN_COOKIE, adminConfigReady, verifyAdminSession, verifySameOrigin } from "@/lib/adminAuth";
import { slugify } from "@/lib/blogSeo";
import { writeRepoBinary } from "@/lib/githubContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function hasExpectedSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: NextRequest) {
  if (!adminConfigReady()) return NextResponse.json({ error: "Blog admin is not configured." }, { status: 503 });
  if (!verifyAdminSession(request.cookies.get(BLOG_ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!verifySameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const incomingLabel = form.get("name");
    const label = typeof incomingLabel === "string" ? incomingLabel.slice(0, 120) : "blog-image";
    if (form.get("publicStorageConfirmed") !== "true") {
      return NextResponse.json({ error: "Confirm that this file may be stored in the public repository and contains no patient or confidential information." }, { status: 422 });
    }
    if (form.get("rightsConfirmed") !== "true") {
      return NextResponse.json({ error: "Confirm that the clinic owns or is authorised to publish this image." }, { status: 422 });
    }
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
    const extension = TYPES[file.type];
    if (!extension) return NextResponse.json({ error: "Use JPG, PNG or WebP." }, { status: 415 });
    if (!file.size) return NextResponse.json({ error: "The image file is empty." }, { status: 400 });
    if (file.size > 3000000) return NextResponse.json({ error: "Image must be below 3 MB." }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedSignature(bytes, file.type)) return NextResponse.json({ error: "The file content does not match its image type." }, { status: 415 });
    const filename = `${slugify(label) || "blog-image"}-${Date.now()}-${randomBytes(5).toString("hex")}.${extension}`;
    const repoPath = `public/images/blog/${filename}`;
    const result = await writeRepoBinary({ path: repoPath, bytes, message: `Add blog image ${filename}` });
    return NextResponse.json({ ok: true, url: `/images/blog/${filename}`, commitSha: result.commit?.sha });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image." }, { status: 500 });
  }
}
