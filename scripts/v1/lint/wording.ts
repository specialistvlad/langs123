// The words of each explanation language: an explanation addresses the reader as its language does, without the
// forms of address its list names (NO-35 to NO-43, NO-58), in its sentences, glosses and reasons, never in an
// example or its translation, where a speaker says them; and where the interface names a topic, as its English
// says, each language names it with its own word, none of the words its list sets aside (NO-45).
import type { Problem } from "../schema.ts";
import type { Scope } from "../scope.ts";
import { type Lint, type LintRule, ownWords, problem, textsIn, wordsIn } from "./lint.ts";

export const ADDRESS = ["NO-35", "NO-36", "NO-37", "NO-38", "NO-40", "NO-41", "NO-42", "NO-43", "NO-58"];

export const WORDING: LintRule[] = [
  ...ADDRESS.map((id): LintRule => ({
    id,
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind === "explanation" && !t.example)
        .flatMap((t) =>
          wordsIn(ownWords(t), lint.lexicon.words.get(t.language)?.address).map((w) =>
            problem(id, t, `the explanation addresses the reader without "${w}"`),
          ),
        ),
  })),
  {
    id: "NO-45",
    check: (lint: Lint, scope: Scope): Problem[] => {
      const en = lint.lexicon.words.get("en");
      const names = [...(en?.topic === undefined ? [] : [en.topic.word]), ...(en?.tour?.topic ?? [])];
      return Object.entries(lint.wording)
        .filter(([, texts]) => wordsIn(texts["en"] ?? "", names).length > 0)
        .flatMap(([key, texts]) =>
          Object.entries(texts).flatMap(([language, text]) => {
            const topic = scope.languages?.includes(language) === false ? undefined : lint.lexicon.words.get(language)?.topic;
            return wordsIn(text, topic?.synonyms).map((w) => ({
              rule: "NO-45",
              file: "languages/interface.yaml",
              id: `${key}.${language}`,
              message: `a topic is ${topic?.word ?? ""}, not "${w}"`,
            }));
          }),
        );
    },
  },
];
