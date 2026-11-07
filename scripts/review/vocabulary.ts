// The program check of a topic's words against each level's vocabulary (SH-09, VO-03, the lead's rule of 6 November):
// each explanation of the source file has its words looked up, as written or by a lemma the language's endings give
// (lemmas.ts), in the lists up to its level, the opening's at the topic's lowest level and a sentence's at its
// subtopic's; the question is then asked of the elements with words the lists lack, and of those words alone, so a
// request stays small at any level. A level whose list the file lacks leaves its elements unchecked, named.
import { LEVELS } from "../lib.ts";
import type { Course, Topic } from "../v1/library.ts";
import { plainWithout } from "../v1/lint/lint.ts";
import { type Text, textsOf } from "../v1/lint/texts.ts";
import type { Run } from "../v1/marks.ts";
import { lemmas } from "./lemmas.ts";
import type { Vocabulary } from "./sources.ts";

export interface Unknown {
  id: string;
  level: string;
  words: string[];
}

// The marks whose content is no word of the explanation: terms, phrases in other languages, transcriptions and forms.
const SKIPPED = ["term", "l1", "ipa", "romaji", "translit", "variant", "kanji", "target"];
const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’-]*/gu;
const OPENING = ["title", "definition", "essence"];

// The words of a text the lists lack, lowercased, each once, in the order met.
export function unknownWords(runs: Run[], language: string, known: Set<string>): string[] {
  const text = plainWithout(runs, (m) => SKIPPED.includes(m.name))
    .normalize("NFC")
    .toLowerCase();
  const words = [...new Set([...text.matchAll(WORD)].map((m) => m[0].replace(/^['’-]+|['’-]+$/gu, "")))].filter((w) => w !== "");
  return words.filter((w) => !lemmas(w, language).some((l) => known.has(l)));
}

// The words of every level up to the one given, lowercased, or nothing where the file lacks a level to it.
export function knownTo(vocabulary: Vocabulary, level: string): Set<string> | undefined {
  const lists = LEVELS.slice(0, LEVELS.indexOf(level as (typeof LEVELS)[number]) + 1).map((l) => vocabulary.levels[l]);
  if (lists.some((l) => l === undefined)) return undefined;
  return new Set(lists.flat().map((w) => (w ?? "").normalize("NFC").toLowerCase()));
}

// The topic's elements with words their level's vocabulary lacks: the opening's at the topic's lowest level, the
// explanations' at their subtopic's; and the levels the file lacks.
export function unknownIn(
  course: Course,
  topic: Topic,
  vocabulary: Vocabulary,
): { opening: Unknown[]; explanations: Unknown[]; missing: string[] } {
  const language = course.index?.data.source ?? course.course;
  const lowest = LEVELS.find((l) => topic.source.data.subtopics.some((s) => s.level === l)) ?? "A0";
  const texts = textsOf({ ...course, topics: [topic] }).filter(
    (t) => t.file === topic.source.file && t.kind === "explanation" && t.language === language,
  );
  const known = new Map<string, Set<string> | undefined>();
  const missing = new Set<string>();
  const check = (t: Text, level: string): Unknown[] => {
    if (!known.has(level)) known.set(level, knownTo(vocabulary, level));
    const set = known.get(level);
    if (set === undefined) {
      missing.add(level);
      return [];
    }
    const words = unknownWords(t.runs, language, set);
    return words.length === 0 ? [] : [{ id: t.id, level, words }];
  };
  return {
    opening: texts.filter((t) => OPENING.includes(t.part)).flatMap((t) => check(t, lowest)),
    explanations: texts.filter((t) => !OPENING.includes(t.part)).flatMap((t) => check(t, t.level ?? lowest)),
    missing: LEVELS.filter((l) => missing.has(l)),
  };
}
