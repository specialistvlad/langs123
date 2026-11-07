// A topic's review (12.2 to 12.5): its source request and one request per language file, each run in its own
// Claude Code session; and a course's index review, its index request. The source and the index requests run twice;
// a language request runs once, and again where the first run finds something or a one-in-ten draw of the clean
// ones falls on it; a request that asks nothing, its every question pending, runs no session. Where two runs answer,
// a finding both report stands and a finding one reports is disputed; a single run's findings stand. Every run is
// kept. Each question runs on the model it was calibrated on (12.3): the rules of the policy's stronger model leave
// each request that asks them for a request of their own on that model, and the rest run on the policy's model.
import { createHash } from "node:crypto";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Topic } from "../v1/library.ts";
import type { Selection } from "./asking.ts";
import { type Indexed, indexRequest, type TodayTopic } from "./index-request.ts";
import type { RequestKind } from "./questions.ts";
import { languageRequest, type Request, sourceRequest } from "./request.ts";
import type { Finding, Runner, Session } from "./run.ts";

export interface RequestReview {
  request: Request;
  runs: Session[];
  standing: Finding[];
  disputed: Finding[];
}

export interface TopicReview {
  // The topic's id, or the course's code for its index.
  topic: string;
  date: string;
  requests: RequestReview[];
  // The review ran some kinds of request alone.
  partial?: true;
}

export interface Policy {
  model: string;
  // The model of the rules named, asked in requests of their own.
  stronger?: { model: string; rules: string[] };
  // The kinds of request that run; every kind when none is given.
  kinds?: RequestKind[];
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

// The review's models (12.3, decision 8): every question on the model it was calibrated on, sonnet, and NO-30 and
// FT-01 on opus in requests of their own.
export const REVIEW_MODELS: Pick<Policy, "model" | "stronger"> = {
  model: "claude-sonnet-5-5",
  stronger: { model: "claude-opus-5-5", rules: ["NO-30", "FT-01"] },
};

export const modelOf = (request: Request, policy: Policy): string =>
  request.only !== undefined && policy.stronger !== undefined ? policy.stronger.model : policy.model;

async function runRequest(request: Request, runner: Runner, policy: Policy): Promise<RequestReview> {
  if (Object.keys(request.asked).length === 0) return { request, runs: [], standing: [], disputed: [] };
  const model = modelOf(request, policy);
  const first = await runner(request, model);
  const again = request.kind !== "language" || first.findings.length > 0 || drawn(request.topic, request.language ?? "", policy.date);
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

// Each request as its maker gives it, the stronger rules it asks leaving it for a request of their own.
const split = (makers: ((s?: Selection) => Request)[], stronger: string[]): Request[] =>
  makers.flatMap((make) => {
    const whole = make();
    const own = stronger.filter((r) => whole.asked[r] !== undefined);
    return own.length === 0 ? [whole] : [make({ except: own }), make({ only: own })];
  });

// A topic's requests: its source's and each language file's.
export const requestsOf = (topic: Topic, course: Course, catalog: Catalog, stronger: string[] = []): Request[] =>
  split(
    [
      (s) => sourceRequest(topic, course, catalog, s),
      ...topic.languages.map((l) => (s?: Selection) => languageRequest(topic, course, l.data, catalog, s)),
    ],
    stronger,
  );

// A course's index request.
export const indexRequestsOf = (course: Indexed, catalog: Catalog, today: TodayTopic[], stronger: string[] = []): Request[] =>
  split([(s) => indexRequest(course, catalog, today, s)], stronger);

async function run(topic: string, requests: Request[], runner: Runner, policy: Policy): Promise<TopicReview> {
  const tasks = requests.filter((r) => policy.kinds?.includes(r.kind) ?? true).map((r) => () => runRequest(r, runner, policy));
  return {
    topic,
    date: policy.date,
    requests: await pooled(tasks, policy.sessions ?? 4),
    ...(policy.kinds !== undefined && { partial: true as const }),
  };
}

export const reviewTopic = (topic: Topic, course: Course, catalog: Catalog, runner: Runner, policy: Policy): Promise<TopicReview> =>
  run(topic.source.data.id, requestsOf(topic, course, catalog, policy.stronger?.rules), runner, policy);

// A course's index review, in a topic review's shape with the course's code as its topic.
export const reviewIndex = (course: Indexed, catalog: Catalog, today: TodayTopic[], runner: Runner, policy: Policy): Promise<TopicReview> =>
  run(course.course, indexRequestsOf(course, catalog, today, policy.stronger?.rules), runner, policy);
