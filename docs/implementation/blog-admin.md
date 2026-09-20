# Tanvi Blog Manager

## Purpose

The Blog Manager lets clinic staff create and publish SEO-ready blog posts without editing code.

Admin URL:

`/admin/blog`

## What an editor can manage

- Article title and URL slug
- Category
- Related treatment
- Short description
- Featured image and image alt text
- Article body with headings, lists, links, bold text and inline images
- SEO title and meta description
- Primary search topic and tags
- Author
- Optional clinical reviewer and review date
- Draft / publish state

## What publishing updates automatically

A published post is stored in `src/content/blog-data.json`. The public application builds SEO output from that single content source:

- `/blog` listing
- `/blog/[slug]` article route
- XML sitemap entry
- Canonical URL
- Open Graph and Twitter metadata
- `BlogPosting` JSON-LD
- Breadcrumb JSON-LD
- Related article recommendations
- Related treatment link on the article
- Helpful article links on the matching treatment page

Draft posts are not included in the public blog or sitemap. They are still committed to the public GitHub repository and can remain visible in repository history. Never put patient information, health records, contact details received in confidence or other confidential material in a draft.

## Persistence model

The admin APIs write blog content and images to this public GitHub repository with a fine-grained GitHub token stored only in server-side environment variables. Image assets are stored under `public/images/blog/`. The editor requires an explicit public-storage acknowledgement before either a draft or published post can be saved.

The browser never receives the GitHub token.

When the repository is connected to Vercel through Git deployment, a content commit triggers the normal deployment pipeline. The deployment regenerates static article pages and SEO metadata from the latest content.

## Canonical production domain

The public SEO identity is fixed in `src/config/site.ts` as `https://www.tanvidental.in`. Canonicals, sitemap URLs, robots, Open Graph metadata and JSON-LD must use that production URL. Do not use a Vercel deployment hostname as a public SEO URL.

## Required environment variables

Configure these in the production hosting environment:

- `BLOG_ADMIN_PASSWORD`
- `BLOG_ADMIN_SESSION_SECRET`
- `GITHUB_CONTENT_TOKEN`
- `GITHUB_CONTENT_REPOSITORY` (optional; defaults to `Mr-Nani-dm/Tanvi-Dental-Care`)
- `GITHUB_CONTENT_BRANCH` (optional; defaults to `main`)

### GitHub token permissions

Use a fine-grained personal access token scoped only to the `Tanvi-Dental-Care` repository with:

- Repository contents: Read and write

Do not grant administration, secrets, actions, organization or account permissions for the blog editor token.

## Health-content publishing rule

The admin UI supports an optional `Clinically reviewed by` field. Only enter a doctor's name after that doctor has actually reviewed and approved the article. Leaving the reviewer blank is preferred over making an unsupported review claim.

## Local relevance and sources

Write for patients in Mangalagiri, Andhra Pradesh, India. Prioritise practical local questions, verified clinic details and Indian patient-information sources. Read the [local content and source policy](../seo/LOCAL_CONTENT_POLICY.md) before publishing or revising patient content. Claims about rules, registration, approvals or patient rights must be checked against current Indian and applicable Andhra Pradesh official sources.

## Image handling

The admin browser attempts to decode, resize and convert uploaded images to WebP before upload, which also removes ordinary embedded metadata from the new browser-generated file. The server accepts JPG, PNG and WebP files, verifies that the file signature matches the declared type and rejects empty files or files above 3 MB. Editors must still inspect the source image because browser conversion and signature checks are not a substitute for a privacy or rights review.

Every featured or inline image requires an explicit rights confirmation before upload and again as part of the publishing validation. Upload only images that are clinic-owned, properly licensed or otherwise authorised for this publication. Do not upload an identifiable patient unless the clinic holds valid permission covering the intended public use. Keep licence, source and consent records outside this public repository.

## Recommended operational flow

1. Write the article.
2. Add a featured image only after checking ownership, licence and any required subject permission; then add accurate alt text.
3. Choose the related treatment.
4. Complete the SEO fields until the readiness score is strong.
5. Preview the content.
6. Confirm that the article contains no patient or confidential information and may be stored in the public repository.
7. Save as a public-repository draft if clinical review is required.
8. Add the reviewer only after real approval.
9. Publish.
10. Verify the public article after the connected deployment completes.
