import { EXTERNAL_SOURCES } from "@/config/content-sources";
import type { TopicIdea, VerifiedSource } from "@/lib/contentTypes";

const MAX_SOURCE_BYTES = 750_000;
const SOURCE_TIMEOUT_MS = 8_000;
// Keep retained evidence small. Source links are references, never a licence to copy articles.
const MAX_EXCERPT_WORDS = 24;

function plainText(html: string): string {
  return html
    .replace(/<(script|style|nav|header|footer|form|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);|&apos;/gi, "'")
    .replace(/&lt;|&gt;/gi, " ")
    .replace(/&#(?:x[0-9a-f]+|\d+);/gi, " ")
    .replace(/\s+/g, " ").trim();
}

async function readBounded(response: Response): Promise<string> {
  const advertised = Number(response.headers.get("content-length") || 0);
  if (advertised > MAX_SOURCE_BYTES || !response.body) throw new Error("Source too large");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let output = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_SOURCE_BYTES) throw new Error("Source too large");
      output += decoder.decode(value, { stream: true });
    }
    return output + decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** Extract a short relevant paragraph, never scripts, links or page instructions. */
export function sourceExcerpt(html: string, terms: readonly string[]): string {
  const clean = html.replace(/<(script|style|nav|header|footer|form|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const candidates = Array.from(clean.matchAll(/<(?:p|li)\b[^>]*>([\s\S]*?)<\/(?:p|li)>/gi))
    .map((match) => plainText(match[1]))
    .filter((paragraph) => paragraph.length >= 65 && paragraph.length <= 4_000)
    .filter((paragraph) => !/cookie|copyright|privacy policy|membership|sign in|log in|ignore.{0,25}instruction/i.test(paragraph));
  const ranked = candidates.map((paragraph) => ({
    paragraph,
    score: terms.reduce((score, term) => score + (paragraph.toLowerCase().includes(term.toLowerCase()) ? 1 : 0), 0),
  })).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
  if (!ranked.length) return "";
  return ranked[0].paragraph.split(/\s+/).slice(0, MAX_EXCERPT_WORDS).join(" ");
}

export async function retrieveSources(topic: TopicIdea): Promise<VerifiedSource[]> {
  // Selection is from static objects, never a supplied URL. Redirects are rejected.
  const matching = EXTERNAL_SOURCES.filter((source) => (source.treatments as readonly string[]).includes(topic.treatmentSlug));
  const selected = (matching.length ? matching : EXTERNAL_SOURCES.filter((source) => source.id === "ida-dental-visits")).slice(0, 3);
  const results = await Promise.allSettled(selected.map(async (source): Promise<VerifiedSource | null> => {
    const response = await fetch(source.url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      headers: { Accept: "text/html", "User-Agent": "TanviContentOS/1.0 (source verification; https://www.tanvidental.in)" },
    });
    if (!response.ok || response.status >= 300 || !/text\/html/i.test(response.headers.get("content-type") || "")) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    const html = await readBounded(response);
    if (/access denied|verify you are human|just a moment|page not found|404 not found/i.test(plainText(html).slice(0, 400))) return null;
    const terms = [...source.terms, ...`${topic.primaryKeyword} ${topic.angle}`.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 4)];
    const excerpt = sourceExcerpt(html, terms);
    if (!excerpt) return null;
    return { id: source.id, title: source.title, url: source.url, retrievedAt: new Date().toISOString(), excerpt, status: "VERIFIED" };
  }));
  return results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
}
