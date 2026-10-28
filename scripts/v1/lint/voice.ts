// How an explanation sounds: a sentence holds at most 20 words, or 50 characters in Japanese (VO-01); no sentence
// speaks of the guide, the page or the topic (VO-04); and a level code stands in the level field alone (VO-05).
import { plain } from "../marks.ts";
import { type LintRule, problem, textsIn, wordsIn } from "./lint.ts";
import { sentences, wordCount } from "./shape.ts";

const LEVEL = /(?<![\p{L}\p{N}])(?:A0|A1|A2|B1|B2|C1|C2)(?![\p{L}\p{N}])/u;

export const VOICE: LintRule[] = [
  {
    id: "VO-01",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind === "explanation")
        .flatMap((t) =>
          sentences(plain(t.runs)).flatMap((s) => {
            if (t.language === "ja") {
              return s.replace(/\s/g, "").length > 50 ? [problem("VO-01", t, `a sentence runs past 50 characters: ${s}`)] : [];
            }
            return wordCount(s) > 20 ? [problem("VO-01", t, `a sentence runs past 20 words: ${s}`)] : [];
          }),
        ),
  },
  {
    id: "VO-04",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind === "explanation")
        .flatMap((t) => {
          const tour = lint.lexicon.words.get(t.language)?.tour;
          const found = wordsIn(plain(t.runs), [...(tour?.guide ?? []), ...(tour?.page ?? []), ...(tour?.topic ?? [])]);
          return found.map((w) => problem("VO-04", t, `the sentence speaks of the subject, not of "${w}"`));
        }),
  },
  {
    id: "VO-05",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) => {
        const code = LEVEL.exec(plain(t.runs))?.[0];
        return code === undefined ? [] : [problem("VO-05", t, `the level ${code} stands in the level field alone`)];
      }),
  },
];
