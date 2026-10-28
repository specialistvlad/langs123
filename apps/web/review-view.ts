// A draft of the review preview as the owner reads it (pages/review.ts, client-review.ts): its status card, the switch of
// its languages and its reading in one, each finding the view shows pinned under its element and the rest at its end.
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { Reading } from "./reading.ts";
import { esc, parseMarks, plain, tag } from "./reading-marks.ts";
import { interleaved } from "./reading-parts.ts";
import { Words } from "./reading-words.ts";
import { card, count, LABELS, pinsOf, type ReviewEntry, shown } from "./review.ts";

const COLUMN = 640;

// What the browser draws a draft from: the topic, its course's language and varieties, its review entry and the wording.
export interface ReviewData {
  topic: Topic;
  source: string;
  varieties: string[];
  entry: ReviewEntry;
  text: Record<string, Record<string, string>>;
  names: Record<string, Record<string, string>>;
}

// A topic's languages in the export's order.
export const languagesOf = (topic: Topic): string[] => Object.keys(topic.title.text);

// The status card: the status, the writer, each review with its model and runs, the flagged rules and the check.
export function summary(entry: ReviewEntry): string {
  const line = (key: string, value: string): string => `<p class="rv-l"><span class="rv-k">${key}</span> ${value}</p>`;
  const reviews = entry.reviews.map((r, i) =>
    line(`${LABELS.review} ${String(i + 1)}:`, `${esc(r.model)} · ${LABELS.runs} ${r.runs.join(", ")}`),
  );
  const flagged =
    entry.flagged.length === 0 ? "" : line(LABELS.flaggedRules, `<span class="rv-caps">${entry.flagged.map(tag).join("")}</span>`);
  const problems = entry.problems.map(
    (p) => `<li>${p.rule === undefined ? "" : tag(p.rule)}${p.id === undefined ? "" : `<code>${esc(p.id)}</code> `}${esc(p.message)}</li>`,
  );
  return (
    `<div class="lx-card rv-sum">${line(LABELS.status, esc(entry.status))}${line(LABELS.writer, `${esc(entry.writer.session)} · ${esc(entry.writer.model)}`)}` +
    `${reviews.join("")}${flagged}${line(LABELS.checks, count(entry.problems.length, "problem"))}${problems.length === 0 ? "" : `<ul class="rv-problems">${problems.join("")}</ul>`}</div>`
  );
}

// A draft's title in a language, as plain text.
export const titleIn = (data: ReviewData, language: string): string =>
  plain(
    parseMarks(
      new Reading(data.topic, data.source, [language], new Words(data.text, data.names, language), COLUMN, "all").say(
        data.topic.title.id,
        data.topic.title.text,
      ),
    ),
    { variety: "all" },
  );

// A draft read in a language: the switch, the reading with each shown finding pinned under its element, and the rest.
export function draft(data: ReviewData, language: string): string {
  const words = new Words(data.text, data.names, language);
  const r = new Reading(data.topic, data.source, [language], words, COLUMN, data.varieties[0] ?? "all");
  const findings = shown(data.entry.findings, language);
  const { pin, drawn } = pinsOf(data.topic, findings);
  r.pin = pin;
  const html = interleaved(r);
  const rest = findings.filter((f) => !drawn.has(f.id));
  const tabs = languagesOf(data.topic).map(
    (l) =>
      `<button type="button" role="tab" data-lang="${l}" aria-selected="${String(l === language)}">${esc(words.in("en").name(l))}</button>`,
  );
  const elsewhere =
    rest.length === 0
      ? ""
      : `<section class="rv-rest"><h2 class="lx-h2"><span class="lx-t">${LABELS.elsewhere}</span></h2><div class="rv-pins">${rest.map(card).join("")}</div></section>`;
  return `<div class="rd-seg" role="tablist">${tabs.join("")}</div>${html}${elsewhere}`;
}
