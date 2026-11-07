// The sources' text the review reads beside a course (12.2, M6), from a folder the caller names: one folder per course,
// one file per source with the passages it took facts from, each naming the index entries it fed, and the vocabulary
// of each level. The pipeline reads the folder for its requests alone, so the library carries the sources' facts and
// none of their text (3.2). A topic's request carries the passages for it under the rules their file is for, the
// vocabulary to the topic's highest level and, from the index alone, the steps before the topic; an index's request
// carries the passages each entry was drawn from. A rule whose input is absent stays pending, the input named.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { CourseIndex } from "../generated/library-v1.ts";
import { LEVELS } from "../lib.ts";

export interface Passage {
  id: string;
  // Where the passage stands in its source: a section, a page or an entry.
  ref: string;
  // The index entries it fed, by slug.
  topics: string[];
  text?: string;
  // A reference list, one entry per item (IX-14).
  items?: string[];
}

export interface SourceFile {
  id: string;
  name: string;
  licence: string;
  url: string;
  // The question rules the file serves: IX-11, IX-14, NO-04, NO-07.
  for: string[];
  passages: Passage[];
}

export interface Vocabulary {
  // The source the words come from, or the sources in the order of the levels they cover.
  source: string | string[];
  levels: Partial<Record<string, string[]>>;
}

// The level to which SH-09 and VO-03 are asked with each level's vocabulary (the lead, 6 November): above it the lists
// outgrow a request, and the elements stay unasked until a program check looks their words up.
export const VOCABULARY_TO = "B1";

export interface CourseSources {
  course: string;
  files: SourceFile[];
  vocabulary?: Vocabulary;
}

type Entry = CourseIndex["sections"][number]["topics"][number];
type Step = Pick<Entry, "id" | "subject" | "covers">;
type Node = Record<string, unknown>;

const FILE_KEYS = ["id", "name", "licence", "url", "for", "passages"];
const PASSAGE_KEYS = ["id", "ref", "topics"];

function checked(file: string, data: unknown): SourceFile {
  const node = (data ?? {}) as Node;
  const missing = FILE_KEYS.filter((k) => node[k] === undefined);
  if (missing.length > 0) throw new Error(`${file} lacks ${missing.join(", ")}`);
  for (const p of (node["passages"] as Node[] | undefined) ?? []) {
    const lacks = PASSAGE_KEYS.filter((k) => p[k] === undefined);
    if (lacks.length > 0 || (p["text"] === undefined && p["items"] === undefined)) {
      const id = typeof p["id"] === "string" ? p["id"] : "?";
      throw new Error(`${file}: the passage ${id} lacks ${[...lacks, ...(lacks.length === 0 ? ["text or items"] : [])].join(", ")}`);
    }
  }
  return node as unknown as SourceFile;
}

// The sources of a course under the folder: nothing where there is no folder, or none for the course.
export async function readSources(folder: string | undefined, course: string): Promise<CourseSources | undefined> {
  if (folder === undefined) return undefined;
  const dir = join(folder, course);
  let names: string[];
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith(".yaml")).sort();
  } catch {
    return undefined;
  }
  const sources: CourseSources = { course, files: [] };
  for (const name of names) {
    const data: unknown = Bun.YAML.parse(await Bun.file(join(dir, name)).text());
    if (name === "vocabulary.yaml") {
      const levels = (data as Node | null)?.["levels"];
      if (typeof levels !== "object" || levels === null) throw new Error(`${join(dir, name)} lacks levels`);
      sources.vocabulary = data as Vocabulary;
    } else {
      sources.files.push(checked(join(dir, name), data));
    }
  }
  return sources;
}

// The passages of the files for a rule: a reference list's items for IX-14, a passage's text for the other rules.
const forRule = (sources: CourseSources | undefined, rule: string): { source: string; passage: Passage }[] =>
  (sources?.files ?? [])
    .filter((f) => f.for.includes(rule))
    .flatMap((f) =>
      f.passages
        .filter((p) => (rule === "IX-14" ? p.items !== undefined : p.text !== undefined))
        .map((passage) => ({ source: f.id, passage })),
    );

// The passages a topic's request carries under a rule: those for the rule that name the topic.
export const passagesFor = (sources: CourseSources | undefined, rule: string, slug: string): { source: string; passage: Passage }[] =>
  forRule(sources, rule).filter((p) => p.passage.topics.includes(slug));

