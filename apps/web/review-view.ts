// A draft of the review preview as the owner reads it (pages/review.ts, client-review.ts): its head, and its reading in one
// language with each finding the view shows pinned under its element and the rest at its end.
import type { Topic } from "../../scripts/generated/export-v1.ts";
import { Reading } from "./reading.ts";
import { esc, tag } from "./reading-marks.ts";
import { interleaved } from "./reading-parts.ts";
import { Words } from "./reading-words.ts";
import { card, LABELS, pinsOf, type ReviewEntry, shown } from "./review.ts";

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

// A topic's languages, the course's own first.
export const languagesOf = (topic: Topic, source: string): string[] => [
  source,
  ...Object.keys(topic.title.text).filter((l) => l !== source),
];

// The head of a draft: its status, its writer, its reviews, its flagged rules, the languages the owner still reads it in
// and the check's problems.
export function summary(entry: ReviewEntry): string {
  const reviews = entry.reviews.map((r) => `${esc(r.model)} · ${String(r.runs)} ${LABELS.runs}`).join(", ");
  const problems =
    entry.problems.length === 0
      ? `<p class="rv-none">${LABELS.noProblems}</p>`
      : `<ul class="rv-problems">${entry.problems.map((p) => `<li>${p.rule === undefined ? "" : tag(p.rule)}${p.id === undefined ? "" : `<code>${esc(p.id)}</code> `}${esc(p.message)}</li>`).join("")}</ul>`;
  return (
    `<section class="rv-summary"><p class="rv-status">${tag(entry.status)}${entry.why === undefined ? "" : tag(entry.why === "flagged" ? LABELS.flagged : LABELS.sampled)}</p>` +
    `<p class="rv-line"><b>${LABELS.writer}</b> ${esc(entry.writer.model)}</p><p class="rv-line"><b>${LABELS.reviews}</b> ${reviews}</p>` +
    `<p class="rv-rules">${entry.flagged.map(tag).join("")}</p>${entry.reads.length === 0 ? "" : `<p class="rv-line"><b>${LABELS.reads}</b> ${entry.reads.map((l) => tag(l.toUpperCase())).join("")}</p>`}` +
    `<section class="rv-check"><h2>${LABELS.problems}</h2>${problems}</section></section>`
  );
}

// A draft read in a language, each shown finding pinned under its element and the rest at its end.
export function draft(data: ReviewData, language: string): string {
  const words = new Words(data.text, data.names, language);
  const r = new Reading(data.topic, data.source, [language], words, COLUMN, data.varieties[0] ?? "all");
  const findings = shown(data.entry.findings, language);
  const { pin, drawn } = pinsOf(data.topic, findings);
  r.pin = pin;
  const html = interleaved(r);
  const rest = findings.filter((f) => !drawn.has(f.id));
  const switcher = languagesOf(data.topic, data.source)
    .map((l) => `<a role="tab" href="?lang=${l}" aria-selected="${String(l === language)}">${esc(words.in("en").name(l))}</a>`)
    .join("");
  return `<div class="rd-seg rv-langs" role="tablist">${switcher}</div>${html}${rest.length === 0 ? "" : `<section class="rv-rest"><h2>${LABELS.elsewhere}</h2>${rest.map(card).join("")}</section>`}`;
}
