// The calibration of the review's questions (12.3, gate 4b check 13). Each question rule's written case is planted into
// a copy of a sample (library/calibration/questions.yaml), and the copy is reviewed as a topic is: the case must be
// found where it stands, and the sound elements the same question reads must hold. An index question's case is
// planted into a copy of a course's index, reviewed as an index is, given today's topics of the course. Faithfulness
// (RV-11) is calibrated on the planted pairs, ten faithful and ten with one mistake per language
// (library/calibration/translations/). tally.ts counts what each model caught and flagged.
import type { CourseIndex, TopicLanguageFile } from "../generated/library-v1.ts";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Library, Topic } from "../v1/library.ts";
import { idsIn } from "../v1/structure.ts";
import { toYaml } from "../v1/yaml.ts";
import { elementText } from "./flags.ts";
import { indexRequest, type TodayTopic } from "./index-request.ts";
import { questionsOf } from "./questions.ts";
import { INSTRUCTIONS, languageRequest, type Request, sourceRequest } from "./request.ts";

// What a case sets on the element of the id given: its text, or the field named, a list where the field holds one;
// null drops the field.
export interface Planting {
  id: string;
  field?: string;
  text: string | string[] | null;
}

export interface Plant {
  rule: string;
  // The sample's topic, or the course whose index the case stands in.
  topic: string;
  // The sample's source, the language file the case stands in, or the course's index.
  file: string;
  at: string;
  set: Planting | Planting[];
}

export interface Pair {
  source: string;
  translation: string;
  faithful: boolean;
  mistake?: string;
}

export interface Planted {
  request: Request;
  // The planted copy of the sample a topic's request reads.
  topic?: Topic;
  plants: Plant[];
  // Each case's ids a finding may name: the element's, those inside it and its block's.
  ids: Map<Plant, string[]>;
  // The text of an element the request shows, by id, in the language's file or the source; for an index, the
  // entry's subject and what it covers.
  text: (language: string | undefined, at: string) => string[];
}

type Node = Record<string, unknown>;
const sets = (p: Plant): Planting[] => (Array.isArray(p.set) ? p.set : [p.set]);

// Sets the element of the id given, at any depth: its text, or the field named, or drops the field.
function plant(node: unknown, set: Planting): boolean {
  if (Array.isArray(node)) return node.some((n) => plant(n, set));
  if (typeof node !== "object" || node === null) return false;
  const n = node as Node;
  if (n["id"] === set.id) {
    const field = set.field ?? "text";
    if (set.text === null) {
      Reflect.deleteProperty(n, field);
    } else {
      n[field] = set.text;
    }
    return true;
  }
  return Object.values(n).some((v) => plant(v, set));
}

function plantIn(topic: Topic, p: Plant): void {
  for (const s of sets(p)) {
    if (p.file === "source") {
      if (!plant(topic.source.data, s)) throw new Error(`${p.rule}: ${p.topic} holds no ${s.id}`);
      continue;
    }
    let file = topic.languages.find((l) => l.data.language === p.file)?.data;
    if (file === undefined) {
      file = { language: p.file as TopicLanguageFile["language"], nativeReview: false, text: {} };
      topic.languages.push({ file: `${p.file}.yaml`, data: file });
    }
    if (s.text !== null && (Object.hasOwn(file.text, s.id) || !plant([file.blocks, file.errors], s))) file.text[s.id] = s.text;
  }
}

// The node of the id given, at any depth.
function nodeOf(node: unknown, id: string): unknown {
  if (Array.isArray(node)) return node.map((n) => nodeOf(n, id)).find((n) => n !== undefined);
  if (typeof node !== "object" || node === null) return undefined;
  return (node as Node)["id"] === id
    ? node
    : Object.values(node)
        .map((v) => nodeOf(v, id))
        .find((n) => n !== undefined);
}

