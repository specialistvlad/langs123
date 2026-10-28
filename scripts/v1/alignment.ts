// Every explanation language of a topic stays aligned with its source, block by block and sentence by sentence:
// a topic past its draft has a file for each explanation language but the source (LA-01); every translation names a
// source sentence, and every source sentence has one translation, once (LA-06); a join names sentences that follow
// each other in one block (LA-07); a language's own block stands in a subtopic after one of its blocks, and its own
// error and speakers after one of the source's errors (LA-05); a file in the course's own language leaves the
// examples untranslated (FT-07); and every translation records its source sentence's current fingerprint (LA-10).
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import { EXPLAIN_CODES } from "../lib.ts";
import { staleIn } from "./fingerprints.ts";
import type { Topic } from "./library.ts";
import { languageOfFile } from "./load.ts";
import type { Problem } from "./schema.ts";
import { type Piece, translated } from "./texts.ts";

function placeProblems(topic: Topic, file: string, data: TopicLanguageFile): Problem[] {
  const source = topic.source.data;
  const subtopics = new Map(source.subtopics.map((s) => [s.id, s.blocks.map((b) => b.id)]));
  const errors = source.errors.map((e) => e.id);
  const problems: Problem[] = [];
  const add = (id: string, message: string): void => {
    problems.push({ rule: "LA-05", file, id, message });
  };
  for (const b of data.blocks ?? []) {
    const blocks = subtopics.get(b.in);
    if (blocks === undefined) add(b.id, `no subtopic of the source is ${b.in}`);
    else if (!blocks.includes(b.after)) add(b.id, `${b.after} is no block of the subtopic ${b.in}`);
  }
  for (const e of data.errors ?? []) {
    if (!subtopics.has(e.in)) add(e.id, `no subtopic of the source is ${e.in}`);
    if (e.after !== undefined && !errors.includes(e.after)) add(e.id, `${e.after} is no error of the source`);
  }
  for (const error of Object.keys(data.speakers ?? {})) if (!errors.includes(error)) add(error, "no error of the source has this id");
  return problems;
}

function textProblems(expected: Piece[], all: Piece[], file: string, data: TopicLanguageFile): Problem[] {
  const ids = expected.map((p) => p.id ?? "");
  const problems: Problem[] = [];
  const add = (rule: string, id: string, message: string): void => {
    problems.push({ rule, file, id, message });
  };
  const counted = new Map<string, number>();
  for (const key of Object.keys(data.text)) {
    const parts = key.split(" + ");
    for (const id of parts) counted.set(id, (counted.get(id) ?? 0) + 1);
    const unknown = parts.filter((id) => !ids.includes(id));
    for (const id of unknown) {
      const course = all.some((p) => p.id === id);
      add(
        course ? "FT-07" : "LA-06",
        id,
        course ? "an example stands untranslated in the course's own language" : "no sentence of the source has this id",
      );
    }
    if (parts.length > 1 && unknown.length === 0) {
      const at = parts.map((id) => ids.indexOf(id));
      const block = expected[at[0] ?? 0]?.block;
      const follows =
        at.every((n, i) => i === 0 || n === (at[i - 1] ?? 0) + 1) && parts.every((_, i) => expected[at[i] ?? 0]?.block === block);
      if (!follows) add("LA-07", key, "a join names sentences that follow each other in one block");
    }
  }
  for (const id of ids) {
    const n = counted.get(id) ?? 0;
    if (n === 0) add("LA-06", id, "the source sentence has no translation");
    if (n > 1) add("LA-06", id, "the source sentence is translated twice");
  }
  return problems;
}

export function alignmentProblems(topic: Topic, source: string | undefined): Problem[] {
  const problems: Problem[] = [];
  const all = translated(topic.source.data);
  const dir = topic.source.file.replace(/\/source\.yaml$/, "");
  if (topic.source.data.status !== "draft") {
    const present = topic.languages.map((l) => languageOfFile(l.file));
    for (const language of EXPLAIN_CODES.filter((c) => c !== source && !present.includes(c))) {
      problems.push({ rule: "LA-01", file: `${dir}/${language}.yaml`, message: "the topic has no file for this explanation language" });
    }
  }
  for (const { file, data } of topic.languages) {
    const expected = data.language === topic.course ? all.filter((p) => p.kind !== "course") : all;
    problems.push(...placeProblems(topic, file, data), ...textProblems(expected, all, file, data));
    for (const s of staleIn(topic.source.data, data)) problems.push({ rule: "LA-10", file, id: s.id, message: s.message });
  }
  return problems;
}
