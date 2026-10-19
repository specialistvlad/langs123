// Text and its marks (CONVENTIONS.md §12): what each mark is, how text folds into output with its
// separators, and how to walk it.
import { EXPLAIN, type Explain, type Localized, type Mark, say, slotName, type Text, type Variety } from "./lib.ts";
import { JOINERS } from "./joiners.ts";

// A localized value names explanation languages only; an empty one names none, and the check reports it.
export const isLocalized = (value: object): value is Localized => Object.keys(value).every((k) => k in EXPLAIN);

// The text of a localized value in an explanation language; npm run check guarantees it exists.
export function textIn(value: Localized, explain: Explain): Text {
  const text: Text | undefined = value[explain];
  if (text === undefined) throw new Error(`No "${explain}" text in ${JSON.stringify(value)}`);
  return text;
}

// ---------- Marks ----------

// Marks that hold text: the renderer shows the text and names what it is.
export const SPAN_MARKS = ["target", "aux", "subj", "verb", "ending", "stress", "term", "letter", "signal", "sound", "l1"] as const;
// Marks that hold text with a value the same in every language.
export const VALUE_MARKS = ["date", "weekday", "time", "numeral", "ordinal"] as const;
// Structures: pieces of text the renderer joins.
export const LIST_MARKS = ["alternatives", "examples", "mapping", "takes", "exchange", "pattern", "equivalence", "contrast"] as const;
// The other marks.
export const OTHER_MARKS = ["gloss", "ipa", "link", "intonation", "gap", "variant", "slot", "optional"] as const;
export const MARKS = [...SPAN_MARKS, ...VALUE_MARKS, ...LIST_MARKS, ...OTHER_MARKS] as const;
export type MarkName = (typeof MARKS)[number];

// The keys of a mark that are not its name: its value, target, variety or position.
const ATTRIBUTES = new Set(["value", "to", "variety", "follows"]);

export function markName(m: Mark): MarkName {
  const name = Object.keys(m).find((k) => !ATTRIBUTES.has(k));
  if (name === undefined || !(MARKS as readonly string[]).includes(name)) throw new Error(`Not a mark: ${JSON.stringify(m)}`);
  return name as MarkName;
}

// ---------- Folding text ----------

// How text becomes output: the HTML renderer and plain text share the separators and wrappers.
export interface TextOutput<T> {
  text(s: string): T;
  join(parts: T[]): T;
  // c: the text the mark stands in, in the language being learned (plain) or explaining it.
  mark(name: MarkName, inner: T, m: Mark, c: FoldContext): T;
  // Neighbouring variants as one swap, where the context swaps them.
  swap?: (variants: T[]) => T;
  // Drawn apart where an output has them, else text: a list's separator (" / "), a transcription in its
  // slashes, a variety's name before its form in the language being learned ("US:").
  joiner?: (sep: string) => T;
  ipa?: (transcription: string) => T;
  label?: (name: string) => T;
}

export interface FoldContext {
  explain: Explain;
  // Text in the language being learned, or explanation text.
  plain: boolean;
  // How a variety is named: "US".
  variety: (v: Variety) => string;
  // Examples in a summary follow each other in the sentence: a comma after a phrase, a space after a sentence.
  sentences?: boolean;
  // On a language with varieties the reader's choice picks a variant: each shows its form alone, and
  // neighbouring variants, apart from the spaces between them, stand as one.
  swap?: boolean;
  // A copy of the text in one variety: its variants show, and the other varieties' go.
  pick?: Variety;
}

export function foldText<T>(t: Text, out: TextOutput<T>, c: FoldContext): T {
  if (typeof t === "string") return out.text(t);
  if (!Array.isArray(t)) return foldMark(t, out, c);
  const swap = c.swap === true ? out.swap : undefined;
  if (swap === undefined) return out.join(t.map((p) => foldText(p, out, c)));
  // Each run of neighbouring variants folds into one swap, without the spaces between them.
  const parts: T[] = [];
  let run: T[] = [];
  for (const [n, p] of t.entries()) {
    if (isVariant(p)) run.push(foldText(p, out, c));
    else if (!(run.length > 0 && typeof p === "string" && p.trim() === "" && isVariant(t[n + 1] ?? ""))) {
      if (run.length > 0) parts.push(swap(run));
      run = [];
      parts.push(foldText(p, out, c));
    }
  }
  if (run.length > 0) parts.push(swap(run));
  return out.join(parts);
}

const isVariant = (p: Text): boolean => typeof p === "object" && !Array.isArray(p) && markName(p) === "variant";

