// The review preview, in a v1 preview build alone (dev with library "v1"), never a deploy: /review/, the flagged queue by
// wave and every draft under it, and /review/<topic id>/?lang=<code>, a draft read in one of its languages with its status,
// its writer, its reviews, its flagged rules, the check's problems and each finding pinned under its element. The page
// draws the course's own language; review.js (client-review.ts) draws the language the address names. English labels.
import type { LibraryV1 } from "../../../scripts/export.ts";
import type { Context } from "../context.ts";
import { esc, tag } from "../reading-marks.ts";
import { ladder, SVG_CHEV, Words } from "../reading-words.ts";
import { count, LABELS, type ReviewEntry } from "../review.ts";
import { draft, type ReviewData, summary, titleIn } from "../review-view.ts";
import { BACK } from "../track-parts.ts";
import type { Topic } from "../../../scripts/generated/export-v1.ts";
import { READING_KEYS } from "./reading.ts";

export const REVIEW = "/review/";
export const reviewUrl = (topic: string): string => `${REVIEW}${topic}/`;

// A topic's row in the queue: its title, Flagged or Sampled, the flagged rules, the languages the owner reads it in and its
// status, its level mark under them.
function row(e: ReviewEntry, title: string, levels: readonly string[], words: Words): string {
  const why =
    e.why === undefined
      ? ""
      : e.why === "flagged"
        ? `<span class="lx-capsule rv-warn">${LABELS.flagged}</span>`
        : `<span class="lx-capsule rv-accent">${LABELS.sampled}</span>`;
  const reads = e.reads.length === 0 ? "" : `<span class="rv-reads">${LABELS.readIn} ${e.reads.join(", ")}</span>`;
  return (
    `<div class="lx-row lx-irow"><div class="lx-irow-t"><a href="${reviewUrl(e.topic)}" class="lx-irow-title lx-cover">${esc(title)}</a>` +
    `<span class="rv-caps">${why}${e.flagged.map(tag).join("")}${reads}${tag(e.status)}</span>` +
    `<span class="lx-irow-meta">${levels.length === 0 ? "" : ladder(levels, words)}</span></div><span class="lx-chev">${SVG_CHEV}</span></div>`
  );
}

export function reviewPages(ctx: Context, v1: LibraryV1, entries: readonly ReviewEntry[]): void {
  const topics = new Map(v1.courses.flatMap((c) => c.topics.map((t) => [t.id, { topic: t, course: c.course }] as const)));
  const words = Words.of(v1.library, "en");
  const sourceOf = (course: string): string => v1.library.courses.find((c) => c.code === course)?.source ?? course;
  const dataOf = (entry: ReviewEntry, topic: Topic): ReviewData => ({
    topic,
    source: sourceOf(entry.course),
    varieties: v1.library.courses.find((c) => c.code === entry.course)?.varieties.map((v) => v.code) ?? [],
    entry,
    text: Object.fromEntries(READING_KEYS.map((k) => [k, words.text[k] ?? {}])),
    names: words.names,
    varietyNames: words.varieties,
  });
  // Each row titled in the language the owner reads first, else the course's own.
  const rowOf = (e: ReviewEntry): string => {
    const found = topics.get(e.topic);
    if (found === undefined) return row(e, e.topic, [], words);
    return row(e, titleIn(dataOf(e, found.topic), e.reads[0] ?? "uk"), found.topic.levels, words);
  };
  const section = (title: string, list: readonly ReviewEntry[]): string =>
    `<section class="rv-sec"><h2 class="lx-h2"><span class="lx-t">${title}</span><span class="lx-ix-count">${count(list.length, "topic")}</span></h2><div class="lx-card">${list.map(rowOf).join("")}</div></section>`;
  const queued = entries.filter((e) => e.why !== undefined);
  const waves = [...new Set(queued.map((e) => e.wave))].sort().map((w) =>
    section(
      `${LABELS.wave} ${w}`,
      queued.filter((e) => e.wave === w),
    ),
  );
  const rest = entries.filter((e) => e.why === undefined);
  const counts = [
    count(entries.length, "topic"),
    `${String(queued.filter((e) => e.why === "flagged").length)} flagged`,
    `${String(queued.filter((e) => e.why === "sampled").length)} sampled`,
  ];
  const meta = `<p class="lx-meta rv-counts">${counts.map((c) => `<span>${c}</span>`).join('<span class="lx-dot" aria-hidden="true"></span>')}</p>`;
  const queue = `<main class="rv lx"><div class="rv-bar"><h1 class="lx-h1">${LABELS.queue}</h1></div>${meta}<div class="rv-secs">${waves.join("")}${rest.length === 0 ? "" : section(LABELS.every, rest)}</div></main>`;
  ctx.add({ kind: "page", lang: "en", title: LABELS.queue, description: LABELS.queue, path: REVIEW, body: queue }, false);
  for (const entry of entries) {
    const found = topics.get(entry.topic);
    if (found === undefined) continue;
    const data = dataOf(entry, found.topic);
    const json = JSON.stringify(data).replace(/</g, "\\u003c");
    const title = titleIn(data, data.source);
    const up = `<a href="${REVIEW}" class="ix-up glass rv-up" aria-label="${LABELS.queue}">${BACK}</a>`;
    const body = `<main class="rv lx"><div class="rv-bar">${up}<h1 class="lx-h1" id="rv-title">${esc(title)}</h1></div>${summary(entry)}<article class="rd-article lx" id="rv">${draft(data, data.source)}</article></main>
<script type="application/json" id="rv-data">${json}</script>
<script src="/review.js" defer></script>`;
    ctx.add(
      { kind: "page", lang: "en", title: `${title} — ${LABELS.queue}`, description: LABELS.queue, path: reviewUrl(entry.topic), body },
      false,
    );
  }
}
