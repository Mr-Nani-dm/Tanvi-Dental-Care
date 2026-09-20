import type { TopicIdea } from "./contentTypes";

/** Planning suggestions only; these are not measured search-demand signals. */
export function localSearchPhrase(topic: Pick<TopicIdea, "primaryKeyword">) {
  return /\bmangalagiri\b/i.test(topic.primaryKeyword) ? topic.primaryKeyword : `${topic.primaryKeyword} in Mangalagiri`;
}

export function topicImageConcept(topic: Pick<TopicIdea, "treatmentSlug">) {
  const concepts: Record<string, string> = {
    "root-canal-treatment": "A simple tooth outline beside question cards and a consultation checklist.",
    "dental-implants": "An abstract dental arch beside option cards and a planning notebook.",
    "wisdom-tooth-management": "A stylised dental arch with the rear tooth highlighted beside a question card.",
    "teeth-cleaning-and-scaling": "A toothbrush, a simple tooth icon and a calendar arranged as a clean educational illustration.",
    "general-dental-care": "A check-up calendar, tooth icon and question notebook arranged as a calm educational illustration.",
  };
  return `${concepts[topic.treatmentSlug] || concepts["general-dental-care"]} Adapt the composition to the selected patient question, using teal, navy and warm white.`;
}
