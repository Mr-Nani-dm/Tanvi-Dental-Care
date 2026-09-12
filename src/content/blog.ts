export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  treatmentSlug?: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "when-to-see-a-dentist-for-tooth-pain",
    title: "When Should You See a Dentist for Tooth Pain?",
    description:
      "A practical guide to tooth pain, warning signs that need prompt dental attention, and what to expect during an examination at a dental clinic.",
    excerpt:
      "Tooth pain can have many causes. Learn which symptoms should not be ignored and what a dentist may assess during your visit.",
    category: "Dental Health",
    publishedAt: "2026-09-12",
    readTime: "5 min read",
    treatmentSlug: "emergency-dental-care",
    sections: [
      {
        heading: "Tooth pain is a symptom, not a diagnosis",
        paragraphs: [
          "Pain may come from decay, a cracked tooth, inflamed gums, infection, sensitivity, grinding, or another dental problem. The location and intensity of pain alone do not reliably identify the cause.",
          "A dental examination helps determine what is happening and whether treatment is needed. Depending on the concern, the dentist may also recommend an X-ray or other investigation.",
        ],
      },
      {
        heading: "When to arrange a dental appointment",
        paragraphs: [
          "It is sensible to contact a dentist when pain persists, returns repeatedly, affects sleep or eating, or is accompanied by another symptom.",
        ],
        bullets: [
          "Pain that lasts more than a short period or keeps returning",
          "Pain when biting or chewing",
          "Sensitivity that lingers after hot or cold food",
          "Swelling around a tooth, gum, jaw or face",
          "A broken tooth, lost filling or dental trauma",
          "A bad taste, discharge, or other signs that may suggest infection",
        ],
      },
      {
        heading: "Symptoms that may need urgent attention",
        paragraphs: [
          "Severe facial swelling, difficulty breathing or swallowing, significant trauma, uncontrolled bleeding, or rapidly worsening symptoms require prompt medical or dental attention. If breathing or swallowing is affected, seek emergency medical care rather than waiting for a routine appointment.",
        ],
      },
      {
        heading: "What happens at the dental visit",
        paragraphs: [
          "The dentist will usually ask about your symptoms and medical history, examine the painful area, and explain the likely cause and treatment options. The appropriate treatment depends on the clinical findings rather than the symptom alone.",
          "If you are unsure whether your symptoms can wait, call the clinic and describe what you are experiencing so the team can advise on appointment urgency.",
        ],
      },
    ],
  },
  {
    slug: "root-canal-treatment-what-to-expect",
    title: "Root Canal Treatment: What Patients Can Expect",
    description:
      "Understand why root canal treatment may be recommended, what usually happens during assessment and treatment, and why every case needs individual evaluation.",
    excerpt:
      "Root canal treatment is used in selected cases to treat the inside of a tooth and help preserve it. Here is a simple patient-focused overview.",
    category: "Treatments",
    publishedAt: "2026-09-12",
    readTime: "6 min read",
    treatmentSlug: "root-canal-treatment",
    sections: [
      {
        heading: "Why root canal treatment may be recommended",
        paragraphs: [
          "Inside each tooth is soft tissue called the pulp. If the pulp becomes inflamed or infected because of deep decay, a crack, trauma or another problem, a dentist may recommend root canal treatment when the tooth is suitable to be preserved.",
          "Not every painful tooth needs root canal treatment, and not every tooth can be saved. An examination and appropriate imaging are important before a treatment decision is made.",
        ],
      },
      {
        heading: "What the procedure generally involves",
        paragraphs: [
          "The purpose of treatment is to clean and disinfect the affected root canal system and then seal the space. Local anaesthetic is commonly used, and the number of visits can vary according to the tooth and clinical situation.",
        ],
        bullets: [
          "Assessment and diagnosis",
          "Local anaesthesia when appropriate",
          "Cleaning and shaping the root canal system",
          "Disinfection and sealing",
          "Restoration of the tooth after treatment",
        ],
      },
      {
        heading: "What happens after treatment",
        paragraphs: [
          "Some tenderness can occur after treatment. The dentist will explain after-care and whether the tooth needs a filling, crown or another restoration to protect it.",
          "If pain or swelling becomes severe, worsens unexpectedly or you are concerned about recovery, contact the treating dentist for advice.",
        ],
      },
    ],
  },
  {
    slug: "wisdom-tooth-pain-signs-and-assessment",
    title: "Wisdom Tooth Pain: Common Signs and When to Get It Checked",
    description:
      "Learn why wisdom teeth can cause discomfort, which symptoms deserve a dental assessment, and how treatment decisions are made.",
    excerpt:
      "Wisdom teeth do not always need removal. Symptoms, tooth position and surrounding tissues all matter when deciding what to do next.",
    category: "Dental Health",
    publishedAt: "2026-09-12",
    readTime: "5 min read",
    treatmentSlug: "wisdom-tooth-management",
    sections: [
      {
        heading: "Why wisdom teeth can become uncomfortable",
        paragraphs: [
          "Wisdom teeth are the last molars to develop. Some erupt normally, while others may be partly covered by gum, angled, impacted, difficult to clean, or associated with inflammation around the surrounding tissues.",
          "Pain near the back of the mouth does not automatically mean a wisdom tooth needs to be removed. A dental examination is needed to identify the cause.",
        ],
      },
      {
        heading: "Symptoms worth discussing with a dentist",
        paragraphs: [
          "Arrange an assessment if symptoms are persistent, recurrent or getting worse.",
        ],
        bullets: [
          "Pain or tenderness behind the last molar",
          "Swollen or inflamed gum around a partly erupted tooth",
          "Difficulty cleaning the area",
          "Unpleasant taste or recurrent food trapping",
          "Jaw discomfort or difficulty opening the mouth normally",
          "Swelling that is increasing or associated with fever",
        ],
      },
      {
        heading: "How a dentist decides what to do",
        paragraphs: [
          "The dentist considers your symptoms, the condition and position of the tooth, nearby teeth and gums, and any relevant imaging. Management may range from monitoring and hygiene advice to treatment of inflammation or removal when clinically appropriate.",
          "The right option depends on the individual case, so treatment should not be chosen from symptoms alone.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
