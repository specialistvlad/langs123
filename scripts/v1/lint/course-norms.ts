// The norms of each course's own text: English IPA is British, a US value standing in an en-US variant (NO-02);
// Ukrainian marks the stress of its examples, cells and the forms any explanation discusses (NO-09) and of nothing
// else (NO-10), and
// transliterates in its three script topics alone (NO-11); Japanese gives romaji in its kana topics (NO-22), writes
// in its own script beyond them (NO-23), every kanji with its reading, in its text and in the terms of any
// explanation (NO-24), A0 examples in kana (NO-25) and A1
// and A2 examples with the kanji of their level (NO-26); Spanish vosotros carries es-ES (NO-29) and voseo stands in
// elements carrying es-419 (NO-31); the affricates of Québec carry fr-CA (NO-33); a swap holds each variety's form once,
// side by side (NO-34), the forms differing (NO-51).
import { plain, marksOf, swapsOf } from "../marks.ts";
import type { Topic } from "../library.ts";
import type { Problem } from "../schema.ts";
import type { Scope } from "../scope.ts";
import { type Lint, type LintRule, ownWords, plainWithout, problem, textsIn, without, wordsIn } from "./lint.ts";
import type { Text } from "./texts.ts";

const VOWELS = "aeiouæɑɒɔəɛɜɪʊʌ";
const US_IPA = new RegExp(`oʊ|ɚ|ɝ|ɾ|[${VOWELS}]ː?r(?![${VOWELS}])`, "u");
const UK_VOWELS = /[аеєиіїоуюя]/giu;
const HAN = /\p{Script=Han}/u;

const scriptOf = (lint: Lint, topic: Topic): string | undefined =>
  lint.library.courses
    .find((c) => c.course === topic.course)
    ?.index?.data.sections.flatMap((s) => s.topics)
    .find((e) => e.id === topic.slug)?.script;
// The course's own text: its examples, cells and forms, and the forms an explanation discusses in its terms.
const courseText = (t: Text): string =>
  t.kind === "explanation"
    ? marksOf(t.runs)
        .filter(({ mark }) => mark.name === "term")
        .map(({ mark }) => plain(mark.content))
        .join(" ")
    : plainWithout(t.runs, without("ipa", "romaji", "translit"));
// The transcriptions of a text outside a variety's forms: its ipa marks, or an item's transcription whole.
const ipaOutside = (t: Text, variety: string): string[] =>
  (t.ipa
    ? [t.runs]
    : marksOf(t.runs)
        .filter(({ mark }) => mark.name === "ipa")
        .map(({ mark }) => mark.content)
  ).map((runs) => plainWithout(runs, (m) => m.name === "variant" && m.attribute === variety));
// A Spanish text's words outside a variety's forms, the forms its terms discuss among them.
const spanishOutside = (t: Text, variety: string): string =>
  plainWithout(t.runs, (m) => ["l1", "ipa", "romaji", "translit"].includes(m.name) || (m.name === "variant" && m.attribute === variety));
// The course's own text outside its kanji marks: an example's, a cell's or a form's, or the terms of an explanation.
const bare = (t: Text): string[] =>
  t.kind === "explanation"
    ? marksOf(t.runs)
        .filter(({ mark }) => mark.name === "term")
        .map(({ mark }) => plainWithout(mark.content, without("kanji")))
    : [plainWithout(t.runs, without("kanji"))];
// A rule's reach over every text of its courses, whatever language explains them.
const courseOnly = (scope: Scope): Scope => (scope.courses === undefined ? {} : { courses: scope.courses });
const varietyOf = (lint: Lint, t: Text): string[] =>
  lint.library.courses.find((c) => c.course === t.topic.course)?.index?.data.varieties ?? [];

