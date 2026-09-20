# Tanvi Content OS V1

This feature is prepared on `feature/tanvi-content-os-v1` for a Vercel preview and an open PR. Do not merge or promote it to production until the clinic owner approves. Existing production DNS, domains and environment settings have not been changed.

## Staff workflow

Open `/admin/content` and sign in with the existing Blog Manager credentials. Answer the three daily questions, choose one of three ideas and select suitable formats. The server generates content, checks deterministic rules and makes a separate AI review call. Editing content invalidates that review. Resolve review findings before requesting an image or handing off a blog.

Save keeps a draft in history. **Saved text and image files are public in the GitHub repository even before website publication.** Staff must confirm that storage is appropriate. Never enter patient names, contact details, clinical records, case histories or confidential information. Automated detection is an additional guard, not a guarantee that all sensitive input can be recognised.

Create Blog Draft opens the existing `/admin/blog` editor. It always creates `status: draft`, never overwrites an existing blog URL, and leaves clinical reviewer fields blank. Choose the URL before handoff; it is locked afterward. Blog Manager retains final publishing control. Content OS articles require the actual reviewing Tanvi clinician's name and review date, image rights confirmation where applicable, deterministic checks and another independent AI review at publication. The CTA remains editable in Blog Manager.

## Preview setup

Existing server-side settings are reused: `BLOG_ADMIN_PASSWORD`, `BLOG_ADMIN_SESSION_SECRET`, `GITHUB_CONTENT_TOKEN` and `GITHUB_CONTENT_REPOSITORY`. A fine-grained token needs Contents read/write for this repository. Never enter a secret in a client field or a `NEXT_PUBLIC_*` variable.

Set these **Preview-scoped** values through the administrator's secret settings before testing real AI generation:

| Setting | Purpose | Current documented model example |
| --- | --- | --- |
| `OPENAI_API_KEY` | Clinic-controlled OpenAI project credential | Secret; no default |
| `CONTENT_OS_TEXT_MODEL` | Topic and content generation | `gpt-5.6-terra` |
| `CONTENT_OS_REVIEW_MODEL` | Separate critical reviewer call | `gpt-5.6-sol` |
| `CONTENT_OS_IMAGE_MODEL` | Optional educational illustration | `gpt-image-2.5-sunburst` |

Examples were checked against the [OpenAI model catalog](https://developers.openai.com/api/docs/models) and [image-generation documentation](https://developers.openai.com/api/docs/guides/image-generation). Confirm availability in the clinic's project. Model IDs are configuration, not hardcoded fallbacks. The text integration uses [Responses structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) with `store: false`; this does not imply that all provider retention is disabled. Organisation/project retention settings still apply. Set a provider project budget in addition to the application limits.

The setup screen reports missing settings honestly. There is no fake live generation, demo login, embedded key or production authentication bypass.

Vercel previews always use `VERCEL_GIT_COMMIT_REF` for GitHub reads and writes, overriding an inherited `GITHUB_CONTENT_BRANCH=main`. Missing or production preview refs fail closed. Local development requires an explicit non-production `GITHUB_CONTENT_BRANCH`. Production retains its existing content branch behaviour after an approved merge.

## Evidence and editorial limits

`src/config/content-policy.ts` is the policy source. Blog title plus visible body must remain under 1,001 words, preferably 700–900. Overlength output is revised once, recounted, and rejected if still over 1,000. GBP is 25–40 words; Instagram captions 60–120 words with at most five separate hashtags; carousels at most five slides; reels are 20–40 second scripts only. No video is produced in V1.

Three ideas use actual clinic facts, the blog inventory and saved content history. V1 has no live Search Console, SERP or keyword-volume feed. It does not label generated assertions as search evidence. Google Search Console integration remains a future addition; the sitemap workflow is unchanged.

Sources are exact approved Indian Dental Association/IACDE URLs, retrieved on the server with bounded responses and no redirects. Failed retrievals are omitted. Retrieved evidence is dated and limited to a short excerpt. A working link is not proof that every generated claim is supported; the independent review must assess that separately, and a clinician must review before publication. Sources containing instructions are treated as untrusted data.

New-blog suitability considers coverage, intent and depth. Similarity checks consider title, keyword, intent, treatment and angle. No automated system provides complete plagiarism, copyright, medical or legal clearance. Use original copy, avoid quoting sources, and review image provenance and rights before publication. V1 does not generate patient testimonials, before/after comparisons or synthetic doctor faces. Doctor content uses the existing approved portraits.

## Persistence, concurrency and cost

History is in `src/content/content-os-data.json`; public usage counters are in `src/content/content-os-usage.json`. There is no database migration. Counters store timestamps and operation IDs, not prompts or credentials. Optimistic GitHub SHA updates reserve quota **before** paid calls, across serverless instances: 12 text calls/hour, 30/day; 2 images/hour, 4/day. Failed or timed-out calls retain their reservation because the provider may already have incurred cost. Generation, correction and review are separate counted calls.

Saved drafts reserve slots, not published-social statuses. Limits follow IST Monday–Sunday weeks and calendar months: blog 2/week and 6/month; GBP 5/week; static 3/week; carousel 2/week; reel 1/week. Published blogs and matching handoffs count once. External social publishing is manual, so V1 cannot observe or enforce posts made outside this tool. Blog publication dates for new Content OS articles are assigned by the server.

HMAC signatures bind topic, immutable evidence and exact reviewed content to the deployment's content branch. Edited drafts retain provenance but lose the previous review approval. Save revisions prevent one editor silently overwriting another. Blog handoff commits history and the new draft atomically, rejecting conflicting or duplicate URLs. Histories stop at 250 packages or 900 KB and require deliberate archival; they are not silently truncated.

Images are decoded and re-encoded with Sharp to WebP, metadata stripped, maximum 1,200px and 3 MB, then saved under `public/images/content/YYYY/MM/`. An inline preview is available immediately; the committed public URL becomes available after the branch rebuild. A generated image remains marked for human review. Old asset paths are unchanged.

Storage-only commits can skip unnecessary Vercel builds using a [versioned ignore command](https://vercel.com/docs/project-configuration/vercel-json#ignorecommand) that compares against the last deployed commit. Code, blog and image changes still build. Missing comparison information defaults to building.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Tests use test-only HTTP mocks for GitHub, source retrieval and OpenAI: they do not spend money or publish content. They cover authentication, cross-origin protection, bounded payloads, signatures, quota races, topic selection, independent review, content limits, duplicates, source allowlists, history, atomic handoff and image optimization.

Preview acceptance also checks `/admin/content`, `/admin/blog`, homepage Maps and fonts, doctor/treatment/blog routes, sitemap, robots and mobile layout. Real provider output quality and live image generation must be checked after Preview secrets are configured; mocked tests do not establish production account/model access.

Recorded implementation QA: 44 automated tests passed; TypeScript and the Next.js build passed; the production dependency audit reported zero vulnerabilities. Local HTTP checks returned 200 for the public/admin pages, sitemap and robots; the legacy blog redirect remained 308, and all five Content OS write endpoints returned 401 without a session. The Vercel preview reached READY. Browser visual checks could not run because the browser security service could not grant access; desktop/mobile appearance and actual third-party rendering remain to be reviewed. No browser access restriction was bypassed and no production release was performed.
