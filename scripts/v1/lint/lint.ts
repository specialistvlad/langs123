// The linter of the new library: one function per rule of library/RULES.md whose check is lint, each reading the
// library where the rule's Courses and Languages lines say it holds, and each problem naming its rule. The rules of
// a library's reach (IX-13, IX-18 to IX-20) hold for the whole library, at the gates that ask for it (--reach).
import type { KanjiByLevel, WordLists } from "../../generated/library-v1.ts";
import type { Catalog } from "../../rule-catalog.ts";
import type { Library } from "../library.ts";
import type { Mark, MarkName, Run } from "../marks.ts";
import type { Problem } from "../schema.ts";
import { type Scope, scopeOf } from "../scope.ts";
import { type Text, textsOf } from "./texts.ts";

export interface Lexicon {
  words: Map<string, WordLists>;
  kanji?: KanjiByLevel;
}

export interface LintOptions {
  // The rules of the library's reach run too.
  reach?: boolean;
  // The root holds the samples, which the owner approves as a whole (RV-08): their topics stand outside the waves,
  // their indexes draw on no source and none is approved.
  samples?: boolean;
}

// What the linter reads beside the library: the lists, today's topics and the interface wording.
export interface Beside {
  lexicon?: Lexicon;
  // The ids of today's library's topics (IX-07).
  today?: Set<string>;
  // The interface wording, each key's text in each language (NO-45).
  wording?: Record<string, Record<string, string>>;
  options?: LintOptions;
}

export interface Lint {
  library: Library;
  catalog: Catalog;
  lexicon: Lexicon;
  today: Set<string>;
  wording: Record<string, Record<string, string>>;
  options: LintOptions;
  texts: Text[];
}

export interface LintRule {
  id: string;
  reach?: boolean;
  check: (lint: Lint, scope: Scope) => Problem[];
}

export const makeLint = (library: Library, catalog: Catalog, beside: Beside = {}): Lint => ({
  library,
  catalog,
  lexicon: beside.lexicon ?? { words: new Map() },
  today: beside.today ?? new Set(),
  wording: beside.wording ?? {},
  options: beside.options ?? {},
  texts: library.courses.flatMap(textsOf),
});

export const runLint = (rules: LintRule[], lint: Lint): Problem[] =>
  rules.filter((r) => r.reach !== true || lint.options.reach === true).flatMap((r) => r.check(lint, scopeOf(lint.catalog, r.id)));

// The texts a rule reads: those of the courses its Courses line lists, in the languages its Languages line lists
// (a variety's entry, es-ES, naming its language's text).
export function textsIn(lint: Lint, scope: Scope): Text[] {
  const languages = scope.languages?.map((l) => l.split("-")[0]);
  return lint.texts.filter((t) => (scope.courses?.includes(t.topic.course) ?? true) && (languages?.includes(t.language) ?? true));
}

// The text a reader sees, with the content of the marks left out that the test names, each in its place: a check of
// one language's text leaves out the words of another language inside it, its terms, its phrases in other
// languages and its transcriptions, or a variety's forms.
export const plainWithout = (runs: Run[], skip: (mark: Mark) => boolean): string =>
  runs.map((r) => (typeof r === "string" ? r : skip(r) ? MASK : plainWithout(r.content, skip))).join("");
// What stands in place of a mark left out: no letter, no space, and no script's own, so the words around it stay
// apart and the spacing around it stays as written.
export const MASK = "\ufffc";
export const without =
  (...names: MarkName[]) =>
  (mark: Mark): boolean =>
    names.includes(mark.name);

const OTHER: MarkName[] = ["term", "l1", "ipa", "romaji", "translit"];
// A text's own words: its plain text without terms, phrases in another language, transcriptions and romaji.
export const ownWords = (t: Text): string => plainWithout(t.runs, without(...OTHER));
// A text's own words outside the forms of a variety.
export const ownWordsOutside = (t: Text, variety: string): string =>
  plainWithout(t.runs, (m) => OTHER.includes(m.name) || (m.name === "variant" && m.attribute === variety));

export const problem = (rule: string, t: Text, message: string): Problem => ({ rule, file: t.file, id: t.id, message });

// A list's matcher, built once per list: one expression for its all-lowercase entries, matched in any case, one for
// its entries with a capital, matched as written, and its Japanese entries, which stand anywhere in a text since
// Japanese runs its words together. Each expression matches whole words, the longest entry first.
interface Matcher {
  japanese: string[];
  lower?: RegExp;
  cased?: RegExp;
  // Each lowercase entry by its own text, to give the entry as the list writes it.
  entries: Map<string, string>;
}
const MATCHERS = new Map<string, Matcher>();
const JAPANESE = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;
const SENTENCE_START = /(?:^|[.!?…:]\s)[\s\p{Ps}\p{Pi}¿¡«"„—-]*$/u;
const escaped = (word: string): string => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const whole = (words: string[], flags: string): RegExp | undefined =>
  words.length === 0
    ? undefined
    : new RegExp(
        `(?<![\\p{L}\\p{M}])(?:${[...words]
          .sort((a, b) => b.length - a.length)
          .map(escaped)
          .join("|")})(?![\\p{L}\\p{M}])`,
        flags,
      );

function matcherOf(list: readonly string[]): Matcher {
  const key = list.join("\u0000");
  const kept = MATCHERS.get(key);
  if (kept !== undefined) return kept;
  const words = list.filter((w) => !JAPANESE.test(w));
  const lower = words.filter((w) => w === w.toLowerCase());
  const lowerMatcher = whole(lower, "giu");
  const casedMatcher = whole(
    words.filter((w) => w !== w.toLowerCase()),
    "gu",
  );
  const matcher: Matcher = {
    japanese: list.filter((w) => JAPANESE.test(w)),
    ...(lowerMatcher !== undefined && { lower: lowerMatcher }),
    ...(casedMatcher !== undefined && { cased: casedMatcher }),
    entries: new Map(lower.map((w) => [w.toLowerCase(), w])),
  };
  MATCHERS.set(key, matcher);
  return matcher;
}

// The words of the list a text holds, in the list's order: whole words, an all-lowercase entry in any case, and an
// entry with a capital as written, past the first word of a sentence, where every word takes its capital; a Japanese
// entry anywhere.
export function wordsIn(text: string, list: readonly string[] | undefined): string[] {
  if (list === undefined || list.length === 0) return [];
  const matcher = matcherOf(list);
  const found = new Set(matcher.japanese.filter((w) => text.includes(w)));
  for (const m of matcher.lower === undefined ? [] : text.matchAll(matcher.lower)) {
    const entry = matcher.entries.get(m[0].toLowerCase());
    if (entry !== undefined) found.add(entry);
  }
  for (const m of matcher.cased === undefined ? [] : text.matchAll(matcher.cased)) {
    if (!SENTENCE_START.test(text.slice(0, m.index))) found.add(m[0]);
  }
  return list.filter((w) => found.has(w));
}
