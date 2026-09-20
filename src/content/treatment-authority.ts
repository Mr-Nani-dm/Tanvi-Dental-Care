export type TreatmentAuthorityContent = {
  updatedAt: string;
  seoDescription: string;
  eyebrow: string;
  introTitle: string;
  introParagraphs: string[];
  assessmentTitle: string;
  assessmentItems: string[];
  treatmentTitle: string;
  treatmentItems: string[];
  aftercareTitle: string;
  aftercareParagraphs: string[];
  faq: { question: string; answer: string }[];
};

export const treatmentAuthorityContent: Record<string, TreatmentAuthorityContent> = {
  "root-canal-treatment": {
    updatedAt: "2026-09-20",
    seoDescription: "Root canal treatment in Mangalagiri: learn when RCT may be considered, what assessment involves, treatment steps, after-care and how to contact Tanvi Dental Care.",
    eyebrow: "Root canal treatment in Mangalagiri",
    introTitle: "When root canal treatment may be considered.",
    introParagraphs: [
      "Root canal treatment is used in selected cases when the soft tissue inside a tooth becomes inflamed or infected and the tooth is suitable to be preserved.",
      "Tooth pain alone does not confirm that a root canal is needed. Decay, cracks, gum problems, sensitivity and other dental conditions can cause similar symptoms, so diagnosis comes before treatment."
    ],
    assessmentTitle: "What the dentist may assess",
    assessmentItems: [
      "when the pain started and what triggers it",
      "the condition of the tooth and surrounding gums",
      "how the tooth responds to appropriate clinical tests",
      "whether dental imaging is indicated",
      "whether the tooth can be predictably restored after treatment"
    ],
    treatmentTitle: "What treatment generally involves",
    treatmentItems: [
      "local anaesthesia when appropriate",
      "accessing and cleaning the root canal system",
      "disinfecting and shaping the canals",
      "sealing the cleaned canal space",
      "restoring and protecting the tooth after treatment"
    ],
    aftercareTitle: "After treatment",
    aftercareParagraphs: [
      "Some tenderness can occur after treatment. Your dentist will explain after-care and whether the tooth needs a filling, crown or another restoration.",
      "If pain or swelling becomes severe, worsens unexpectedly or you are concerned about recovery, contact the treating dentist for advice."
    ],
    faq: [
      {
        question: "Does every painful tooth need a root canal?",
        answer: "No. Tooth pain can have several causes. A dental examination and, when appropriate, imaging or other tests are used before deciding whether root canal treatment is suitable."
      },
      {
        question: "Can a root canal help save a natural tooth?",
        answer: "In suitable cases, root canal treatment is used to treat the inside of a tooth so the tooth can be retained. Whether a tooth can be predictably preserved depends on the individual clinical findings."
      },
      {
        question: "How many visits are needed for root canal treatment?",
        answer: "The number of visits varies according to the tooth and clinical situation. Your dentist can explain the expected sequence after assessment."
      },
      {
        question: "Who provides root canal care at Tanvi Dental Care?",
        answer: "Dr. Prathap Naidu is presented by Tanvi Dental Care & Implant Centre as a BDS, MDS Endodontist. Treatment suitability is confirmed after clinical assessment."
      }
    ]
  },

  "dental-implants": {
    updatedAt: "2026-09-20",
    seoDescription: "Dental implants in Mangalagiri: understand implant assessment, treatment planning, restoration and long-term care at Tanvi Dental Care & Implant Centre.",
    eyebrow: "Dental implants in Mangalagiri",
    introTitle: "A fixed tooth-replacement option for selected patients.",
    introParagraphs: [
      "Dental implants are one option for replacing missing teeth. An implant is placed in the jaw and can support a replacement tooth or another dental restoration when the clinical conditions are suitable.",
      "Implants are not automatically the right option for every missing tooth. The dentist needs to assess oral health, the available supporting tissues, the space being restored and relevant health factors before recommending treatment."
    ],
    assessmentTitle: "What implant assessment may include",
    assessmentItems: [
      "the missing-tooth area and surrounding gums",
      "the condition of nearby teeth",
      "the amount and quality of supporting bone",
      "your bite and the space available for restoration",
      "relevant medical and dental history",
      "dental imaging when clinically indicated"
    ],
    treatmentTitle: "What implant treatment can involve",
    treatmentItems: [
      "clinical assessment and treatment planning",
      "placement of the implant when suitable",
      "a healing period determined by the clinical situation",
      "planning and fitting the final restoration",
      "ongoing cleaning and maintenance around the implant"
    ],
    aftercareTitle: "Long-term care matters",
    aftercareParagraphs: [
      "Dental implants require regular oral hygiene and professional review just like natural teeth and other dental restorations.",
      "The exact treatment sequence, healing period and restoration design depend on your individual examination and treatment plan."
    ],
    faq: [
      {
        question: "Is everyone suitable for a dental implant?",
        answer: "No. Implant suitability depends on the individual clinical situation, including oral health, supporting tissues, space, bite and relevant health factors."
      },
      {
        question: "Do dental implants require maintenance?",
        answer: "Yes. Cleaning around the implant and regular dental review are important parts of long-term care."
      },
      {
        question: "How long does implant treatment take?",
        answer: "There is no single timeline for every patient. The sequence depends on the clinical findings, healing and the type of restoration planned."
      },
      {
        question: "Can I know the implant plan before an examination?",
        answer: "A general overview can be discussed, but the final treatment plan should be based on an individual examination and any clinically indicated imaging."
      }
    ]
  },

  "wisdom-tooth-management": {
    updatedAt: "2026-09-20",
    seoDescription: "Wisdom tooth assessment in Mangalagiri: learn common symptoms, how dentists assess wisdom teeth, when removal may be considered and when urgent care is needed.",
    eyebrow: "Wisdom tooth assessment in Mangalagiri",
    introTitle: "Not every wisdom tooth needs removal.",
    introParagraphs: [
      "Wisdom teeth may erupt normally, remain partly covered by gum, become impacted, or be difficult to clean. Symptoms around the back teeth can also have causes other than the wisdom tooth itself.",
      "The decision to monitor, treat surrounding inflammation or consider removal depends on symptoms, tooth position, nearby teeth and gums, and the clinical findings."
    ],
    assessmentTitle: "Reasons to arrange an assessment",
    assessmentItems: [
      "persistent or recurring pain behind the last molar",
      "swelling or inflamed gum around a partly erupted tooth",
      "recurrent food trapping or difficulty cleaning the area",
      "unpleasant taste or discharge",
      "jaw discomfort or difficulty opening the mouth normally",
      "concern about the position of the tooth or nearby teeth"
    ],
    treatmentTitle: "How the treatment decision is made",
    treatmentItems: [
      "reviewing your symptoms and dental history",
      "examining the wisdom tooth and surrounding tissues",
      "using dental imaging when clinically indicated",
      "deciding whether monitoring, local treatment or removal is appropriate",
      "discussing expected recovery and after-care if removal is recommended"
    ],
    aftercareTitle: "When symptoms need urgent attention",
    aftercareParagraphs: [
      "Increasing swelling, fever or worsening pain should be assessed promptly.",
      "Seek urgent medical attention if swelling around the mouth, face, eye or neck is associated with difficulty breathing or swallowing."
    ],
    faq: [
      {
        question: "Do all wisdom teeth need to be removed?",
        answer: "No. Some wisdom teeth can be monitored when they are healthy and not causing problems. Removal is considered when the clinical findings make it appropriate."
      },
      {
        question: "Can wisdom-tooth pain settle and come back?",
        answer: "Yes. Symptoms around a partly erupted or difficult-to-clean wisdom tooth can recur. Repeated symptoms are a reason to arrange a dental assessment."
      },
      {
        question: "Is an X-ray always needed for wisdom-tooth pain?",
        answer: "Dental imaging is used when clinically indicated. The dentist decides which examination or imaging is appropriate for the individual case."
      },
      {
        question: "Who assesses wisdom-tooth problems at Tanvi Dental Care?",
        answer: "Dr. Naga Swathi Pokala is presented by Tanvi Dental Care & Implant Centre as a BDS, MDS Oral & Maxillofacial Surgeon. The appropriate treatment depends on clinical assessment."
      }
    ]
  }
};

export function getTreatmentAuthorityContent(slug: string) {
  return treatmentAuthorityContent[slug];
}
