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
  // The root holds the samples, which the owner approves as a whole (RV-08): their indexes draw on no source and
  // none is approved.
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

// The words of the list a text holds: whole words, an all-lowercase entry in any case, and an entry with a capital
// as written, past the first word of a sentence, where every word takes its capital; a Japanese entry anywhere,
// since Japanese runs its words together.
export function wordsIn(text: string, list: readonly string[] | undefined): string[] {
  return (list ?? []).filter((word) => {
    if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(word)) return text.includes(word);
    const lower = word === word.toLowerCase();
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const found = text.matchAll(new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, lower ? "giu" : "gu"));
    return [...found].some((m) => lower || !/(?:^|[.!?…:]\s)[\s\p{Ps}\p{Pi}¿¡«"„—-]*$/u.test(text.slice(0, m.index)));
  });
}
