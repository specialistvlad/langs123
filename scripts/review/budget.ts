// The budget of the review and of the writing (12.5, gate 4b check 15), from the sessions the samples' review and the
// calibration ran: each request kind's sessions with their tokens and time; per topic at v1, its source request run
// twice and its eleven language requests once, a second run's share as the samples show it; per wave, the topics of
// each level across the seven courses (export/synthetic.ts plans them), their sessions, tokens and weeks at the rate
// the owner gives; the writing's sessions and tokens, from the samples' files; and the cheapest model meeting each
// question's target.
import { LEVELS } from "../lib.ts";
import { PLAN } from "../v1/export/synthetic.ts";
import type { Session } from "./run.ts";
import { meets, summed, type Tally } from "./tally.ts";

// A line of sessions.jsonl: a session with the request it answered; the review keeps its findings' count, the calibration
// the findings.
export interface SessionLine extends Omit<Session, "findings"> {
  findings: Session["findings"] | number;
  topic: string;
  kind: string;
  language: string | null;
  run: number;
}

export interface BudgetInput {
  sessions: SessionLine[];
  tallies: Tally[];
  // The writing's tokens per topic: the samples' files, in tokens.
  writing: { input: number; output: number };
  // Sessions the owner's subscription runs in a day.
  perDay: number;
}

// The cheapest models first.
export const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"];
const LANGUAGES = 11;

const tokensIn = (s: SessionLine): number => s.tokens.input + s.tokens.cacheRead + s.tokens.cacheWrite;
const mean = (xs: number[]): number => (xs.length === 0 ? 0 : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length));
const thousands = (n: number): string => `${String(Math.round(n / 1000))}k`;

// The topics each level holds at v1, across the courses: a course's topics spread evenly over the levels it reaches,
// A0 to C2 for the three of 120 topics, A0 to A2 for the others.
export function topicsPerLevel(plan: Record<string, number> = PLAN): Record<string, number> {
  const reach = (topics: number): number => (topics > 60 ? LEVELS.length : 3);
  return Object.fromEntries(
    LEVELS.map((level, n) => [
      level,
      Math.round(Object.values(plan).reduce((sum, topics) => sum + (n < reach(topics) ? topics / reach(topics) : 0), 0)),
    ]),
  );
}

export function budgetReport(input: BudgetInput, date: string): string {
  const review = input.sessions.filter((s) => s.topic !== "calibration" && !s.topic.startsWith("planted"));
  const kinds = [...new Set(input.sessions.map((s) => (s.topic === "calibration" ? "calibration" : s.kind)))];
  const language = review.filter((s) => s.kind === "language");
  const languageRequests = new Set(language.map((s) => `${s.topic} ${s.language ?? ""}`)).size;
  const second = languageRequests === 0 ? 0 : language.filter((s) => s.run === 2).length / languageRequests;
  const perTopic = 2 + LANGUAGES * (1 + second);
  const sourceIn = mean(review.filter((s) => s.kind === "source").map(tokensIn));
  const languageIn = mean(language.map(tokensIn));
  const topicIn = 2 * sourceIn + LANGUAGES * (1 + second) * languageIn;
  const levels = topicsPerLevel();
  const cheapest = [...new Set(input.tallies.map((t) => t.rule))].map((rule) => {
    const met = summed(input.tallies.filter((t) => t.rule === rule))
      .filter(meets)
      .map((t) => t.model);
    return `| ${rule} | ${MODELS.find((m) => met.includes(m)) ?? "none yet"} |`;
  });
  return [
    `# Review and writing budget, ${date}`,
    "",
    "## Sessions measured",
    "",
    "| Kind | Sessions | Tokens in, mean | Tokens out, mean | Time, mean |",
    "|---|---|---|---|---|",
    ...kinds.map((k) => {
      const of = input.sessions.filter((s) => (s.topic === "calibration" ? "calibration" : s.kind) === k);
      return `| ${k} | ${String(of.length)} | ${thousands(mean(of.map(tokensIn)))} | ${thousands(mean(of.map((s) => s.tokens.output)))} | ${String(Math.round(mean(of.map((s) => s.ms)) / 1000))} s |`;
    }),
    "",
    "## Per topic at v1",
    "",
    `A topic's review takes ${perTopic.toFixed(1)} sessions: its source twice, and its ${String(LANGUAGES)} language files once each and again ${String(Math.round(second * 100))}% of the time, as the samples ran; about ${thousands(topicIn)} tokens in. Writing it takes a session for its source and one per language file, about ${thousands(input.writing.output)} tokens out and ${thousands(input.writing.input)} in.`,
    "",
    "## Per wave",
    "",
    `At ${String(input.perDay)} sessions a day:`,
    "",
    "| Wave | Topics | Review sessions | Review tokens in | Writing sessions | Weeks |",
    "|---|---|---|---|---|---|",
    ...Object.entries(levels).map(([level, topics]) => {
      const sessions = topics * (perTopic + 1 + LANGUAGES);
      return `| ${level} | ${String(topics)} | ${String(Math.round(topics * perTopic))} | ${thousands(topics * topicIn)} | ${String(topics * (1 + LANGUAGES))} | ${(sessions / input.perDay / 7).toFixed(1)} |`;
    }),
    "",
    "## The cheapest model per question",
    "",
    "| Rule | Cheapest model at its target |",
    "|---|---|",
    ...cheapest,
    "",
  ].join("\n");
}
