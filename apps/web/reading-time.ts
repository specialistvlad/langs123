// A topic's reading time: the words of the full lesson a reader of one explanation language reads in the
// default variety, counted in the topic's data, at the pace of a learner reading grammar.
//   Counted: the explanations, titles and labels in the reader's explanation language, the forms and
//   examples in the language being learned, and the examples' translations into the reader's language.
//   Left out: the other varieties' elements, the rows written for speakers of other languages, the column
//   headers, and the fields that name, level, tag or link the data.
import type { Explain, Topic } from "../../scripts/lib.ts";
import { isLocalized } from "../../scripts/text.ts";

export const WORDS_PER_MINUTE = 120;

const NOT_TEXT = new Set([
  "id",
  "lang",
  "kind",
  "tags",
  "concepts",
  "related",
  "status",
  "translated",
  "level",
  "features",
  "key",
  "value",
  "variety",
  "speakers",
  "readers",
  "to",
  "follows",
  "columns",
]);

// Whether an element serves this reader in this variety: its variety, its speakers and its readers.
function serves(el: Record<string, unknown>, explain: Explain, variety: string | undefined): boolean {
  if (typeof el["variety"] === "string" && el["variety"] !== variety) return false;
  const speakers = el["speakers"];
  if (Array.isArray(speakers) && !speakers.includes(explain)) return false;
  const readers = el["readers"];
  return !Array.isArray(readers) || readers.includes(explain);
}

export function topicWords(value: unknown, explain: Explain, variety?: string): number {
  if (typeof value === "string") return value.split(/\s+/).filter((w) => w !== "").length;
  if (Array.isArray(value)) return value.reduce((n: number, v) => n + topicWords(v, explain, variety), 0);
  if (value === null || typeof value !== "object") return 0;
  if (isLocalized(value)) return topicWords((value as Record<string, unknown>)[explain], explain, variety);
  const el = value as Record<string, unknown>;
  if (!serves(el, explain, variety)) return 0;
  return Object.entries(el).reduce((n, [key, v]) => (NOT_TEXT.has(key) ? n : n + topicWords(v, explain, variety)), 0);
}

export const readingMinutes = (topic: Topic, explain: Explain, variety?: string): number =>
  Math.max(1, Math.round(topicWords(topic, explain, variety) / WORDS_PER_MINUTE));
