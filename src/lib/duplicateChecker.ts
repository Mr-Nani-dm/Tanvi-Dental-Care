import type { DuplicateResult, TopicIdea } from "@/lib/contentTypes";

const ignoredWords = new Set("a an the and or to of in on for with your you my our is are be can does do how why what when should dental dentist dentistry care mangalagiri tanvi patient patients".split(" "));
export function normaliseTopic(value: string = "") {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function tokens(value: string = "") {
  return new Set(normaliseTopic(value).split(" ").filter((word) => word && !ignoredWords.has(word)).map((word) => word.length > 4 ? word.replace(/(?:ing|s)$/, "") : word));
}
function similarity(left: string = "", right: string = "") {
  const a = tokens(left), b = tokens(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((word) => b.has(word)).length;
  return overlap / new Set([...a, ...b]).size;
}
function exact(left?: string, right?: string) { return Boolean(left?.trim() && right?.trim() && normaliseTopic(left) === normaliseTopic(right)); }

/** A semantic risk signal, not a claim of plagiarism detection. */
export function checkDuplicates(topic: Partial<TopicIdea>, candidates: Array<Partial<TopicIdea>>): DuplicateResult {
  let best: DuplicateResult = { status: "NEW", score: 0, reason: "No close title, keyword, intent and angle match was found in the available content history." };
  const order = { NEW: 0, RELATED: 1, TOO_SIMILAR: 2, DUPLICATE: 3 };
  for (const candidate of candidates) {
    const title = similarity(topic.title, candidate.title);
    const keyword = similarity(topic.primaryKeyword, candidate.primaryKeyword);
    const intent = similarity(topic.intent, candidate.intent);
    const angle = similarity(topic.angle, candidate.angle);
    const sameTreatment = exact(topic.treatmentSlug, candidate.treatmentSlug);
    const score = Math.min(1, title * 0.45 + keyword * 0.2 + angle * 0.2 + intent * 0.1 + (sameTreatment ? 0.05 : 0));
    let status: DuplicateResult["status"] = "NEW";
    if (exact(topic.title, candidate.title) || title >= 0.9 || (exact(topic.primaryKeyword, candidate.primaryKeyword) && exact(topic.intent, candidate.intent) && exact(topic.angle, candidate.angle))) status = "DUPLICATE";
    else if (score >= 0.64 || (title >= 0.67 && keyword >= 0.6) || (sameTreatment && keyword >= 0.9 && angle >= 0.65)) status = "TOO_SIMILAR";
    else if (score >= 0.25 || title >= 0.35 || keyword >= 0.5 || sameTreatment) status = "RELATED";
    const result: DuplicateResult = {
      status,
      score: Math.round(score * 1000) / 1000,
      matchedTitle: candidate.title,
      reason: status === "DUPLICATE" ? "This title or search intent and angle duplicates an existing item; use the existing content."
        : status === "TOO_SIMILAR" ? "This topic closely overlaps an existing item; reuse it or create a distinct social angle instead of another blog."
        : status === "RELATED" ? "Related content exists; use a distinct patient question and link to the relevant existing page."
        : "The existing item has a different topic or angle.",
    };
    if (order[result.status] > order[best.status] || (order[result.status] === order[best.status] && result.score > best.score)) best = result;
  }
  return best;
}
