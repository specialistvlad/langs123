// Every text of a course as the linter reads it: each piece of each topic's source and language files, with the
// language it is written in, the variety and the level it holds for, the part of the topic it stands in and the
// kind of block, and its marks parsed. A translation stands where its source sentence stands.
import type { Subtopic } from "../../generated/library-v1.ts";
import type { Course, Topic } from "../library.ts";
import { parseMarks, type Run } from "../marks.ts";
import { type Kind, languagePieces, type Piece, sourcePieces } from "../texts.ts";

type Level = Subtopic["level"];
export type Part = "title" | "definition" | "essence" | "subtopic title" | "block" | "error";

export interface Text {
  topic: Topic;
  file: string;
  id: string;
  kind: Kind;
  part: Part;
  // The language the text is written in: the course's for its own text, an explanation's for the rest.
  language: string;
  variety?: string;
  subtopic?: string;
  block?: string;
  blockType?: string;
  level?: Level;
  // A translation of a source sentence, in a language file.
  translation: boolean;
  // An example, or its translation.
  example: boolean;
  // An item's transcription, written without its ipa mark.
  ipa: boolean;
  text: string;
  runs: Run[];
}

function partsOf(topic: Topic): { part: (p: Piece) => Part; type: Map<string, string>; level: Map<string, Level> } {
  const { data } = topic.source;
  const type = new Map(data.subtopics.flatMap((s) => s.blocks.map((b) => [b.id, b.type] as const)));
  const titles = new Set(data.subtopics.map((s) => s.title.id));
  const errors = new Set([
    ...data.errors.map((e) => e.id),
    ...topic.languages.flatMap((l) => [
      ...(l.data.errors ?? []).map((e) => e.id),
      ...Object.values(l.data.speakers ?? {}).map((s) => s.id),
    ]),
  ]);
  const level = new Map(data.subtopics.map((s) => [s.id, s.level] as const));
  const part = (p: Piece): Part => {
    if (p.id === data.title.id) return "title";
    if (p.id === data.definition.id) return "definition";
    if (p.block === "essence") return "essence";
    if (titles.has(p.id ?? "")) return "subtopic title";
    return errors.has(p.block ?? "") || errors.has(p.id ?? "") ? "error" : "block";
  };
  return { part, type, level };
}

export function textsOf(course: Course): Text[] {
  const source = course.index?.data.source ?? course.course;
  return course.topics.flatMap((topic) => {
    const { part, type, level } = partsOf(topic);
    const own = new Map(topic.languages.flatMap((l) => (l.data.blocks ?? []).map((b) => [b.id, b.type] as const)));
    const ownExamples = new Set(
      topic.languages.flatMap((l) => [
        ...(l.data.blocks ?? []).flatMap((b) => (b.items ?? []).map((i) => i.id)),
        ...(l.data.errors ?? []).flatMap((e) => (typeof e.right === "string" ? [] : [e.right.id])),
      ]),
    );
    const text = (p: Piece, file: string, language: string, translation: boolean, place: Piece = p): Text => {
      const blockType = type.get(place.block ?? "") ?? own.get(place.block ?? "");
      const lvl = level.get(place.subtopic ?? "");
      return {
        topic,
        file,
        id: p.id ?? p.of,
        kind: p.kind,
        part: part(place),
        language: p.kind === "explanation" ? language : course.course,
        ...(place.variety !== undefined && { variety: place.variety }),
        ...(place.subtopic !== undefined && { subtopic: place.subtopic }),
        ...(place.block !== undefined && { block: place.block }),
        ...(blockType !== undefined && { blockType }),
        ...(lvl !== undefined && { level: lvl }),
        translation,
        example: place.kind === "course" || (p.kind === "explanation" && ownExamples.has(p.id ?? "")),
        ipa: p.ipa === true,
        text: p.text,
        runs: parseMarks(p.text).runs,
      };
    };
    const pieces = sourcePieces(topic.source.data);
    const byId = new Map(pieces.filter((p) => p.id !== undefined).map((p) => [p.id, p]));
    return [
      ...pieces.map((p) => text(p, topic.source.file, source, false)),
      ...topic.languages.flatMap((l) =>
        languagePieces(l.data).map((p) => {
          const from = p.id?.split(" + ")[0];
          const translated = l.data.text[p.id ?? ""] !== undefined;
          return text(p, l.file, l.data.language, translated, translated ? (byId.get(from) ?? p) : p);
        }),
      ),
    ];
  });
}