export const COURSE_NORMS: LintRule[] = [
  {
    id: "NO-02",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.variety !== "en-US" && ipaOutside(t, "en-US").some((ipa) => US_IPA.test(ipa)))
        .map((t) => problem("NO-02", t, "the IPA is British; a US value stands in an en-US variant")),
  },
  {
    id: "NO-09",
    check: (lint, scope) =>
      textsIn(lint, courseOnly(scope)).flatMap((t) =>
        [...courseText(t).matchAll(/[\p{Script=Cyrillic}́’]+/gu)]
          .map((m) => m[0])
          .filter((w) => (w.match(UK_VOWELS) ?? []).length > 1 && !w.includes("́"))
          .map((w) => problem("NO-09", t, `${w} marks its stress`)),
      ),
  },
  {
    id: "NO-10",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind === "explanation" && ownWords(t).includes("́"))
        .map((t) => problem("NO-10", t, "a title or an explanation is written in plain letters")),
  },
  {
    id: "NO-11",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter(
          (t) =>
            marksOf(t.runs).some(({ mark }) => mark.name === "translit") &&
            !["alphabet", "sounds", "soft-sign"].includes(scriptOf(lint, t.topic) ?? ""),
        )
        .map((t) => problem("NO-11", t, "a transliteration stands in the alphabet, the sounds and the soft sign alone")),
  },
  {
    id: "NO-22",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter(
          (t) => t.kind === "course" && scriptOf(lint, t.topic) === "kana" && !marksOf(t.runs).some(({ mark }) => mark.name === "romaji"),
        )
        .map((t) => problem("NO-22", t, "an example of a kana topic gives its romaji")),
  },
  {
    id: "NO-23",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind !== "explanation" && scriptOf(lint, t.topic) !== "kana" && /[A-Za-z]/.test(courseText(t)))
        .map((t) => problem("NO-23", t, "Japanese is written in Japanese script")),
  },
  {
    id: "NO-24",
    check: (lint, scope) =>
      textsIn(lint, courseOnly(scope))
        .filter((t) => bare(t).some((x) => HAN.test(x)))
        .map((t) => problem("NO-24", t, "a kanji carries its reading in a kanji mark")),
  },
  {
    id: "NO-25",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind === "course" && t.level === "A0" && HAN.test(plain(t.runs)))
        .map((t) => problem("NO-25", t, "an A0 example is written in kana")),
  },
  {
    id: "NO-26",
    check: (lint: Lint, scope: Scope): Problem[] => {
      const of = (level: "A1" | "A2"): string[] => (lint.lexicon.kanji?.[level] ?? []).map((w) => w.word);
      const allowed = { A1: new Set(of("A1").join("")), A2: new Set([...of("A1"), ...of("A2")].join("")) };
      return textsIn(lint, scope).flatMap((t) => {
        if (t.kind !== "course" || (t.level !== "A1" && t.level !== "A2")) return [];
        const above = (plain(t.runs).match(/\p{Script=Han}/gu) ?? []).filter((c) => !allowed[t.level as "A1" | "A2"].has(c));
        return above.length === 0 ? [] : [problem("NO-26", t, `${above.join("")} stands above the kanji of ${t.level}`)];
      });
    },
  },
  {
    id: "NO-29",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) => {
        if (t.part === "title" || t.part === "subtopic title" || t.variety === "es-ES") return [];
        const found = wordsIn(spanishOutside(t, "es-ES"), lint.lexicon.words.get("es")?.vosotros);
        return found.map((w) => problem("NO-29", t, `${w} belongs to es-ES and carries it`));
      }),
  },
  {
    id: "NO-31",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) => {
        if (t.part === "title" || t.part === "subtopic title" || t.variety === "es-419") return [];
        const found = wordsIn(spanishOutside(t, "es-419"), lint.lexicon.words.get("es")?.voseo);
        return found.map((w) => problem("NO-31", t, `${w} stands in an element carrying es-419`));
      }),
  },
  {
    id: "NO-33",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.variety !== "fr-CA" && ipaOutside(t, "fr-CA").some((ipa) => /tsy|dzi/.test(ipa)))
        .map((t) => problem("NO-33", t, "the affricates of tu and dis carry fr-CA")),
  },
  {
    id: "NO-34",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) => {
        const varieties = varietyOf(lint, t);
        if (varieties.length === 0) return [];
        const swaps = swapsOf(t.runs).filter(
          (s) => varieties.some((v) => !s.some((m) => m.attribute === v)) || s.length !== varieties.length,
        );
        const slashed = t.kind !== "course" && /\s\/\s/.test(plain(t.runs));
        return [
          ...swaps.map(() => problem("NO-34", t, `a swap holds the form of each variety, ${varieties.join(" and ")}, side by side`)),
          ...(slashed ? [problem("NO-34", t, "each variety's form stands in its own variant, with no / between them")] : []),
        ];
      }),
  },
  {
    id: "NO-51",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) =>
        swapsOf(t.runs)
          .filter((s) => new Set(s.map((m) => plain(m.content))).size < s.length)
          .map(() => problem("NO-51", t, "a form both varieties share stays plain text")),
      ),
  },
];
