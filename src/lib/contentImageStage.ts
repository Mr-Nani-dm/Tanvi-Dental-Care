import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { ContentPackage } from "./contentTypes";
import { contentBranch } from "./githubContent";
import { ContentError } from "./contentStore";

type Stage = { id: string; hash: string; review: string; packageId: string; branch: string; model: string; at: number };
const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
function signature(value: string) {
  const secret = process.env.BLOG_ADMIN_SESSION_SECRET;
  if (!secret) throw new ContentError("Admin configuration is required.", 503);
  return createHmac("sha256", secret).update(`content-image-stage:${value}`).digest("hex");
}
export function stageImage(bytes: Uint8Array, pkg: ContentPackage, model: string) {
  const stage: Stage = { id: randomUUID(), hash: hash(bytes), review: hash(pkg.reviewToken || ""), packageId: pkg.id, branch: contentBranch(), model, at: Date.now() };
  const payload = Buffer.from(JSON.stringify(stage)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function verifyStagedImage(token: unknown, encoded: unknown, pkg: ContentPackage) {
  if (typeof token !== "string" || token.length > 4000 || typeof encoded !== "string" || encoded.length > 4_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) throw new ContentError("The image approval payload is invalid.");
  const [payload, mac, extra] = token.split(".");
  if (extra !== undefined || !payload || !/^[a-f0-9]{64}$/.test(mac || "") || !timingSafeEqual(Buffer.from(mac), Buffer.from(signature(payload)))) throw new ContentError("The generated image approval is invalid.", 409);
  let stage: Stage;
  try { stage = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { throw new ContentError("The image approval is invalid.", 409); }
  const bytes = Buffer.from(encoded, "base64");
  const age = Date.now() - stage.at;
  if (age < 0 || age > 30 * 60_000 || stage.branch !== contentBranch() || stage.packageId !== pkg.id || stage.review !== hash(pkg.reviewToken || "") || stage.hash !== hash(bytes)) throw new ContentError("This image changed, expired, or belongs to another draft. Generate and review it again.", 409);
  return { bytes, stage };
}
