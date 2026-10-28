// The calibration of the review's questions (12.3, gate 4b check 13). Each question rule's written case is planted into
// a copy of a sample (library/calibration/questions.yaml), and the copy is reviewed as a topic is: the case must be
// found where it stands, and the sound elements the same question reads must hold. Faithfulness (RV-11) is
// calibrated on the planted pairs, ten faithful and ten with one mistake per language
// (library/calibration/translations/). Each model gives, per question, the planted cases caught and the sound
// elements flagged, against the target the owner sets: 90% caught and at most 10% flagged until then.
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Library, Topic } from "../v1/library.ts";
import { toYaml } from "../v1/yaml.ts";
import { questionsOf } from "./questions.ts";
import { INSTRUCTIONS, languageRequest, type Request, sourceRequest } from "./request.ts";
import type { Session } from "./run.ts";

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
}

export const TARGET = { caught: 0.9, flagged: 0.1 };

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

export interface Tally {
  model: string;
  rule: string;
  planted: number;
  caught: number;
  sound: number;
  flagged: number;
}

// Per rule a request asked: the planted cases the session caught, and the sound elements it flagged.
export function tally(model: string, planted: Planted, session: Session): Tally[] {
  return Object.entries(planted.request.asked).map(([rule, asked]) => {
    const cases = planted.plants.filter((p) => p.rule === rule);
    const found = session.findings.filter((f) => f.rule === rule);
    const caught = cases.filter((p) => found.some((f) => f.at === p.at)).length;
    return {
      model,
      rule,
      planted: cases.length,
      caught,
      sound: asked - cases.length,
      flagged: found.filter((f) => !cases.some((p) => p.at === f.at)).length,
    };
  });
}

export function tallyPairs(model: string, pairs: Pair[], session: Session): Tally {
  const flaggedAt = new Set(session.findings.filter((f) => f.rule === "RV-11").map((f) => f.at));
  const at = (n: number): boolean => flaggedAt.has(`p${String(n + 1)}`);
  const planted = pairs.flatMap((p, n) => (p.faithful ? [] : [n]));
  const sound = pairs.flatMap((p, n) => (p.faithful ? [n] : []));
  return {
    model,
    rule: "RV-11",
    planted: planted.length,
    caught: planted.filter(at).length,
    sound: sound.length,
    flagged: sound.filter(at).length,
  };
}

// The tallies summed per model and rule, in the order met.
export function summed(tallies: Tally[]): Tally[] {
  const out = new Map<string, Tally>();
  for (const t of tallies) {
    const k = `${t.model} ${t.rule}`;
    const s = out.get(k);
    out.set(
      k,
      s === undefined
        ? { ...t }
        : { ...s, planted: s.planted + t.planted, caught: s.caught + t.caught, sound: s.sound + t.sound, flagged: s.flagged + t.flagged },
    );
  }
  return [...out.values()];
}

export const meets = (t: Tally): boolean =>
  (t.planted === 0 || t.caught / t.planted >= TARGET.caught) && (t.sound === 0 || t.flagged / t.sound <= TARGET.flagged);

const share = (a: number, b: number): string => (b === 0 ? "—" : `${String(a)}/${String(b)} (${String(Math.round((100 * a) / b))}%)`);

export function calibrationReport(tallies: Tally[], date: string): string {
  const rows = summed(tallies);
  const models = [...new Set(rows.map((t) => t.model))];
  return [
    `# Calibration of the review's questions, ${date}`,
    "",
    `Target: ${String(TARGET.caught * 100)}% of planted cases caught and at most ${String(TARGET.flagged * 100)}% of sound elements flagged, until the owner sets each question's rate (12.3). Sound elements are those of the samples the question reads, the owner's labels to come.`,
    ...models.flatMap((m) => [
      "",
      `## ${m}`,
      "",
      "| Rule | Planted caught | Sound flagged | Target |",
      "|---|---|---|---|",
      ...rows
        .filter((t) => t.model === m)
        .map((t) => `| ${t.rule} | ${share(t.caught, t.planted)} | ${share(t.flagged, t.sound)} | ${meets(t) ? "met" : "missed"} |`),
    ]),
    "",
  ].join("\n");
}
