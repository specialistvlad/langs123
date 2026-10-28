// One topic as a course file carries it: its head, its essence with each line's level, its picture, its numbered
// subtopics with their blocks, its errors with the level of the subtopic each belongs to, each language's own text,
// its planned levels and its reading minutes in each language.
import type { Block, CommonError, Item, Own, Topic as Exported } from "../../generated/export-v1.ts";
import type { Block as SourceBlock, EssenceLine, ListItem, TopicLanguageFile } from "../../generated/library-v1.ts";
import { LEVELS } from "../../lib.ts";
import type { Topic } from "../library.ts";
import { minutesOf } from "./minutes.ts";
import { layerOf, Texts } from "./text.ts";

type Level = (typeof LEVELS)[number];

function item(i: EssenceLine | ListItem, texts: Texts, level?: Level): Item {
  return {
    id: i.id,
    ...(i.form !== undefined && { form: i.form }),
    ...(i.ipa !== undefined && { ipa: i.ipa }),
    ...(i.text !== undefined && { text: texts.of(i.id, i.text) }),
    ...(i.ex !== undefined && { ex: texts.example(i.ex) }),
    ...(i.variety !== undefined && { variety: i.variety }),
    ...("to" in i && { to: i.to }),
    ...(level !== undefined && { level }),
  };
}

function block(b: SourceBlock, texts: Texts): Block {
  const head = { id: b.id, ...(b.variety !== undefined && { variety: b.variety }) };
  switch (b.type) {
    case "fact":
    case "why":
      return { ...head, type: b.type, text: b.text.map((s) => texts.sentence(s)) };
    case "example":
      return { ...head, type: "example", items: b.items.map((e) => texts.example(e)) };
    case "list":
      return { ...head, type: "list", items: b.items.map((i) => item(i, texts)) };
    case "table":
      return {
        ...head,
        type: "table",
        axes: b.axes,
        columns: b.columns.map((c) => ({ id: c.id, key: c.key, text: texts.of(c.id, c.text) })),
        rows: b.rows.map((r) => ({
          id: r.id,
          features: r.features as Record<string, string | number>,
          cells: Object.fromEntries(
            Object.entries(r.cells).map(([k, c]) => [k, typeof c === "object" && !Array.isArray(c) ? texts.sentence(c) : c]),
          ),
        })),
      };
  }
}

function own(file: TopicLanguageFile, levelOf: (subtopic: string) => Level): Own {
  return {
    blocks: file.blocks ?? [],
    errors: (file.errors ?? []).map((e) => ({ ...e, level: levelOf(e.in) })),
    speakers: file.speakers ?? {},
  };
}

export function exportTopic(topic: Topic, source: string, varieties: string[]): Exported {
  const { data } = topic.source;
  const texts = new Texts(
    source,
    topic.course,
    topic.languages.map((l) => layerOf(l.data)),
  );
  const levels = new Map(data.subtopics.map((s) => [s.id, s.level]));
  const levelOf = (subtopic: string): Level => levels.get(subtopic) ?? "A0";
  const error = (e: (typeof data.errors)[number]): CommonError => ({
    id: e.id,
    in: e.in,
    level: levelOf(e.in),
    wrong: e.wrong,
    right: typeof e.right === "string" ? e.right : texts.example(e.right),
    rule: texts.sentence(e.rule),
    speakers: Object.fromEntries(Object.entries(e.speakers).map(([l, s]) => [l, texts.sentence(s)])),
  });
  return {
    id: data.id,
    slug: topic.slug,
    status: data.status,
    title: texts.sentence(data.title),
    definition: texts.sentence(data.definition),
    levels: LEVELS.filter((l) => [...levels.values()].includes(l)),
    minutes: minutesOf(topic, source, varieties[0]),
    essence: data.essence.map((l) => item(l, texts, levelOf(l.to))),
    ...(data.picture !== undefined && { picture: data.picture }),
    subtopics: data.subtopics.map((s, n) => ({
      id: s.id,
      number: n + 1,
      level: s.level,
      title: texts.sentence(s.title),
      blocks: s.blocks.map((b) => block(b, texts)),
    })),
    errors: data.errors.map(error),
    own: Object.fromEntries(topic.languages.map((l) => [l.data.language, own(l.data, levelOf)])),
  };
}
