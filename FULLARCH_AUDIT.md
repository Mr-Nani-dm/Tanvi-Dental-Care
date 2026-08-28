# Tanvi Dental Care — Full Architecture Audit

Branch: `fullarch-audit`

## Objective

Raise the production website toward a legitimate 96/100 standard across architecture, brand/UI, UX, healthcare governance, SEO/local SEO, accessibility, performance and conversion.

## Implemented in this branch

- Created a dedicated `fullarch-audit` branch from `main`.
- Added shared verified doctor data and reusable doctor cards.
- Added `/doctors/` and individual doctor profile routes.
- Added `/about`, `/services`, `/faq`, and `/contact` routes.
- Added reusable SEO metadata helpers.
- Added canonical metadata, Open Graph, Twitter metadata, robots and sitemap generation.
- Added evidence-safe Dentist and Person schema helpers.
- Switched key logo, hero and doctor imagery to `next/image`.
- Improved homepage navigation to use route-based pages.
- Added responsive inner-page styles and reduced-motion handling.
- Added a business verification status model for treatment claims.
- Added `typecheck` and production `check` scripts.

## Business verification gates

The treatment catalogue currently contains items that must remain classified as `BUSINESS_VERIFICATION_REQUIRED` until the clinic explicitly confirms them. See `src/config/verification.ts`.

Do not promote these to definitive service claims without verification.

## Remaining production gates

1. Run `npm install`, `npm run typecheck`, and `npm run build` in a network-enabled CI/runtime.
2. Perform a Lighthouse/PageSpeed audit against the deployed branch.
3. Perform keyboard and screen-reader QA on every new route.
4. Verify all business contact details, hours, Google profile data and treatment availability with the clinic.
5. Replace any non-approved generated doctor imagery with approved production photography where required.
6. Move Google Fonts from CSS `@import` to `next/font` as a follow-up performance refinement.
7. Complete visual regression testing at 320, 375, 390, 414, 768, 1024, 1280, 1440 and 1920px.
8. Review all remaining CSS duplication and finish extracting homepage sections into feature components.

## Scoring target

The 96/100 target is an acceptance criterion, not permission to inflate scores. Any missing points caused by unavailable business verification, production assets or runtime measurements must remain explicitly documented.
