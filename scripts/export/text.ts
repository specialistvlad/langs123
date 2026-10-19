// Text as library.json holds it: inline Markdown per explanation language and variety (export.ts).
import { EMPHASIS, STRONG } from "../../apps/web/html.ts";
import { shows } from "../content.ts";
import { type CurriculumLanguage, EXPLAIN_CODES, type Explain, explainOf, type Localized, type Text, type Variety } from "../lib.ts";
import { type FoldContext, foldText, isLocalized, plainText, reading, type TextOutput } from "../text.ts";
import type { Keyed } from "./types.ts";

// A run of text with what a reader shows on it: bold, italics, a link to a topic, and the marks that style
// it beyond bold and italics (TAGS).
interface Run {
  s: string;
  bold: boolean;
  italic: boolean;
  link?: string;
  tags?: string[];
}

// The marks written `[text](m:tag,tag)`: IPA in the mono face, a joiner between the pieces of a list in
// muted grey, an optional word and a gap in the secondary ink, a slot as a chip, an intonation arrow in the
// accent, and a variety named inline, its label apart from its form.
const TAGS = new Set(["ipa", "optional", "gap", "slot", "intonation", "variant"]);
const LISTS = new Set(["alternatives", "examples", "mapping", "takes", "exchange", "pattern", "equivalence", "contrast"]);
const JOINER = /^\s*(\/|·|→|—|\+|=|≠)\s*$/;
const tagged = (runs: Run[], tag: string, only: (r: Run) => boolean = () => true): Run[] =>
  runs.map((r) => (only(r) && r.tags?.includes(tag) !== true ? { ...r, tags: [...(r.tags ?? []), tag].sort() } : r));
const RUNS: TextOutput<Run[]> = {
  text: (s) => [{ s, bold: false, italic: false }],
  join: (parts) => parts.flat(),
  mark: (name, inner, m, c) => {
    if (STRONG.has(name)) return inner.map((r) => ({ ...r, bold: true }));
    if (EMPHASIS.has(name)) return inner.map((r) => ({ ...r, italic: true }));
    if (name === "link") return inner.map((r) => ({ ...r, link: (m as { to: string }).to }));
    if (TAGS.has(name)) {
      if (name !== "variant") return tagged(inner, name);
      // A variety named inline: "US: " is the label of the form after it; swapped in place it is the form alone.
      const label = `${c.variety((m as { variety: Variety }).variety)}: `;
      return c.swap === true ? inner : tagged(tagged(inner, "variant"), "label", (r) => r.s === label);
    }
    // The separators of a list stay plain strings until here, where a run that is only a joiner is tagged.
    if (LISTS.has(name)) return tagged(inner, "joiner", (r) => r.tags === undefined && JOINER.test(r.s));
    return inner;
  },
  // Neighbouring variants, of which one variety's shows: one run, without the spaces between them.
  swap: (variants) => variants.flat(),
};

const escape = (s: string): string => s.replace(/[\\*_`[\]]/g, "\\$&");

// Runs as inline Markdown: neighbours that look the same join, and spaces stay outside the emphasis.
function markdown(runs: Run[]): string {
  const joined: Run[] = [];
  for (const r of runs) {
    const last = joined.at(-1);
    if (last?.bold === r.bold && last.italic === r.italic && last.link === r.link && last.tags?.join() === r.tags?.join()) last.s += r.s;
    else joined.push({ ...r });
  }
  const word = (c: string | undefined): boolean => c !== undefined && /[\p{L}\p{N}]/u.test(c);
  return joined
    .map((r, n) => {
      const [, before = "", body = "", after = ""] = /^(\s*)([\s\S]*?)(\s*)$/.exec(r.s) ?? [];
      // Markdown opens emphasis only after a space or punctuation when its text starts with punctuation, and
      // closes it only before one when its text ends with it: `I**'ll work**` stays as written. Such a run is
      // written as a mark of its own, `[text](m:strong)`.
      const glued =
        (before === "" && /^[^\p{L}\p{N}\s]/u.test(body) && word(joined[n - 1]?.s.at(-1))) ||
        (after === "" && /[^\p{L}\p{N}\s]$/u.test(body) && word(joined[n + 1]?.s.at(0)));
      const tags = [...(r.tags ?? []), ...(glued && r.bold ? ["strong"] : []), ...(glued && r.italic ? ["emphasis"] : [])].sort();
      const bold = r.bold && !(glued && body !== "");
      const italic = r.italic && !(glued && body !== "");
      const stars = bold && italic ? "***" : bold ? "**" : italic ? "*" : "";
      const inner = body === "" ? "" : `${stars}${escape(body)}${stars}`;
      const url = r.link !== undefined ? `id:${r.link}` : tags.length === 0 ? undefined : `m:${tags.join(",")}`;
      return before + (url === undefined || inner === "" ? inner : `[${inner}](${url})`) + after;
    })
    .join("");
}

