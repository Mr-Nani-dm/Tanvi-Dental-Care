import assert from "node:assert/strict";
import { test } from "node:test";
import { stageImage, verifyStagedImage } from "@/lib/contentImageStage";
import type { ContentPackage } from "@/lib/contentTypes";

test("image approval tokens expire and cannot cross branches or reviewed drafts", () => {
  const values = { BLOG_ADMIN_SESSION_SECRET: "stage-unit-test-secret", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feature/image-test", VERCEL_GIT_REPO_OWNER: "Mr-Nani-dm", GITHUB_CONTENT_REPOSITORY: "Mr-Nani-dm/Tanvi-Dental-Care" };
  const saved = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  const clock = Date.now;
  try {
    const at = clock(); Date.now = () => at;
    const pkg = { id: "test-draft", reviewToken: "signed-exact-review" } as ContentPackage;
    const bytes = Buffer.from("server-validated-raster-fixture");
    const token = stageImage(bytes, pkg, "test-image-model");
    assert.deepEqual(verifyStagedImage(token, bytes.toString("base64"), pkg).bytes, bytes);
    assert.throws(() => verifyStagedImage(token, bytes.toString("base64"), { ...pkg, reviewToken: "another-review" }));
    process.env.VERCEL_GIT_COMMIT_REF = "feature/different";
    assert.throws(() => verifyStagedImage(token, bytes.toString("base64"), pkg));
    process.env.VERCEL_GIT_COMMIT_REF = values.VERCEL_GIT_COMMIT_REF;
    Date.now = () => at + 30 * 60_000 + 1;
    assert.throws(() => verifyStagedImage(token, bytes.toString("base64"), pkg));
  } finally {
    Date.now = clock;
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
