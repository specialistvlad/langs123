// The layer files of the export (7.4): one small file per topic and explanation language beside the course file,
// <course>/<slug>.<language>.json under the export's folder, holding that language's part of the topic alone, so a
// web page built in one language loads the reader's other languages on top of it when asked; and a topic cut to the
// languages given, what such a page embeds. A page finds a topic's layers by its course, its slug and the keys of its
// minutes, the languages it has.
import type { CourseFile, Explain, LayerFile, Topic as Exported } from "../../generated/export-v1.ts";
import { EXPORT_VERSION } from "./version.ts";

type Translation = string | string[];
type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === "object" && value !== null && !Array.isArray(value);
// The keys of an element with an id that hold a text in each language: a sentence's or an item's text and span, an
// example's translations.
const BY_LANGUAGE = ["text", "span", "tr"];

export const layerPath = (course: string, slug: string, language: string): string => `${course}/${slug}.${language}.json`;

function walk(node: unknown, visit: (n: Node) => void): void {
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit);
    return;
  }
  if (!isNode(node)) return;
  visit(node);
  for (const v of Object.values(node)) walk(v, visit);
}

// One language's part of a topic: each sentence's and item's text and span in it, each example's translation into it,
// its own blocks, errors and speakers, and its reading minutes.
export function layerOf(topic: Exported, course: string, language: Explain): LayerFile {
  const text: Record<string, Translation> = {};
  const span: Record<string, number> = {};
  const tr: Record<string, Translation> = {};
  const { own, ...rest } = topic;
  walk(rest, (n) => {
    const id = n["id"];
    if (typeof id !== "string") return;
    const [t, s, e] = [n["text"], n["span"], n["tr"]];
    if (isNode(t) && t[language] !== undefined) text[id] = t[language] as Translation;
    if (isNode(s) && typeof s[language] === "number") span[id] = s[language];
    if (isNode(e) && e[language] !== undefined) tr[id] = e[language] as Translation;
  });
  return {
    version: EXPORT_VERSION,
    course,
    topic: topic.slug,
    language,
    text,
    ...(Object.keys(span).length > 0 && { span }),
    tr,
    own: own[language] ?? { blocks: [], errors: [], speakers: {} },
    minutes: topic.minutes[language] ?? 1,
  };
}

// Every layer of the course files: one per topic and language it has, with the path it is written at.
export const layersOf = (courses: CourseFile[]): { path: string; data: LayerFile }[] =>
  courses.flatMap((c) =>
    c.topics.flatMap((t) =>
      (Object.keys(t.minutes) as Explain[]).map((language) => ({
        path: layerPath(c.course, t.slug, language),
        data: layerOf(t, c.course, language),
      })),
    ),
  );

// A topic cut to the languages given: each text, span and translation in those languages alone, and their own blocks;
// its minutes stay whole, naming every language it has.
export function topicIn(topic: Exported, languages: string[]): Exported {
  const keep = (map: Node): Node => Object.fromEntries(Object.entries(map).filter(([k]) => languages.includes(k)));
  const cut = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(cut);
    if (!isNode(node)) return node;
    const element = typeof node["id"] === "string";
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [k, element && BY_LANGUAGE.includes(k) && isNode(v) ? keep(v) : cut(v)]),
    );
  };
  const { own, ...rest } = topic;
  return { ...(cut(rest) as Omit<Exported, "own">), own: keep(own) as Exported["own"] };
}
