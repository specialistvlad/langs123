// The new library's topic pages (a build's library "v1"): each topic of a course in each explanation language it has, at
// /<explain>/<course>/v1/<slug>/, in a topic page's frame (the course column, the title row, the outline and the bars) with
// the reading in place of the lesson. The page reads in its language alone, at a phone's column; reading.js (client-reading.ts)
// draws it again in the browser for the reader's languages from Languages I know, the form they chose and the column's width.
import type { LibraryV1 } from "../../../scripts/export.ts";
import { count, type Explain, type Level } from "../../../scripts/lib.ts";
import type { Topic } from "../../../scripts/generated/export-v1.ts";
import { layerPath, topicIn } from "../../../scripts/v1/export/layers.ts";
import { alternates, type Track, V1_DATA } from "../context.ts";
import { courseSide, menus } from "../course-column.ts";
import { escapeHtml } from "../html.ts";
import { type LevelEntry, levelData, levelPopover, topicEntry } from "../level-popover.ts";
import { Reading } from "../reading.ts";
import { article } from "../reading-layers.ts";
import { esc, parseMarks, plain } from "../reading-marks.ts";
import { parts } from "../reading-parts.ts";
import { Words } from "../reading-words.ts";
import { BACK } from "../track-parts.ts";
import { trackUrl } from "../urls.ts";

// The reading column of a phone, the page's own drawing.
export const PHONE_COLUMN = 362;
// The wording the reading asks for, the part of the interface the page carries to the browser.
export const READING_KEYS = [
  "why",
  "fullScreen",
  "close",
  "essence",
  "commonErrors",
  "speakersOf",
  "layersInterleaved",
  "layersReveal",
  "layersSideBySide",
  "minutes",
  "level",
  "levels",
  "variantTap",
];

// What the browser draws the page from: the topic cut to the page's language and the course's own, its course's code,
// language and varieties, the wording and the names, and the layer file of each other language the topic has (7.4),
// which the browser loads on top of the page for the reader's other languages.
export interface ReadingData {
  topic: Topic;
  course: string;
  source: string;
  language: string;
  layers: Record<string, string>;
  varieties: string[];
  text: Record<string, Record<string, string>>;
  names: Record<string, Record<string, string>>;
  // The varieties' names by code, in every interface language.
  varietyNames: Record<string, Record<string, string>>;
}

export const readingUrl = (explain: Explain, track: Pick<Track, "lang">, topic: Pick<Topic, "slug">): string =>
  `${trackUrl(explain, track.lang)}v1/${topic.slug}/`;

// The languages a topic is written in: its title's, the course's own among them.
const languagesOf = (topic: Topic): Explain[] => Object.keys(topic.title.text) as Explain[];

export function readingPages(track: Track, v1: LibraryV1): void {
  const { ctx, lang, explain, t } = track;
  const course = v1.library.courses.find((c) => c.code === lang.code);
  const file = v1.courses.find((c) => c.course === lang.code);
  if (course === undefined || file === undefined) return;
  const words = Words.of(v1.library, explain);
  const varieties = course.varieties.map((v) => v.code);
  for (const topic of file.topics.filter((tp) => languagesOf(tp).includes(explain))) {
    const reading = new Reading(topic, course.source, [explain], words, PHONE_COLUMN, varieties[0] ?? "all");
    const title = plain(parseMarks(reading.say(topic.title.id, topic.title.text)), reading.ctx);
    const own = readingUrl(explain, track, topic);
    // The outline names every part a reader can have, the errors with every speaker's; reading.js hides those the reader lacks.
    const speakers = [...new Set(topic.errors.flatMap((e) => Object.keys(e.speakers)))];
    const list = parts(
      new Reading(topic, course.source, [explain], words, PHONE_COLUMN, varieties[0] ?? "all", PHONE_COLUMN, [explain, ...speakers]),
    );
    const outline = list.map(
      (p, i) => `<a href="#${p.id}"${i === 0 ? ' class="on" aria-current="location"' : ""}><b>${p.n}</b><span>${esc(p.title)}</span></a>`,
    );
    const embedded = [...new Set([course.source, explain])];
    const layers = Object.fromEntries(
      languagesOf(topic)
        .filter((l) => !embedded.includes(l))
        .map((l) => [l, `/${V1_DATA}/${layerPath(lang.code, topic.slug, l)}`]),
    );
    const data: ReadingData = {
      topic: topicIn(topic, embedded),
      course: lang.code,
      source: course.source,
      language: explain,
      layers,
      varieties,
      text: Object.fromEntries(READING_KEYS.map((k) => [k, words.text[k] ?? {}])),
      names: words.names,
      varietyNames: words.varieties,
    };
    const json = JSON.stringify(data).replace(/</g, "\\u003c");
    // The level popover the page's marks open: the topic by the levels of its parts, part 00 by its lines' and each subtopic
    // by its blocks', as today's topic page names its sections.
    const name = (s: Topic["subtopics"][number]): string => plain(parseMarks(reading.say(s.title.id, s.title.text)), reading.ctx);
    const lines = (levels: Level[]): LevelEntry["l"] =>
      Object.fromEntries([...new Set(levels)].sort().map((l) => [l, count("lines", explain, levels.filter((x) => x === l).length)]));
    const entries: Record<string, LevelEntry> = {
      topic: topicEntry(
        title,
        topic.subtopics.map((s) => ({ title: name(s), levels: [s.level] })),
        explain,
      ),
      essence: { t: words.say("essence"), k: "section", l: lines(topic.essence.map((e) => e.level ?? "A1")) },
      ...Object.fromEntries(topic.subtopics.map((s) => [s.id, { t: name(s), k: "section", l: lines(s.blocks.map(() => s.level)) }])),
    };
    const back = `<a class="ix-up glass tp-back tp-back-c" href="${trackUrl(explain, lang)}" aria-label="${escapeHtml(track.title)}">${BACK}</a>`;
    const contents = escapeHtml(t.contents);
    const body = `<div class="cl" data-cl="topic">
${courseSide(track, { title })}
<div class="cl-main"><div class="tp-wrap"><div class="tp-cols">
<div class="tp-col">
<div class="tp-head"><header class="doc-head"><div class="title-row">${back}<h1>${esc(title)}</h1></div></header></div>
<main class="tp-main"><article class="rd-article lx" id="rd" lang="${explain}">${article(reading, "interleaved")}</article></main>
</div>
<nav class="tp-outline" aria-label="${contents}"><p class="tp-caps">${contents}</p>${outline.join("")}</nav>
</div></div></div>
</div>
${menus(track, { title })}
${levelPopover(explain)}
${levelData(entries)}
<script type="application/json" id="rd-data">${json}</script>
<script src="/reading.js" defer></script>`;
    ctx.add(
      {
        kind: "topic",
        lang: explain,
        title: `${title} — ${track.title}`,
        description: plain(parseMarks(reading.say(topic.definition.id, topic.definition.text)), reading.ctx),
        path: own,
        alternates: alternates(
          (e) => readingUrl(e, track, topic),
          track.explains.filter((e) => languagesOf(topic).includes(e)),
        ),
        level: true,
        varieties: lang.varieties,
        body,
        about: { name: title, lang: lang.code, topic: topic.id, minutes: topic.minutes[explain] ?? 1 },
      },
      false,
    );
  }
}
