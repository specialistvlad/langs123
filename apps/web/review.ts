// The review preview's model (pages/review.ts): what a draft carries for the owner, its status, its writer, its reviews, its
// flagged rules, the check's problems and every finding, and where each finding stands in the reading. A finding's `at`
// names an element of the topic, a sentence, an item, a block, a subtopic; it pins under the element the reading draws for
// it (anchorsOf), and one whose element the reading does not draw stands at the page's end. Labels are English: the owner
// alone reads this page.
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { esc, marks, tag } from "./reading-marks.ts";

export interface ReviewFinding {
  id: string;
  at: string;
  language?: string;
  rule?: string;
  text: string;
  fix?: string;
  answer?: "fixed" | "declined";
  reason?: string;
  model: string;
  run: number;
}
export interface ReviewProblem {
  rule?: string;
  id?: string;
  message: string;
}
export interface ReviewEntry {
  topic: string;
  course: string;
  slug: string;
  wave: string;
  status: string;
  writer: { session: string; model: string };
  // Each model's review, in the order the record first names it, and the runs it took.
  reviews: { model: string; runs: number[] }[];
  flagged: string[];
  // The languages the owner still reads it in, and why it is in the queue; neither for a draft outside it.
  reads: string[];
  why?: "flagged" | "sampled";
  problems: ReviewProblem[];
  findings: ReviewFinding[];
}

export const LABELS = {
  queue: "Review",
  every: "Every draft",
  flagged: "Flagged",
  sampled: "Sampled",
  readIn: "Read in:",
  status: "Status:",
  writer: "Writer:",
  review: "Review",
  runs: "runs",
  flaggedRules: "Flagged:",
  checks: "Checks:",
  fix: "Fix:",
  fixed: "Fixed",
  declined: "Declined",
  open: "Open",
  run: "run",
  elsewhere: "Elsewhere in the topic",
  wave: "Wave",
};

// A count with its noun: 1 topic, 4 topics.
export const count = (n: number, noun: string): string => `${String(n)} ${noun}${n === 1 ? "" : "s"}`;

// Each id of the topic's text by the id of the element the reading draws it in: a subtopic's title its subtopic, a fact's
// or a why's sentence its block, a table's column, row and cell its table, an example and an item themselves, the head's
// title and definition the head, an error's parts its error, the picture itself, a language's own block itself.
export function anchorsOf(topic: Topic): Map<string, string> {
  const at = new Map<string, string>([
    [topic.title.id, "head"],
    [topic.definition.id, "head"],
  ]);
  const put = (anchor: string, ...ids: (string | undefined)[]): void => {
    for (const id of ids) if (id !== undefined) at.set(id, anchor);
  };
  if (topic.picture !== undefined) put(topic.picture.id, topic.picture.id);
  for (const e of topic.essence) put(e.id, e.id, e.ex?.id);
  for (const s of topic.subtopics) {
    put(s.id, s.id, s.title.id);
    for (const b of s.blocks) {
      put(b.id, b.id);
      if (b.type === "fact" || b.type === "why") put(b.id, ...b.text.map((t) => t.id));
      else if (b.type === "example") for (const ex of b.items) put(ex.id, ex.id);
      else if (b.type === "list") for (const i of b.items) put(i.id, i.id, i.ex?.id);
      else {
        put(b.id, ...b.columns.map((c) => c.id), ...b.rows.map((row) => row.id));
        for (const row of b.rows) {
          for (const cell of Object.values(row.cells)) if (typeof cell === "object" && !Array.isArray(cell)) put(b.id, cell.id);
        }
      }
    }
  }
  for (const e of topic.errors) {
    put(e.id, e.id, e.rule.id, typeof e.right === "string" ? undefined : e.right.id, ...Object.values(e.speakers).map((s) => s.id));
  }
  for (const own of Object.values(topic.own)) {
    for (const o of own.blocks) put(o.id, o.id, ...(o.text ?? []).map((t) => t.id), ...(o.items ?? []).map((i) => i.id));
    for (const e of own.errors) put(e.id, e.id, e.rule.id, ...Object.values(e.speakers).map((s) => s.id));
  }
  return at;
}

// The findings a view of the draft shows: those on the language read and those on the source, which every view carries.
export const shown = (findings: readonly ReviewFinding[], language: string): ReviewFinding[] =>
  findings.filter((f) => f.language === undefined || f.language === language);

const ctx = { variety: "all" };

// A finding's card: its rule, the finding, the fix, the answer (fixed and declined quiet, declined with its reason, open in
// the warn colour) and the model and run at its foot.
export function card(f: ReviewFinding): string {
  const state = f.answer ?? "open";
  const answer =
    state === "fixed"
      ? LABELS.fixed
      : state === "open"
        ? LABELS.open
        : `${LABELS.declined}${f.reason === undefined ? "" : `: ${marks(f.reason, ctx)}`}`;
  return (
    `<aside class="rv-fc rv-${state}" data-finding="${esc(f.id)}"><p class="rv-fc-head">${f.rule === undefined ? "" : tag(f.rule)}</p>` +
    `<p class="rv-fc-text">${marks(f.text, ctx)}</p>${f.fix === undefined ? "" : `<p class="rv-fc-fix"><b>${LABELS.fix}</b> ${marks(f.fix, ctx)}</p>`}` +
    `<p class="rv-fc-ans">${answer}</p><p class="rv-fc-foot">${esc(f.model)} · ${LABELS.run} ${String(f.run)}</p></aside>`
  );
}

// The pins of a view: each finding's card under its element, by the element's id; and the findings no element draws.
export function pinsOf(topic: Topic, findings: readonly ReviewFinding[]): { pin: (id: string) => string; drawn: Set<string> } {
  const anchors = anchorsOf(topic);
  const by = new Map<string, ReviewFinding[]>();
  for (const f of findings) {
    const anchor = anchors.get(f.at) ?? f.at;
    by.set(anchor, [...(by.get(anchor) ?? []), f]);
  }
  const drawn = new Set<string>();
  const pin = (id: string): string => {
    const cards = by.get(id) ?? [];
    for (const f of cards) drawn.add(f.id);
    return cards.length === 0 ? "" : `<div class="rv-pins">${cards.map(card).join("")}</div>`;
  };
  return { pin, drawn };
}