function foldMark<T>(m: Mark, out: TextOutput<T>, c: FoldContext): T {
  const name = markName(m);
  const fold = (t: Text, over: Partial<FoldContext> = {}): T => foldText(t, out, { ...c, ...over });
  const wrap = (inner: T): T => out.mark(name, inner, m, c);
  const inParens = (inner: T): T => out.join([out.text("("), inner, out.text(")")]);
  switch (name) {
    case "ipa":
      return wrap(out.ipa === undefined ? out.text(`/${(m as { ipa: string }).ipa}/`) : out.ipa((m as { ipa: string }).ipa));
    case "intonation":
      return wrap(out.text((m as { intonation: string }).intonation === "rise" ? "↗" : "↘"));
    case "gap":
      return wrap(out.text("…"));
    case "slot": {
      const slot = (m as { slot: string | Localized }).slot;
      return wrap(typeof slot === "string" ? out.text(slotName(slot, c.explain)) : fold(textIn(slot, c.explain), { plain: false }));
    }
    case "gloss": {
      const g = (m as { gloss: Text | Localized }).gloss;
      const inner = isLocalizedValue(g) ? fold(textIn(g, c.explain), { plain: false }) : fold(g);
      return wrap(c.plain ? inParens(inner) : inner);
    }
    case "optional":
      return wrap(inParens(fold((m as { optional: Text }).optional)));
    case "variant": {
      const v = m as { variant: Text; variety: Variety };
      if (c.pick !== undefined && v.variety !== c.pick) return out.text("");
      if (c.swap === true) return wrap(fold(v.variant));
      const called = c.variety(v.variety);
      const label = c.plain && out.label !== undefined ? out.join([out.label(`${called}:`), out.text(" ")]) : out.text(`${called}: `);
      const inner = out.join([label, fold(v.variant)]);
      return wrap(c.plain ? inParens(inner) : inner);
    }
    case "alternatives":
    case "examples":
    case "mapping":
    case "takes":
    case "exchange":
    case "pattern":
    case "equivalence":
    case "contrast": {
      const items = (m as unknown as Record<string, Text[]>)[name] ?? [];
      const sentences = c.sentences === true && name === "examples";
      const sep =
        (name === "alternatives" || name === "examples") && !sentences && items.some((i) => showsSlash(i, c)) ? " · " : JOINERS[name];
      const parts: T[] = [];
      const joiner = (s: string): T => (out.joiner === undefined ? out.text(s) : out.joiner(s));
      if ((m as { follows?: true }).follows === true) parts.push(joiner(sep.trimStart()));
      items.forEach((item, n) => {
        if (n > 0) {
          const previous = items[n - 1];
          parts.push(!sentences ? joiner(sep) : out.text(previous !== undefined && /[.!?]$/.test(plainText(previous, c)) ? " " : ", "));
        }
        parts.push(fold(item, { sentences: false }));
      });
      return wrap(out.join(parts));
    }
    case "target":
    case "aux":
    case "subj":
    case "verb":
    case "ending":
    case "stress":
    case "term":
    case "letter":
    case "signal":
    case "sound":
    case "l1":
    case "date":
    case "weekday":
    case "time":
    case "numeral":
    case "ordinal":
    case "link":
      return wrap(fold((m as unknown as Record<string, Text>)[name] ?? ""));
  }
}

// A piece that shows a slash of its own: alternatives (go → gone / been), a date (5/5) or IPA (/θɪŋk/).
const showsSlash = (t: Text, c: FoldContext): boolean => plainText(t, c).includes("/");

const isLocalizedValue = (v: Text | Localized): v is Localized => typeof v === "object" && !Array.isArray(v) && isLocalized(v);

const PLAIN: TextOutput<string> = { text: (s) => s, join: (p) => p.join(""), mark: (_n, inner) => inner };

// The text a reader sees, without markup.
export const plainText = (t: Text, c: FoldContext): string => foldText(t, PLAIN, c);

// Each variety's name in interface.yaml.
const VARIETY_KEYS: Record<Variety, string> = {
  "en-GB": "varietyGb",
  "en-US": "varietyUs",
  "es-419": "varietyLatam",
  "es-ES": "varietySpain",
};

// A variety's name in an explanation language: "US", "Spain".
export const varietyName = (v: Variety, explain: Explain): string => say(VARIETY_KEYS[v], explain);

// How text reads in an explanation language: in the language being learned (plain) or explaining it.
export const reading = (explain: Explain, plain: boolean): FoldContext => ({ explain, plain, variety: (v) => varietyName(v, explain) });
