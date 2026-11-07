// A review's record and report, of a topic or of a course's index. Each run joins the review record (RV-04): its session, the model that
// answered, the date, the run's number and its findings, each citing its rule (RV-06) for the writer to answer
// (RV-07), but a finding on an element and rule the writer answered before, which is raised again with that answer
// for the owner's reading; `flagged` takes the rules of the standing and disputed findings (RV-09). The report, one
// per topic, lays out each request as the M1 reviews did: the rules asked and the questions counted, the holds
// folded, each standing and disputed finding with its fix, those raised again apart with the writer's answer, the
// pending rules, and the sessions with their models and tokens.
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import type { RequestReview, TopicReview } from "./pipeline.ts";
import type { Finding } from "./run.ts";

export interface Writer {
  session: string;
  model: string;
}

type Reviews = NonNullable<TopicReviewRecord["reviews"]>;
type Answered = Pick<Reviews[number]["findings"][number], "answer" | "reason">;

// The writer's last answer to a finding of the same rule on the same element and language, if the record holds one.
export function answered(record: TopicReviewRecord | undefined, f: Finding, language: string | undefined): Answered | undefined {
  return (record?.reviews ?? [])
    .flatMap((r) => r.findings)
    .findLast((o) => o.answer !== undefined && o.rule === f.rule && o.at === f.at && o.language === language);
}

export function withReview(record: TopicReviewRecord | undefined, review: TopicReview, writer: Writer): TopicReviewRecord {
  const base: TopicReviewRecord = record ?? { writer, statuses: [{ status: "draft", date: review.date, by: writer.session }] };
  let n = (base.reviews ?? []).reduce((count, r) => count + r.findings.length, 0);
  const runs: Reviews = review.requests.flatMap((r) =>
    r.runs.map((s, i) => ({
      session: s.session,
      model: s.model,
      date: review.date,
      run: (i + 1) as 1 | 2,
      findings: s.findings.map((f) => {
        const again = answered(record, f, r.request.language)?.answer;
        return {
          id: `f${String(++n)}`,
          at: f.at,
          ...(r.request.language !== undefined && {
            language: r.request.language as NonNullable<Reviews[number]["findings"][number]["language"]>,
          }),
          rule: f.rule,
          text: f.text,
          fix: f.fix,
          ...(again !== undefined && { again }),
        };
      }),
    })),
  );
  // A review of some requests alone adds its rules to those flagged before.
  const flagged = [
    ...new Set([
      ...(review.partial === true ? (base.flagged ?? []) : []),
      ...review.requests.flatMap((r) => [...r.standing, ...r.disputed].map((f) => f.rule)),
    ]),
  ];
  return { ...base, reviews: [...(base.reviews ?? []), ...runs], flagged };
}

const row = (f: Finding): string =>
  `| ${f.rule} | \`${f.at}\`: ${f.text} Fix: ${f.fix}${f.confidence === "low" ? " (low confidence)" : ""} |`;

function section(r: RequestReview, record: TopicReviewRecord | undefined): string[] {
  const what =
    r.request.kind === "index" ? "the index" : r.request.language === undefined ? "the source" : `the ${r.request.language} file`;
  const name = `${what}${r.request.only === undefined ? "" : `, ${r.request.only.join(" and ")} alone`}`;
  const asked = Object.values(r.request.asked).reduce((a, b) => a + b, 0);
  const found = new Set([...r.standing, ...r.disputed].map((f) => f.rule));
  const holds = Object.keys(r.request.asked).filter((rule) => !found.has(rule));
  const before = (f: Finding): Answered | undefined => answered(record, f, r.request.language);
  const fresh = (list: Finding[]): Finding[] => list.filter((f) => before(f) === undefined);
  const again = [...r.standing.map((f) => [f, "standing"] as const), ...r.disputed.map((f) => [f, "disputed"] as const)].flatMap(
    ([f, verdict]) => {
      const a = before(f);
      return a === undefined
        ? []
        : [`${row(f).slice(0, -2)} | ${verdict} | ${a.answer ?? ""}${a.reason === undefined ? "" : `: ${a.reason}`} |`];
    },
  );
  const table = (title: string, rows: string[], head = "| Rule | Finding |\n|---|---|"): string[] =>
    rows.length > 0 ? ["", title, "", head, ...rows] : [];
  return [
    `## ${name} (${asked} questions, ${Object.keys(r.request.asked).length} rules)`,
    "",
    "| Rule | Finding |",
    "|---|---|",
    ...fresh(r.standing).map(row),
    ...(holds.length > 0 ? [`| ${holds.join(", ")} | hold |`] : []),
    ...(asked === 0 ? ["| — | nothing asked |"] : []),
    ...table("Disputed, reported by one run alone:", fresh(r.disputed).map(row)),
    ...table(
      "Raised again after the writer's answer, for the owner's reading:",
      again,
      "| Rule | Finding | Verdict | The writer's answer |\n|---|---|---|---|",
    ),
    ...(r.request.pending.length > 0
      ? [
          "",
          `Pending, unasked until the request has their input: ${r.request.pending.map((p) => `${p} (${r.request.inputs[p] ?? ""})`).join("; ")}.`,
        ]
      : []),
    "",
    ...r.runs.map(
      (s, i) =>
        `Run ${String(i + 1)}: session ${s.session}, ${s.model}, ${String(s.tokens.input + s.tokens.cacheRead + s.tokens.cacheWrite)} tokens in, ${String(s.tokens.output)} out, ${String(Math.round(s.ms / 1000))} s.`,
    ),
    "",
  ];
}

// The report of a review, beside the record the writer had answered before it.
export const reportOf = (review: TopicReview, record?: TopicReviewRecord): string =>
  [`# Review of ${review.topic}, ${review.date}`, "", ...review.requests.flatMap((r) => section(r, record))].join("\n");
