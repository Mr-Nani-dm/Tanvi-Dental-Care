import type { ContentFormat } from "@/lib/contentTypes";

/** One rulebook for generation, deterministic checks and the planner UI. */
export const CONTENT_POLICY = {
  version: 1,
  timezone: "Asia/Kolkata",
  topicCount: 3,
  specialMaxCharacters: 500,
  ai: { textPerHour: 12, textPerDay: 30, imagesPerHour: 2, imagesPerDay: 4 },
  formats: ["blog", "gbp", "instagram_static", "instagram_carousel", "reel"] as ContentFormat[],
  blog: { preferredMinWords: 700, preferredMaxWords: 900, maxWords: 1000, minSections: 4, maxSections: 6, maxFaqs: 3, minInternalLinks: 2, maxInternalLinks: 4, maxSeoTitleCharacters: 65, maxMetaDescriptionCharacters: 160 },
  gbp: { targetWords: 30, minWords: 25, maxWords: 40 },
  instagram: { minCaptionWords: 60, maxCaptionWords: 120, maxHashtags: 5, maxSlides: 5 },
  reel: { minSeconds: 20, maxSeconds: 40, maxSpokenWordsPerSecond: 3, maxScenes: 6 },
  frequency: {
    blog: { weekly: 2, monthly: 6 },
    gbp: { weekly: 5, monthly: null },
    instagram_static: { weekly: 3, monthly: null },
    instagram_carousel: { weekly: 2, monthly: null },
    reel: { weekly: 1, monthly: null },
  },
  // These are reservations, not claims that social content has been published.
  frequencyExplanation: "Saved drafts reserve slots. Limits use Monday–Sunday weeks and calendar months in India Standard Time. Published blogs and their Content OS drafts count once.",
  safety: { humanReviewRequired: true, automaticPublishing: false, allowSyntheticDoctorFaces: false, allowPatientStories: false },
} as const;

export const contentPolicy = CONTENT_POLICY;
