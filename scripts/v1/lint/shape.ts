// The topic's shape: the title names the subject (SH-01), the definition is one sentence (SH-03), the opening
// speaks of the subject (SH-08), every essence line opens a subtopic and every subtopic is opened (SH-12), a
// subtopic gives its fact, then its example, its variety alternatives counting as one fact (SH-16), and holds at
// most one why for each reader (SH-18).
import type { Block } from "../../generated/library-v1.ts";
import type { Topic } from "../library.ts";
import { plain } from "../marks.ts";
import type { Problem } from "../schema.ts";
import { type Lint, type LintRule, problem, textsIn, wordsIn } from "./lint.ts";
import type { Text } from "./texts.ts";

const isJapanese = (t: Text): boolean => t.language === "ja";
// The words of a text: its runs of letters and digits.
export const wordCount = (text: string): number => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
// The sentences of a text: each ends at . ! ? or their Japanese forms, a colon or a semicolon staying inside it.
export const sentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?…][»"”’)]?)\s+|(?<=[。！？])/u)
    .map((s) => s.trim())
    .filter((s) => s !== "");

const topicsOf = (lint: Lint, courses: string[] | undefined): Topic[] =>
  lint.library.courses.filter((c) => courses?.includes(c.course) ?? true).flatMap((c) => c.topics);

// A subtopic's blocks with each run of fact blocks that stand as alternatives, a block of a variety beside
// another, counted as one: a reader reads one of them (SH-16).
function alternativesAsOne(blocks: Block[]): Block[] {
  return blocks.filter((b, n) => {
    const before = blocks[n - 1];
    return !(b.type === "fact" && before?.type === "fact" && (b.variety !== undefined || before.variety !== undefined));
  });
}

// The blocks of a subtopic that a reader of each variety sees, for every variety of the course, or once.
function views(blocks: Block[], varieties: string[]): Block[][] {
  if (varieties.length === 0) return [blocks];
  return varieties.map((v) => blocks.filter((b) => b.variety === undefined || b.variety === v));
}

export const SHAPE: LintRule[] = [
  {
    id: "SH-01",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.part === "title")
        .flatMap((t) => {
          const text = plain(t.runs);
          if (isJapanese(t)) return text.replace(/\s/g, "").length > 12 ? [problem("SH-01", t, "the title runs past 12 characters")] : [];
          return wordCount(text) > 6 ? [problem("SH-01", t, "the title runs past six words")] : [];
        }),
  },
  {
    id: "SH-03",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.part === "definition")
        .flatMap((t) => {
          const text = plain(t.runs);
          const said: string[] = [];
          if (sentences(text).length !== 1) said.push("is one sentence");
          if (text.length > (isJapanese(t) ? 80 : 160)) said.push(`holds at most ${isJapanese(t) ? 80 : 160} characters`);
          if (!text.endsWith(isJapanese(t) ? "。" : ".")) said.push(`ends with ${isJapanese(t) ? "。" : "a full stop"}`);
          const first = /\p{L}/u.exec(text)?.[0] ?? "";
          if (first !== first.toUpperCase()) said.push("starts with a capital letter");
          return said.map((s) => problem("SH-03", t, `the definition ${s}`));
        }),
  },
  {
    id: "SH-08",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => (t.part === "title" || t.part === "definition" || t.part === "essence") && t.kind === "explanation")
        .flatMap((t) => {
          const tour = lint.lexicon.words.get(t.language)?.tour;
          const found = wordsIn(plain(t.runs), [
            ...(tour?.page ?? []),
            ...(tour?.topic ?? []),
            ...(tour?.guide ?? []),
            ...(tour?.course ?? []),
          ]);
          return found.map((w) => problem("SH-08", t, `the opening speaks of the subject, not of "${w}"`));
        }),
  },
  {
    id: "SH-12",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap(({ source: { file, data } }) => {
        const subtopics = data.subtopics.map((s) => s.id);
        const opened = new Set(data.essence.map((l) => l.to));
        return [
          ...data.essence
            .filter((l) => !subtopics.includes(l.to))
            .map((l) => ({ rule: "SH-12", file, id: l.id, message: `no subtopic is ${l.to}` })),
          ...subtopics
            .filter((s) => !opened.has(s))
            .map((id) => ({ rule: "SH-12", file, id, message: "no essence line opens the subtopic" })),
        ];
      }),
  },
  ...(["SH-16", "SH-18"] as const).map((id): LintRule => ({
    id,
    check: (lint, scope) =>
      lint.library.courses
        .filter((c) => scope.courses?.includes(c.course) ?? true)
        .flatMap((c) =>
          c.topics.flatMap(({ source: { file, data } }) =>
            data.subtopics.flatMap((s) => {
              const found = new Set<string>();
              for (const blocks of views(s.blocks, c.index?.data.varieties ?? [])) {
                if (id === "SH-18" && blocks.filter((b) => b.type === "why").length > 1) found.add("holds at most one why");
              }
              if (id === "SH-16") {
                const order = alternativesAsOne(s.blocks);
                if (order[0]?.type !== "fact") found.add("opens with its fact");
                order.forEach((b, n) => {
                  if (b.type === "fact" && !["example", "list", "table"].includes(order[n + 1]?.type ?? "")) {
                    found.add(`gives the example of ${b.id} in the block after it`);
                  }
                });
              }
              return [...found].map((m): Problem => ({ rule: id, file, id: s.id, message: `the subtopic ${m}` }));
            }),
          ),
        ),
  })),
];
