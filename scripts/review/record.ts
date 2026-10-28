// A review's record and report. Each run joins the topic's review record (RV-04): its session, the model that
// answered, the date, the run's number and its findings, each citing its rule (RV-06) for the writer to answer
// (RV-07); `flagged` takes the rules of the standing and disputed findings (RV-09). The report, one per topic,
// lays out each request as the M1 reviews did: the rules asked and the questions counted, the holds folded, each
// standing and disputed finding with its fix, the pending rules, and the sessions with their models and tokens.
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import type { RequestReview, TopicReview } from "./pipeline.ts";
import type { Finding } from "./run.ts";

export interface Writer {
  session: string;
  model: string;
}

type Reviews = NonNullable<TopicReviewRecord["reviews"]>;

export function withReview(record: TopicReviewRecord | undefined, review: TopicReview, writer: Writer): TopicReviewRecord {
  const base: TopicReviewRecord = record ?? { writer, statuses: [{ status: "draft", date: review.date, by: writer.session }] };
  let n = (base.reviews ?? []).reduce((count, r) => count + r.findings.length, 0);
  const runs: Reviews = review.requests.flatMap((r) =>
    r.runs.map((s, i) => ({
      session: s.session,
      model: s.model,
      date: review.date,
      run: (i + 1) as 1 | 2,
      findings: s.findings.map((f) => ({
        id: `f${String(++n)}`,
        at: f.at,
        ...(r.request.language !== undefined && {
          language: r.request.language as NonNullable<Reviews[number]["findings"][number]["language"]>,
        }),
        rule: f.rule,
        text: f.text,
        fix: f.fix,
      })),
    })),
  );
  const flagged = [...new Set(review.requests.flatMap((r) => [...r.standing, ...r.disputed].map((f) => f.rule)))];
  return { ...base, reviews: [...(base.reviews ?? []), ...runs], flagged };
}

const row = (f: Finding): string =>
  `| ${f.rule} | \`${f.at}\`: ${f.text} Fix: ${f.fix}${f.confidence === "low" ? " (low confidence)" : ""} |`;

function section(r: RequestReview): string[] {
  const name = r.request.language === undefined ? "the source" : `the ${r.request.language} file`;
  const asked = Object.values(r.request.asked).reduce((a, b) => a + b, 0);
  const found = new Set([...r.standing, ...r.disputed].map((f) => f.rule));
  const holds = Object.keys(r.request.asked).filter((rule) => !found.has(rule));
  return [
    `## ${name} (${asked} questions, ${Object.keys(r.request.asked).length} rules)`,
    "",
    "| Rule | Finding |",
    "|---|---|",
    ...r.standing.map(row),
    ...(holds.length > 0 ? [`| ${holds.join(", ")} | hold |`] : []),
    ...(r.disputed.length > 0
      ? ["", "Disputed, reported by one run alone:", "", "| Rule | Finding |", "|---|---|", ...r.disputed.map(row)]
      : []),
    ...(r.request.pending.length > 0 ? ["", `Pending, unasked until M6 brings their input: ${r.request.pending.join(", ")}.`] : []),
    "",
    ...r.runs.map(
      (s, i) =>
        `Run ${String(i + 1)}: session ${s.session}, ${s.model}, ${String(s.tokens.input + s.tokens.cacheRead + s.tokens.cacheWrite)} tokens in, ${String(s.tokens.output)} out, ${String(Math.round(s.ms / 1000))} s.`,
    ),
    "",
  ];
}

export const reportOf = (review: TopicReview): string =>
  [`# Review of ${review.topic}, ${review.date}`, "", ...review.requests.flatMap(section)].join("\n");
