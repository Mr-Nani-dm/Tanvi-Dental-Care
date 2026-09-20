/** Conservative publishing rules. An automated pass is not clinical approval. */
export const CONTENT_SAFETY_POLICY = {
  allowedPsychology: ["Reassurance", "Curiosity", "Prevention", "Trust", "Clarity", "Relatability", "Local familiarity"],
  prohibited: ["Guaranteed outcomes", "Unsupported superiority", "Personal diagnosis", "Patient stories or testimonials", "Before-and-after claims", "Unverified statistics", "False urgency", "Synthetic doctor faces", "Copied or unlicensed material"],
  jurisdiction: "Patient education for Mangalagiri, Andhra Pradesh, India; no imported foreign regulatory or insurance advice.",
  clinicalReview: "Only a real clinician may confirm clinical review. The AI reviewer does not confer medical approval.",
} as const;

export function normaliseSafetyText(value: string) {
  return value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").toLowerCase().replace(/[‐‑‒–—−_-]/g, " ").replace(/\s+/g, " ").trim();
}

const claimRules: Array<[RegExp, string]> = [
  [/\bguarantee(?:d|s)?\b/, "Remove guaranteed outcomes or success claims."],
  [/\b(?:completely|totally|entirely|100\s*%|100\s*percent)\s+(?:pain\s*less|pain\s*free)\b/, "Remove absolute pain-free claims."],
  [/\b(?:best|number\s*one|no\.?\s*1|top\s*rated|leading|finest|world\s*class)\s+(?:dentist|dental|clinic|surgeon|care|treatment)\b/, "Remove unsupported superiority claims."],
  [/\bpermanent\s+(?:cure|solution|results?)\b/, "Remove permanent cure or outcome claims."],
  [/\b(?:no|zero|without|free\s+of)\s+(?:any\s+)?risks?\b|\brisk\s*free\b/, "Remove claims that treatment has no risks."],
  [/\b(?:before\s*(?:and|&|\/)\s*after|before\s+after)\b/, "Before-and-after claims are outside this workflow."],
  [/\b(?:testimonial|our\s+patient(?:s)?\s+(?:said|reported|shared|named|says)|a\s+patient\s+(?:named|visited|told)|one\s+patient\s+(?:said|reported|shared|visited|told)|patient\s+success\s+stor(?:y|ies))\b/, "Remove patient stories, testimonials and invented social proof."],
  [/\b(?:[1-5]\s*star|five\s*star|[0-9,]+\s+(?:happy|satisfied)\s+patients|rated\s+[0-9])\b/, "Review and remove unverified ratings or patient-count claims."],
  [/[0-9]+(?:\.[0-9]+)?\s*(?:%|per\s*cent\b|percent\b)/, "Numerical medical claims need source-specific human verification; omit them in V1."],
  [/\b(?:clinically\s+proven|scientifically\s+proven|award\s+winning|internationally\s+certified|board\s+certified)\b/, "Remove credentials, awards or evidence claims not held in verified clinic facts."],
  [/\b(?:medically|clinically)\s+(?:reviewed|approved|verified)|\breviewed\s+by\s+(?:dr\.?|doctor)\b/, "Only a real clinician may add their review attribution after an actual review."],
  [/\b\d+\+?\s+years?\s+(?:of\s+)?(?:(?:clinical|dental|surgical|professional)\s+)?experience\b/, "Do not invent years of clinical experience; this claim is not present in the approved clinic facts."],
];

const medicalRules: Array<[RegExp, string]> = [
  [/\b(?:you\s+(?:definitely\s+|certainly\s+)?have|you\s+need|this\s+(?:means|proves)\s+you\s+have|your\s+symptoms\s+(?:mean|prove|confirm))\s+(?:a\s+|an\s+)?(?:infection|abscess|cavity|cavities|decay|gum\s+disease|root\s+canal|extraction|implant|cancer)\b/, "Remove individual diagnosis or a personal treatment prescription."],
  [/\b(?:take|use|start|stop|prescribe)\s+(?:(?:[0-9]+|a|an)\s*)?(?:mg\s+)?(?:amoxicillin|antibiotics?|ibuprofen|paracetamol|aspirin|metronidazole|penicillin)\b|\b[0-9]+\s*(?:mg|mcg|ml)\b/, "Medication or dosage advice requires clinical review and is outside V1 generation."],
  [/\b(?:before\s+it[’']?s\s+too\s+late|act\s+now|limited\s+time|last\s+chance|lose\s+all\s+your\s+teeth|embarrassing\s+smile|disgusting\s+teeth|medical\s+panic)\b/, "Remove fear, shame or artificial urgency."],
  [/\b(?:self\s+extract|remove\s+your\s+own\s+tooth|drain\s+(?:an?|your)\s+abscess|household\s+bleach)\b/, "Remove potentially harmful home treatment instructions."],
];

export function findClaimIssues(text: string): string[] {
  const normalized = normaliseSafetyText(text);
  return claimRules.filter(([pattern]) => pattern.test(normalized)).map(([, message]) => message);
}

export function findMedicalIssues(text: string): string[] {
  const normalized = normaliseSafetyText(text);
  return medicalRules.filter(([pattern]) => pattern.test(normalized)).map(([, message]) => message);
}

export function findPrivateInputIssues(text: string): string[] {
  const issues: string[] = [];
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text) || /(?:\+?\d[\s().-]*){10,}/.test(text)) issues.push("Do not enter phone numbers, email addresses or personal identifiers.");
  if (/\b(?:aadhaar|aadhar|pan\s*(?:card|number)|passport|date\s+of\s+birth|dob\s*[:=]|medical\s+record|patient\s*(?:id|name|number)|case\s*(?:id|number))\b/i.test(text)) issues.push("Patient identifiers and health records cannot be entered here.");
  if (/\b(?:my\s+patient|our\s+patient|patient\s+(?:named|aged)|\d{1,3}\s*(?:year[ -]old|years?\s+old))\b/i.test(text)) issues.push("Use a general educational topic without patient details or individual case histories.");
  return issues;
}

export function findJurisdictionIssues(text: string): string[] {
  return /\b(?:HIPAA|Medicare|Medicaid|NHS|FDA[- ]approved|ADA[- ]approved|US\s+dollars?|USD|United\s+States\s+(?:law|rules|insurance))\b|\$\s*\d/i.test(text)
    ? ["Remove foreign regulatory, insurance or pricing advice; content must suit patients in India and Andhra Pradesh."] : [];
}
