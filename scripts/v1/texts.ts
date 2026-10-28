// The text of a topic's source file, piece by piece, in reading order: each explanation sentence and each example
// with the id its translations take, and each form, which stays untranslated. A piece names the part it stands
// in (its subtopic, or the head and the errors) and the variety it holds for, so every check reads the text one way.
import type { Block, Cell, CommonError, EssenceLine, ListItem, Sentence, TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";

// An explanation in the source language, a sentence or a word in the course language, or a form.
export type Kind = "explanation" | "course" | "form";

export interface Piece {
  kind: Kind;
  text: string;
  // The id its translations take; a form has none.
  id?: string;
  // The id of the element it belongs to, for a form.
  of: string;
  // The subtopic it stands in, or the subtopic an essence line opens and an error belongs to.
  subtopic?: string;
  // The block it stands in.
  block?: string;
  variety?: string;
  // An item's transcription, written without its ipa mark.
  ipa?: true;
}

type Place = Pick<Piece, "subtopic" | "block" | "variety">;

const sentence = (s: Sentence, place: Place): Piece => ({ kind: "explanation", text: s.text, id: s.id, of: s.id, ...place });
const form = (text: string, of: string, place: Place): Piece => ({ kind: "form", text, of, ...place });
const withVariety = (place: Place, variety: string | undefined): Place => (variety === undefined ? place : { ...place, variety });

function item(i: EssenceLine | ListItem, place: Place): Piece[] {
  const here = withVariety(place, i.variety);
  const forms = i.form === undefined ? [] : Array.isArray(i.form) ? i.form : [i.form];
  return [
    ...forms.map((f) => form(f, i.id, here)),
    ...(i.ipa === undefined ? [] : [{ ...form(i.ipa, i.id, here), ipa: true as const }]),
    ...(i.text === undefined ? [] : [sentence({ id: i.id, text: i.text }, here)]),
    ...(i.ex === undefined
      ? []
      : [{ kind: "course" as const, text: i.ex.text, id: i.ex.id, of: i.ex.id, ...withVariety(here, i.ex.variety) }]),
  ];
}

function cell(c: Cell, of: string, place: Place): Piece[] {
  if (typeof c === "string") return [form(c, of, place)];
  if (!Array.isArray(c)) return [sentence(c, place)];
  return c.map((f) => (typeof f === "string" ? form(f, of, place) : form(f.form, of, withVariety(place, f.variety))));
}

export function blockPieces(b: Block, subtopic: string): Piece[] {
  const place = withVariety({ subtopic, block: b.id }, b.variety);
  switch (b.type) {
    case "fact":
    case "why":
      return b.text.map((s) => sentence(s, place));
    case "example":
      return b.items.map((e) => ({ kind: "course", text: e.text, id: e.id, of: e.id, ...withVariety(place, e.variety) }));
    case "list":
      return b.items.flatMap((i) => item(i, place));
    case "table":
      return [
        ...b.columns.map((c) => sentence({ id: c.id, text: c.text }, place)),
        ...b.rows.flatMap((r) => Object.values(r.cells).flatMap((c) => cell(c, r.id, place))),
      ];
  }
}

function error(e: CommonError): Piece[] {
  const place = { subtopic: e.in, block: e.id };
  const right: Piece =
    typeof e.right === "string"
      ? form(e.right, e.id, place)
      : { kind: "course", text: e.right.text, id: e.right.id, of: e.right.id, ...place };
  return [form(e.wrong, e.id, place), right, sentence(e.rule, place), ...Object.values(e.speakers).map((s) => sentence(s, place))];
}

export const sourcePieces = (topic: TopicSource): Piece[] => [
  sentence(topic.title, {}),
  sentence(topic.definition, {}),
  ...topic.essence.flatMap((line) => item(line, { subtopic: line.to, block: "essence" })),
  ...topic.subtopics.flatMap((s) => [sentence(s.title, { subtopic: s.id }), ...s.blocks.flatMap((b) => blockPieces(b, s.id))]),
  ...topic.errors.flatMap(error),
];

// The pieces a language file translates: every explanation sentence and every example, by id.
export const translated = (topic: TopicSource): Piece[] => sourcePieces(topic).filter((p) => p.kind !== "form");

const own = (id: string, text: string, tr: string, place: Place): Piece[] => [
  { kind: "course", text, id, of: id, ...place },
  { kind: "explanation", text: tr, id, of: id, ...place },
];

// The text of a language file, in its language but for its own examples' course text and its own errors' forms:
// each translation under the key it translates, then its own blocks, errors and speakers' reasons.
export function languagePieces(file: TopicLanguageFile): Piece[] {
  const translations = Object.entries(file.text).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value]).map((text): Piece => ({ kind: "explanation", text, id: key, of: key })),
  );
  const blocks = (file.blocks ?? []).flatMap((b) => {
    const place = withVariety({ subtopic: b.in, block: b.id }, b.variety);
    return [...(b.text ?? []).map((s) => sentence(s, place)), ...(b.items ?? []).flatMap((e) => own(e.id, e.text, e.tr, place))];
  });
  const errors = (file.errors ?? []).flatMap((e) => {
    const place = { subtopic: e.in, block: e.id };
    const right = typeof e.right === "string" ? [form(e.right, e.id, place)] : own(e.right.id, e.right.text, e.right.tr, place);
    return [form(e.wrong, e.id, place), ...right, sentence(e.rule, place), ...Object.values(e.speakers).map((s) => sentence(s, place))];
  });
  return [...translations, ...blocks, ...errors, ...Object.values(file.speakers ?? {}).map((s) => sentence(s, {}))];
}
