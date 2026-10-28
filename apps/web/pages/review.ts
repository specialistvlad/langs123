// The review preview, in a v1 preview build alone (dev with library "v1"), never a deploy: /review/, the flagged queue by
// wave and every draft under it, and /review/<topic id>/?lang=<code>, a draft read in one of its languages with its status,
// its writer, its reviews, its flagged rules, the check's problems and each finding pinned under its element. The page
// draws the course's own language; review.js (client-review.ts) draws the language the address names. English labels.
import type { LibraryV1 } from "../../../scripts/export.ts";
import type { Context } from "../context.ts";
import { Reading } from "../reading.ts";
import { esc, parseMarks, plain, tag } from "../reading-marks.ts";
import { ladder, Words } from "../reading-words.ts";
import { LABELS, type ReviewEntry } from "../review.ts";
import { draft, type ReviewData, summary } from "../review-view.ts";
import { READING_KEYS } from "./reading.ts";

export const REVIEW = "/review/";
export const reviewUrl = (topic: string): string => `${REVIEW}${topic}/`;
const COLUMN = 640;

export function reviewPages(ctx: Context, v1: LibraryV1, entries: readonly ReviewEntry[]): void {
  const topics = new Map(v1.courses.flatMap((c) => c.topics.map((t) => [t.id, { topic: t, course: c.course }] as const)));
  const words = Words.of(v1.library, "en");
  const row = (e: ReviewEntry): string => {
    const found = topics.get(e.topic);
    const title =
      found === undefined
        ? e.topic
        : plain(
            parseMarks(new Reading(found.topic, e.course, ["en"], words, COLUMN, "all").say(found.topic.title.id, found.topic.title.text)),
            { variety: "all" },
          );
    const why =
      e.why === undefined ? "" : `<span class="rv-why rv-${e.why}">${e.why === "flagged" ? LABELS.flagged : LABELS.sampled}</span>`;
    const meta = `${why}${e.flagged.map(tag).join("")}${e.reads.map((l) => tag(l.toUpperCase())).join("")}${tag(e.status)}`;
    return `<div class="lx-row"><a href="${reviewUrl(e.topic)}" class="lx-row-a lx-cover"><span class="lx-row-t">${esc(title)}<span class="lx-row-sub rv-meta">${meta}</span></span></a>${found === undefined ? "" : ladder(found.topic.levels, words, true)}</div>`;
  };
  const queued = entries.filter((e) => e.why !== undefined);
  const waves = [...new Set(queued.map((e) => e.wave))].sort();
  const queue = waves
    .map(
      (w) =>
        `<h2 class="rv-wave">${LABELS.wave} ${w}</h2><div class="lx-card">${queued
          .filter((e) => e.wave === w)
          .map(row)
          .join("")}</div>`,
    )
    .join("");
  const rest = entries.filter((e) => e.why === undefined);
  const every = rest.length === 0 ? "" : `<h2 class="rv-wave">${LABELS.every}</h2><div class="lx-card">${rest.map(row).join("")}</div>`;
  ctx.add(
    {
      kind: "page",
      lang: "en",
      title: LABELS.queue,
      description: LABELS.queue,
      path: REVIEW,
      body: `<main class="rv lx"><h1 class="lx-h1">${LABELS.queue}</h1>${queue}${every}</main>`,
    },
    false,
  );
  for (const entry of entries) {
    const found = topics.get(entry.topic);
    if (found === undefined) continue;
    const course = v1.library.courses.find((c) => c.code === found.course);
    const source = course?.source ?? found.course;
    const data: ReviewData = {
      topic: found.topic,
      source,
      varieties: course?.varieties.map((v) => v.code) ?? [],
      entry,
      text: Object.fromEntries(READING_KEYS.map((k) => [k, words.text[k] ?? {}])),
      names: words.names,
    };
    const json = JSON.stringify(data).replace(/</g, "\\u003c");
    const title = plain(parseMarks(found.topic.title.text[source] as string), { variety: "all" });
    const body = `<main class="rv lx"><p><a href="${REVIEW}">${LABELS.queue}</a></p><h1 class="lx-h1">${esc(title)}</h1>${summary(entry)}<article class="rd-article lx" id="rv">${draft(data, source)}</article></main>
<script type="application/json" id="rv-data">${json}</script>
<script src="/review.js" defer></script>`;
    ctx.add(
      { kind: "page", lang: "en", title: `${title} — ${LABELS.queue}`, description: LABELS.queue, path: reviewUrl(entry.topic), body },
      false,
    );
  }
}