// The ids a finding may name for a case: the element's, those inside it, and the block it stands in.
function idsOf(topic: Topic, p: Plant): string[] {
  const file = topic.languages.find((l) => l.data.language === p.file)?.data;
  const where = [topic.source.data, file?.blocks, file?.errors];
  const blocks = [
    ...topic.source.data.subtopics.flatMap((s) => s.blocks),
    ...(file?.blocks ?? []),
    ...topic.source.data.errors,
    ...(file?.errors ?? []),
  ];
  const block = blocks.find((b) => b.id !== p.at && idsIn(b).includes(p.at))?.id;
  return [...new Set([p.at, ...idsIn(nodeOf(where, p.at)), ...(block === undefined ? [] : [block])])];
}

// The subject and the covers of an index entry, as the index request shows them.
export function entryText(index: CourseIndex, at: string): string[] {
  const entry = index.sections.flatMap((s) => s.topics).find((e) => e.id === at);
  return entry === undefined ? [] : [entry.subject, ...entry.covers];
}

// The requests of the planted copies of the samples: one per file a case stands in, and one per course's index a
// case is planted in, given today's topics of each course.
export function plantedRequests(library: Library, catalog: Catalog, plants: Plant[], today: Record<string, TodayTopic[]> = {}): Planted[] {
  const out: Planted[] = [];
  for (const course of library.courses) {
    for (const original of course.topics) {
      const own = plants.filter((p) => p.topic === original.source.data.id);
      if (own.length === 0) continue;
      const topic: Topic = structuredClone(original);
      for (const p of own) plantIn(topic, p);
      const copy: Course = { ...course, topics: course.topics.map((t) => (t === original ? topic : t)) };
      for (const file of [...new Set(own.map((p) => p.file))]) {
        const plantsHere = own.filter((p) => p.file === file);
        const language = topic.languages.find((l) => l.data.language === file)?.data;
        out.push({
          request: language === undefined ? sourceRequest(topic, copy, catalog) : languageRequest(topic, copy, language, catalog),
          topic,
          plants: plantsHere,
          ids: new Map(plantsHere.map((p) => [p, idsOf(topic, p)])),
          text: (l, at) => elementText(topic, l, at),
        });
      }
    }
    const ofIndex = plants.filter((p) => p.file === "index" && p.topic === course.course);
    if (ofIndex.length === 0) continue;
    if (course.index === undefined) throw new Error(`${ofIndex[0]?.rule ?? ""}: ${course.course} has no index`);
    const index = structuredClone(course.index);
    for (const p of ofIndex) {
      for (const s of sets(p)) {
        if (!plant(index.data, s)) throw new Error(`${p.rule}: the index of ${p.topic} holds no ${s.id}`);
      }
    }
    out.push({
      request: indexRequest({ ...course, index }, catalog, today[course.course] ?? []),
      plants: ofIndex,
      ids: new Map(ofIndex.map((p) => [p, [p.at]])),
      text: (_, at) => entryText(index.data, at),
    });
  }
  return out;
}

// A request of RV-11 over one language's planted pairs, each by its id, p1 onward.
export function pairsRequest(language: string, pairs: Pair[], catalog: Catalog): Request {
  const question = questionsOf(catalog, "language").find((q) => q.rule === "RV-11");
  const ids = pairs.map((_, n) => `p${String(n + 1)}`);
  const text: Record<string, { source: string; translation: string }> = Object.fromEntries(
    pairs.map((p, n) => [`p${String(n + 1)}`, { source: p.source, translation: p.translation }]),
  );
  const prompt = [
    `# Calibration: ${pairs.length} sentences translated into ${language}`,
    "",
    "## Questions",
    `- RV-11 [sentence], asked of ${ids.join(", ")}: ${question?.text ?? ""} The source of each is its \`source\`.`,
    "",
    "## The pairs",
    "```yaml",
    toYaml(text).trimEnd(),
    "```",
  ].join("\n");
  return {
    kind: "language",
    topic: "calibration",
    language,
    system: INSTRUCTIONS,
    prompt,
    asked: { "RV-11": pairs.length },
    pending: [],
    inputs: {},
  };
}
