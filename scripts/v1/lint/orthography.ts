// How each language writes: Spanish opens questions and exclamations (NO-05); Ukrainian, French, Italian and Turkish
// write the apostrophe as ’ (NO-08, NO-15, NO-46) and English as ' (NO-47); French quotes in « » with no-break
// spaces (NO-16, NO-17); German and Polish quote „ “ and „ ” (NO-52, NO-54); Japanese runs its script together
// (NO-19), punctuates with 。 and 、 (NO-20) and gives no readings in its explanations (NO-57); an ellipsis is one
// character set close (NO-48); and each language's spelling list holds (NO-01, NO-52, NO-53, NO-56), its proper
// names taking ’ before a suffix (NO-55). A text's terms and phrases in other languages are left out of it.
import { type LintRule, ownWords, ownWordsOutside, problem, textsIn, wordsIn } from "./lint.ts";
import { sentences } from "./shape.ts";
import type { Text } from "./texts.ts";

const JAPANESE = "\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Han}ー々";
const STRAIGHT = /\p{L}['ʼ]\p{L}/u;

// A rule that names each text of its languages whose own words match a pattern.
const pattern = (id: string, test: RegExp | ((text: string, t: Text) => boolean), message: string, kinds?: Text["kind"][]): LintRule => ({
  id,
  check: (lint, scope) =>
    textsIn(lint, scope)
      .filter((t) => kinds?.includes(t.kind) ?? true)
      .filter((t) => (typeof test === "function" ? test(ownWords(t), t) : test.test(ownWords(t))))
      .map((t) => problem(id, t, message)),
});

const opened = (text: string, close: string, open: string): boolean =>
  sentences(text).every((s) => s.split(close).length - 1 <= s.split(open).length - 1);
// A rule that names each wrong spelling of the language's list, with its right form; English's US spellings may
// stand inside an en-US variant.
const spelling = (id: string): LintRule => ({
  id,
  check: (lint, scope) =>
    textsIn(lint, scope).flatMap((t) => {
      const list = lint.lexicon.words.get(t.language)?.spellings ?? [];
      const found = wordsIn(
        ownWordsOutside(t, "en-US"),
        list.map((s) => s.wrong),
      );
      return found.map((w) => problem(id, t, `"${w}" is spelled ${list.find((s) => s.wrong === w)?.right ?? ""}`));
    }),
});

export const ORTHOGRAPHY: LintRule[] = [
  pattern("NO-05", (text) => !(opened(text, "?", "¿") && opened(text, "!", "¡")), "a Spanish question opens with ¿, an exclamation with ¡"),
  pattern("NO-08", STRAIGHT, "Ukrainian writes the apostrophe as ’"),
  pattern("NO-15", STRAIGHT, "French writes the apostrophe as ’"),
  pattern("NO-46", STRAIGHT, "the apostrophe is ’"),
  pattern("NO-47", /\p{L}’\p{L}/u, "English writes the apostrophe as '"),
  pattern("NO-16", /"|«(?!\u00a0)|(?<!\u00a0)»/u, "French quotes in « », a no-break space inside each guillemet"),
  pattern("NO-17", /(?<![\u00a0\d])[:;?!](?!\/\/)|(?<=\d)[;?!]/u, "French sets a no-break space before : ; ? !"),
  pattern("NO-52", /["”]/u, "German quotes in „ “"),
  pattern("NO-54", /["“]/u, "Polish quotes in „ ”"),
  pattern("NO-19", new RegExp(`[${JAPANESE}] +[${JAPANESE}]`, "u"), "Japanese runs its words together, with no space"),
  pattern("NO-20", new RegExp(`[${JAPANESE}][.,]`, "u"), "Japanese ends a sentence with 。 and parts clauses with 、"),
  pattern("NO-57", /\p{Script=Han}[（(][\p{Script=Hiragana}]+[）)]/u, "a Japanese explanation writes kanji with no reading", [
    "explanation",
  ]),
  pattern("NO-48", /\.\.\.|\s…/u, "an ellipsis is the one character …, set close to the word before it"),
  spelling("NO-01"),
  spelling("NO-52"),
  spelling("NO-53"),
  spelling("NO-56"),
  {
    id: "NO-55",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) => {
        const names = lint.lexicon.words.get(t.language)?.names ?? [];
        return names
          .filter((n) => new RegExp(`${n}\\p{Ll}`, "u").test(ownWords(t)))
          .map((n) => problem("NO-55", t, `${n} takes ’ before its suffix`));
      }),
  },
];
