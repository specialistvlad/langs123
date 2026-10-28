// A topic's review (12.2 to 12.5): its source request and one request per language file, each run in its own
// Claude Code session. The source request runs twice; a language request runs once, and again where the first run
// finds something or a one-in-ten draw of the clean ones falls on it. Where two runs answer, a finding both report
// stands and a finding one reports is disputed; a single run's findings stand. Every run is kept. A request runs on
// the policy's model, or on its stronger model where it asks a rule the default misses (12.3).
import { createHash } from "node:crypto";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Topic } from "../v1/library.ts";
import { languageRequest, type Request, sourceRequest } from "./request.ts";
import type { Finding, Runner, Session } from "./run.ts";

export interface RequestReview {
  request: Request;
  runs: Session[];
  standing: Finding[];
  disputed: Finding[];
}

export interface TopicReview {
  topic: string;
  date: string;
  requests: RequestReview[];
}

export interface Policy {
  model: string;
  // The model of the requests asking any of its rules.
  stronger?: { model: string; rules: string[] };
  date: string;
  // How many sessions run at once.
  sessions?: number;
}

// Whether the one-in-ten draw of clean language requests falls on this one: a hash of the topic, the language and
// the date, so the draw can be made again.
export const drawn = (topic: string, language: string, date: string): boolean =>
  Number.parseInt(createHash("sha256").update(`${topic} ${language} ${date}`).digest("hex").slice(0, 8), 16) % 10 === 0;

const key = (f: Finding): string => `${f.rule} ${f.at}`;

export function verdicts(runs: Session[]): Pick<RequestReview, "standing" | "disputed"> {
  const [first, second] = runs;
  if (second === undefined) return { standing: first?.findings ?? [], disputed: [] };
  const a = new Set(first?.findings.map(key));
  const b = new Set(second.findings.map(key));
  return {
    standing: (first?.findings ?? []).filter((f) => b.has(key(f))),
    disputed: [...(first?.findings ?? []).filter((f) => !b.has(key(f))), ...second.findings.filter((f) => !a.has(key(f)))],
  };
}

export const modelOf = (request: Request, policy: Policy): string =>
  policy.stronger?.rules.some((r) => request.asked[r] !== undefined) === true ? policy.stronger.model : policy.model;

async function runRequest(request: Request, runner: Runner, policy: Policy): Promise<RequestReview> {
  const model = modelOf(request, policy);
  const first = await runner(request, model);
  const again = request.kind === "source" || first.findings.length > 0 || drawn(request.topic, request.language ?? "", policy.date);
  const runs = again ? [first, await runner(request, model)] : [first];
  return { request, runs, ...verdicts(runs) };
}

// Runs the tasks given, at most n at once, and gives their results in order.
async function pooled<T>(tasks: (() => Promise<T>)[], n: number): Promise<T[]> {
  const results: T[] = [];
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      const at = next++;
      results[at] = await (tasks[at] as () => Promise<T>)();
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
  return results;
}

export const requestsOf = (topic: Topic, course: Course, catalog: Catalog): Request[] => [
  sourceRequest(topic, course, catalog),
  ...topic.languages.map((l) => languageRequest(topic, course, l.data, catalog)),
];

export async function reviewTopic(topic: Topic, course: Course, catalog: Catalog, runner: Runner, policy: Policy): Promise<TopicReview> {
  const requests = requestsOf(topic, course, catalog).map((r) => () => runRequest(r, runner, policy));
  return { topic: topic.source.data.id, date: policy.date, requests: await pooled(requests, policy.sessions ?? 4) };
}
