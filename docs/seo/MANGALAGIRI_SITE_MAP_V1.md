# Mangalagiri SEO Site Map v1

## Objective

Make **https://www.tanvidental.in** the single canonical website for Tanvi Dental Care & Implant Centre and give each important Mangalagiri search intent one clear page owner.

This map does **not** use fabricated search-volume numbers. Priority is based on current clinic pages, specialist availability, commercial intent, existing content and observed local SERP competition.

## Core rules

1. One primary search intent should have one strongest canonical page.
2. Do not create duplicate doorway pages such as `/best-dentist-mangalagiri`, `/dentist-near-me-mangalagiri` and `/dental-clinic-mangalagiri` with substantially overlapping content.
3. The homepage owns the broad local-clinic intent.
4. Treatment pages own treatment + location intent.
5. Doctor pages own specialist + location intent.
6. Blog articles support treatment pages through patient-question intent and internal links.
7. All public SEO signals use `https://www.tanvidental.in`.
8. Admin, API, draft and preview URLs are excluded from indexing.
9. Medical and service claims must remain evidence-based and business-verified.

## Canonical site architecture

| URL | Primary intent | Supporting intent | Status |
|---|---|---|---|
| `/` | dentist in Mangalagiri | dental clinic in Mangalagiri, dentist near Old Bus Stand | LIVE |
| `/doctors` | dental specialists in Mangalagiri | dentists at Tanvi Dental Care | LIVE |
| `/doctors/naga-swathi-pokala` | oral & maxillofacial surgeon in Mangalagiri | oral surgeon in Mangalagiri | NEW |
| `/doctors/prathap-naidu` | endodontist in Mangalagiri | root canal specialist in Mangalagiri | NEW |
| `/treatments` | dental treatments in Mangalagiri | dental services in Mangalagiri | LIVE |
| `/treatments/root-canal-treatment` | root canal treatment in Mangalagiri | RCT in Mangalagiri | LIVE — PRIORITY |
| `/treatments/dental-implants` | dental implants in Mangalagiri | implant treatment information | LIVE — PRIORITY |
| `/treatments/wisdom-tooth-management` | wisdom tooth treatment in Mangalagiri | wisdom tooth pain / assessment | LIVE — PRIORITY |
| `/treatments/tooth-extractions` | tooth extraction in Mangalagiri | extraction treatment information | LIVE |
| `/treatments/crowns-and-bridges` | dental crowns and bridges in Mangalagiri | restorative dentistry | LIVE |
| `/treatments/tooth-coloured-fillings` | tooth coloured fillings in Mangalagiri | dental fillings | LIVE |
| `/treatments/teeth-cleaning-and-scaling` | teeth cleaning in Mangalagiri | scaling / preventive care | LIVE |
| `/treatments/gum-and-periodontal-care` | gum treatment in Mangalagiri | periodontal care | LIVE |
| `/treatments/dental-check-ups` | dental check-up in Mangalagiri | preventive dental visit | LIVE |
| `/treatments/cosmetic-dentistry` | cosmetic dentistry in Mangalagiri | smile / cosmetic treatment information | LIVE |
| `/treatments/denture-care` | dentures in Mangalagiri | denture care | LIVE |
| `/treatments/emergency-dental-care` | emergency dental care | urgent dental intent | HOLD FOR PROMOTION — confirm actual emergency availability |
| `/blog` | dental health information | patient education | LIVE |
| `/blog/when-to-see-a-dentist-for-tooth-pain` | when to see a dentist for tooth pain | tooth pain guidance | LIVE |
| `/blog/root-canal-treatment-what-to-expect` | what to expect from root canal treatment | RCT patient education | LIVE |
| `/blog/wisdom-tooth-pain-signs-and-assessment` | wisdom tooth pain signs | wisdom tooth assessment | LIVE |
| `/blog/painless-dentistry-best-dental-clinic-mangalagiri` | dental anxiety / comfort | patient education | LIVE — REVIEW TITLE/COPY LATER |

## Internal-linking model

### Root canal cluster

`tooth pain article`
→ `root canal article`
→ `/treatments/root-canal-treatment`
→ `/doctors/prathap-naidu`
→ Call / WhatsApp

### Wisdom tooth / oral surgery cluster

`wisdom tooth article`
→ `/treatments/wisdom-tooth-management`
→ `/doctors/naga-swathi-pokala`
→ Call / WhatsApp

### Broad local discovery

Homepage
→ Doctors
→ Treatments
→ Priority treatment page
→ Relevant doctor profile
→ Consultation CTA

## Indexing rules

### Index

- Homepage
- Doctors hub
- Individual doctor profiles
- Treatments hub
- Verified treatment pages
- Blog hub
- Published patient-education articles

### Do not index

- `/admin/*`
- `/api/admin/*`
- Draft articles
- Vercel preview/deployment URLs
- Duplicate hostnames
- Future internal confirmation/thank-you pages unless they provide unique public value

## Phase order

### Phase 1 — Technical foundation
- Canonical production host
- Sitemap
- Robots
- Canonicals
- Redirects
- Admin noindex

### Phase 2 — Entity and specialist authority
- Individual doctor pages
- Doctor ↔ treatment links
- Person + breadcrumb structured data

### Phase 3 — Priority treatment depth
1. Root Canal Treatment
2. Dental Implants
3. Wisdom Tooth Management
4. Tooth Extractions
5. Preventive / cleaning pages

### Phase 4 — Content clusters
Build patient-question articles that support the priority treatment pages. Do not publish thin or repetitive articles merely to increase page count.

### Phase 5 — Google activation
Only after public DNS/HTTPS are stable:
- Google Search Console Domain Property
- Submit `https://www.tanvidental.in/sitemap.xml`
- URL inspection for priority pages
- Google Business Profile website alignment
- Monitor queries, impressions, CTR, calls and WhatsApp conversions

## Theme constraint

SEO implementation must reuse the current Tanvi visual system. Do not change site colors, typography, card system, logo treatment or core layout solely for SEO.