// The vocabulary of each level to the one given, VOCABULARY_TO at the most, where the file holds every level to it.
export function vocabularyTo(sources: CourseSources | undefined, level: string): [string, string[]][] | undefined {
  const levels = sources?.vocabulary?.levels;
  if (levels === undefined) return undefined;
  const to = Math.min(LEVELS.indexOf(level as (typeof LEVELS)[number]), LEVELS.indexOf(VOCABULARY_TO));
  const lists = LEVELS.slice(0, to + 1).map((l): [string, string[]] => [l, levels[l] ?? []]);
  return lists.length > 0 && lists.every(([, words]) => words.length > 0) ? lists : undefined;
}

// The steps before a topic in the index's study path (FT-08): the entries placed at a lower level, and those placed
// before it at its own first level; nothing where the index does not place the topic.
export function stepsBefore(index: CourseIndex | undefined, slug: string): Step[] | undefined {
  const entries = index?.sections.flatMap((s) => s.topics) ?? [];
  const own = entries.find((e) => e.id === slug);
  const first = LEVELS.find((l) => own?.path[l] !== undefined);
  if (own === undefined || first === undefined) return undefined;
  const rank = LEVELS.indexOf(first);
  const at = own.path[first] ?? 0;
  const before = (e: Entry): boolean =>
    LEVELS.some((l, n) => e.path[l] !== undefined && (n < rank || (n === rank && (e.path[l] ?? 0) < at)));
  return entries.filter((e) => e.id !== slug && before(e)).map((e) => ({ id: e.id, subject: e.subject, covers: e.covers }));
}

const passageLines = (rule: string, found: { source: string; passage: Passage }[], what: string): string[] =>
  found.map(
    ({ source, passage }) =>
      `- ${rule}, ${what} from ${source} (${passage.ref}): ${passage.items === undefined ? (passage.text ?? "") : passage.items.join("; ")}`,
  );

// The sources part of a topic's request, and the rules it gives their input: the passages for the topic under NO-04,
// NO-07 and IX-14, the vocabulary to the topic's highest level for SH-09 and VO-03, and the steps before the topic
// for FT-08.
export function topicSources(
  sources: CourseSources | undefined,
  index: CourseIndex | undefined,
  slug: string,
  highest: string,
): { lines: string[]; given: Set<string>; notes: string[] } {
  const given = new Set<string>();
  const lines: string[] = [];
  const notes: string[] = [];
  for (const rule of ["NO-04", "NO-07", "IX-14"]) {
    const found = passagesFor(sources, rule, slug);
    if (found.length === 0) continue;
    given.add(rule);
    lines.push(...passageLines(rule, found, rule === "IX-14" ? "the reference list ({list})" : "the entry ({extract})"));
  }
  const vocabulary = vocabularyTo(sources, highest);
  if (vocabulary !== undefined) {
    given.add("SH-09").add("VO-03");
    const from = [sources?.vocabulary?.source ?? []].flat().join(", ");
    lines.push(
      `- SH-09 and VO-03, the vocabulary of each level ({level}) to ${VOCABULARY_TO}, from ${from}, each word at the level it is first learned:`,
      ...vocabulary.map(([level, words]) => `  - ${level}: ${words.join(", ")}`),
    );
    if (LEVELS.indexOf(highest as (typeof LEVELS)[number]) > LEVELS.indexOf(VOCABULARY_TO)) {
      notes.push(`SH-09 and VO-03 are asked of the elements at ${VOCABULARY_TO} or below; those above it stay unasked.`);
    }
  }
  const steps = stepsBefore(index, slug);
  if (steps !== undefined) {
    given.add("FT-08");
    lines.push(
      `- FT-08, the steps before this topic ({list}), each with its subject and what it covers: ${steps.length === 0 ? "none, this is the first" : ""}`,
      ...steps.map((s) => `  - ${s.id}: ${s.subject}; ${s.covers.join(", ")}`),
    );
  }
  return { lines: lines.length === 0 ? [] : ["", "## Sources", ...lines], given, notes };
}

// The sources part of an index's request: the passages each entry was drawn from, for IX-11, and the entries they name.
export function indexSources(sources: CourseSources | undefined): { lines: string[]; given: Set<string>; sourced: Set<string> } {
  const found = forRule(sources, "IX-11");
  const sourced = new Set(found.flatMap((p) => p.passage.topics));
  if (found.length === 0) return { lines: [], given: new Set(), sourced };
  return {
    lines: [
      "",
      "## Sources",
      "- IX-11, the source passages ({passage}), each with the entries it fed:",
      ...found.map(({ source, passage }) => `  - ${source} (${passage.ref}), for ${passage.topics.join(", ")}: ${passage.text ?? ""}`),
    ],
    given: new Set(["IX-11"]),
    sourced,
  };
}
