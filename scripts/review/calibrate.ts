// The calibration of the review's questions (12.3, gate 4b check 13). Each question rule's written case is planted into
// a copy of a sample (library/calibration/questions.yaml), and the copy is reviewed as a topic is: the case must be
// found where it stands, and the sound elements the same question reads must hold. Faithfulness (RV-11) is
// calibrated on the planted pairs, ten faithful and ten with one mistake per language
// (library/calibration/translations/). tally.ts counts what each model caught and flagged.
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Library, Topic } from "../v1/library.ts";
import { idsIn } from "../v1/structure.ts";
import { toYaml } from "../v1/yaml.ts";
import { questionsOf } from "./questions.ts";
import { INSTRUCTIONS, languageRequest, type Request, sourceRequest } from "./request.ts";

export interface Plant {
  rule: string;
  topic: string;
  // The sample's source, or the language file the case stands in.
  file: string;
  at: string;
  set: { id: string; field?: string; text: string };
}

export interface Pair {
  source: string;
  translation: string;
  faithful: boolean;
  mistake?: string;
}

export interface Planted {
  request: Request;
  plants: Plant[];
  // Each case's ids a finding may name: the element's, those inside it and its block's.
  ids: Map<Plant, string[]>;
}

type Node = Record<string, unknown>;

// Sets the text of the element of the id given, at any depth: its text, or the field named.
function plant(node: unknown, set: Plant["set"]): boolean {
  if (Array.isArray(node)) return node.some((n) => plant(n, set));
  if (typeof node !== "object" || node === null) return false;
  const n = node as Node;
  if (n["id"] === set.id) {
    n[set.field ?? "text"] = set.text;
    return true;
  }
  return Object.values(n).some((v) => plant(v, set));
}

function plantIn(topic: Topic, p: Plant): void {
  if (p.file === "source") {
    if (!plant(topic.source.data, p.set)) throw new Error(`${p.rule}: ${p.topic} holds no ${p.set.id}`);
    return;
  }
  let file = topic.languages.find((l) => l.data.language === p.file)?.data;
  if (file === undefined) {
    file = { language: p.file as TopicLanguageFile["language"], nativeReview: false, text: {} };
    topic.languages.push({ file: `${p.file}.yaml`, data: file });
  }
  if (Object.hasOwn(file.text, p.set.id) || !plant([file.blocks, file.errors], p.set)) file.text[p.set.id] = p.set.text;
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

// The requests of the planted copies of the samples: one per file a case stands in.
export function plantedRequests(library: Library, catalog: Catalog, plants: Plant[]): Planted[] {
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
          plants: plantsHere,
          ids: new Map(plantsHere.map((p) => [p, idsOf(topic, p)])),
        });
      }
    }
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
  return { kind: "language", topic: "calibration", language, system: INSTRUCTIONS, prompt, asked: { "RV-11": pairs.length }, pending: [] };
}
