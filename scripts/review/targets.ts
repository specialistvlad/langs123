// The elements of a topic each question's target names, by id: in its source file, or in one language file beside
// it. A request counts the questions it asks from them, and a finding names one of them. The entries of an index are
// index-request.ts's.
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import type { Topic } from "../v1/library.ts";
import { idsIn } from "../v1/structure.ts";
import { type Piece, sourcePieces } from "../v1/texts.ts";
import type { Target } from "./questions.ts";

const unique = (ids: (string | undefined)[]): string[] => [...new Set(ids.filter((id) => id !== undefined))];

function inSource(topic: Topic, target: Target): string[] {
  const { data } = topic.source;
  const pieces = sourcePieces(data);
  const blocks = data.subtopics.flatMap((s) => s.blocks);
  const of = (test: (p: Piece) => boolean): string[] => unique(pieces.filter(test).map((p) => p.id ?? p.of));
  switch (target) {
    case "definition":
      return [data.definition.id];
    case "opening":
      return [data.title.id, data.definition.id, ...data.essence.map((l) => l.id)];
    case "explanations":
      return of((p) => p.kind === "explanation");
    case "sentences":
      return of((p) => p.id !== undefined);
    case "examples":
      return of((p) => p.kind === "course");
    case "course text":
      return of((p) => p.kind !== "explanation");
    case "essence":
      return ["essence"];
    case "blocks":
      return blocks.map((b) => b.id);
    case "untagged blocks":
      return blocks.filter((b) => b.variety === undefined).map((b) => b.id);
    case "facts":
    case "whys":
    case "lists":
      return blocks.filter((b) => b.type === { facts: "fact", whys: "why", lists: "list" }[target]).map((b) => b.id);
    case "tables":
      return blocks.filter((b) => b.type === "table").map((b) => b.id);
    case "errors":
      return data.errors.map((e) => e.id);
    case "reasons":
      return data.errors.flatMap((e) => Object.values(e.speakers).map((s) => s.id));
    case "translations":
    case "example translations":
    case "own blocks":
    case "own notes":
    case "entries":
    case "practical entries":
    case "new entries":
      return [];
  }
}

function inLanguage(topic: Topic, file: TopicLanguageFile, target: Target): string[] {
  const translated = new Set(Object.keys(file.text).flatMap((k) => k.split(" + ")));
  const source = (t: Target): string[] => inSource(topic, t).filter((id) => translated.has(id));
  const own = file.blocks ?? [];
  const ownSentences = idsIn([own, file.errors, file.speakers]);
  switch (target) {
    case "definition":
    case "opening":
    case "explanations":
      return [...source(target), ...(target === "explanations" ? ownSentences : [])];
    case "sentences":
    case "translations":
      return [...translated, ...(target === "sentences" ? ownSentences : [])];
    case "example translations":
      return source("examples");
    case "facts":
    case "whys":
      return [...inSource(topic, target), ...own.filter((b) => b.type === (target === "facts" ? "fact" : "why")).map((b) => b.id)];
    case "reasons":
      return [
        ...source("reasons"),
        ...(file.errors ?? []).flatMap((e) => Object.values(e.speakers).map((s) => s.id)),
        ...Object.values(file.speakers ?? {}).map((s) => s.id),
      ];
    case "errors":
      return (file.errors ?? []).map((e) => e.id);
    case "own blocks":
      return own.map((b) => b.id);
    case "own notes":
      return own.filter((b) => b.type !== "example").map((b) => b.id);
    case "blocks":
    case "untagged blocks":
    case "course text":
    case "entries":
    case "practical entries":
    case "new entries":
    case "tables":
    case "essence":
    case "examples":
    case "lists":
      return [];
  }
}

export const targetIds = (topic: Topic, target: Target, file?: TopicLanguageFile): string[] =>
  file === undefined ? inSource(topic, target) : inLanguage(topic, file, target);