// The track being exported: the explanation languages its language is written for, the source first, and
// the varieties a reader chooses between (curriculum.yaml), the default first.
export let TRACK: { explain: Explain[]; varieties: Variety[] | undefined } = { explain: [...EXPLAIN_CODES], varieties: undefined };

// How text reads in an explanation language and, on a language with varieties, in one variety: each
// variant shows its form alone, as the website shows the chosen variety.
export const context = (e: Explain, v: Variety | undefined, plain: boolean): FoldContext =>
  v === undefined ? reading(e, plain) : { ...reading(e, plain), swap: true, pick: v };

// Explanation text, and text in the language being learned, in an explanation language and a variety.
export const explained = (t: Text, e: Explain, v?: Variety): string => markdown(foldText(t, RUNS, context(e, v, false)));
export const learned = (t: Text, e: Explain, v?: Variety, sentences = false): string =>
  markdown(foldText(t, RUNS, { ...context(e, v, true), sentences }));

export function perReading(
  text: (e: Explain, v: Variety | undefined) => string | undefined,
  langs: readonly Explain[] = TRACK.explain,
): Keyed {
  const out: Keyed = {};
  for (const e of langs) {
    const each = (TRACK.varieties ?? [undefined]).map((v) => [v, text(e, v)] as const);
    const values = new Set(each.map(([, s]) => s));
    if (values.has(undefined)) continue;
    if (values.size === 1) out[e] = each[0]?.[1] ?? "";
    else for (const [v, s] of each) out[`${e}@${v ?? ""}`] = s ?? "";
  }
  return out;
}

// A localized value in each explanation language of the track it has.
export function localized(
  value: Localized | undefined,
  as: (t: Text, e: Explain, v: Variety | undefined) => string = explained,
): Keyed | undefined {
  if (value === undefined) return undefined;
  return perReading((e, v) => (value[e] === undefined ? undefined : as(value[e], e, v)));
}
export const translation = (value: Localized | undefined): Keyed | undefined =>
  localized(value, (t, e, v) => plainText(t, context(e, v, false)));

// Text in the language being learned: one string when it reads the same in every explanation language and
// variety.
export function inLanguage(t: Text | undefined, sentences = false): string | Keyed | undefined {
  if (t === undefined) return undefined;
  const each = perReading((e, v) => learned(t, e, v, sentences));
  const values = new Set(Object.values(each));
  return values.size === 1 ? [...values][0] : each;
}

// Explanation text or text in the language being learned, as a cell or a column title holds it.
export const cellText = (value: Text | Localized): string | Keyed | undefined =>
  typeof value === "object" && !Array.isArray(value) && isLocalized(value) ? localized(value) : inLanguage(value);

// The explanation languages of the track an element serves; none listed when it serves all.
export function audience(serving: (e: Explain) => boolean): Explain[] | undefined {
  const codes = TRACK.explain.filter(serving);
  return codes.length === TRACK.explain.length ? undefined : codes;
}
export const readersOf = (el: { readers?: Explain[] | undefined }): Explain[] | undefined => audience((e) => shows(el, e));

// Exports what `run` makes in the track of a language being learned.
export function inTrack<T>(lang: CurriculumLanguage, run: () => T): T {
  TRACK = { explain: explainOf(lang), varieties: lang.varieties };
  try {
    return run();
  } finally {
    TRACK = { explain: [...EXPLAIN_CODES], varieties: undefined };
  }
}
