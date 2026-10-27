// Topic pages in the frame (frame.css, topic*.css). From 1024px a topic page is the course's two columns
// (course-column.ts: the topics on the left, this topic marked) with the lesson on the right: the head (the title, the
// topic's level mark and reading time), its lead, the summary as 00 and the sections numbered, rendered as a lesson by
// lesson.ts and tables-html.ts, then Up next and the study path; the parts sit pinned at its top right as an outline
// (Contents, number and title; client-topic.ts marks the part in view and scrolls to the one chosen) under the glass bar
// of Level, Variety and More. A level mark opens the level popover: what each level covers in the topic or the section;
// the bar's Level button opens it headed by the course. A phone shows the topic in two pages, one document: the
// contents (Back to the course; the title, levels, lead and the parts as rows with chevrons) until the address names
// a part (#part), then the reading at that part (Back to the contents). The bottom bar holds Level, Variety, More and
// a round Search button that opens the field (client-home.ts) over the results.
import { type Explain, localize, say } from "../../../scripts/lib.ts";
import { join, topicLevels } from "../../../scripts/levels.ts";
import { plainText, reading, textIn } from "../../../scripts/text.ts";
import { alternates, explainsOf, type Track } from "../context.ts";
import { courseLevel, courseSide, menus } from "../course-column.ts";
import { guideParts, guideSections } from "../guide.ts";
import { escapeHtml, explained, inline } from "../html.ts";
import { CLOCK, num, parts, studyPath, upNext } from "../lesson-chrome.ts";
import { levelsLabel, markButton } from "../level-mark.ts";
import { type LevelEntry, levelData, levelPopover, sectionEntry, topicEntry } from "../level-popover.ts";
import { anchorIds } from "../parts.ts";
import { readingMinutes } from "../reading-time.ts";
import { BACK } from "../track-parts.ts";
import { topicUrl, trackUrl } from "../urls.ts";

// What a section shows when the level filter sits below everything in it: a note naming the filter's level
// (client-chips.ts) and where the section starts, and a button that sets the level there. levels.css shows it.
function filterEmpty(start: string, explain: Explain): string {
  const note = escapeHtml(say("sectionEmpty", explain, { level: "\u0000", start })).replace("\u0000", "<span data-level-now></span>");
  const show = escapeHtml(say("showLevel", explain, { level: start }));
  return `<div class="filter-empty" data-needs="${start}"><p>${note}</p><button type="button" data-set-level="${start}">${show}</button></div>`;
}

export function topicPages(track: Track): void {
  const { ctx, lang, explain, t, title: trackTitle, written } = track;
  const course = localize(lang.name, explain);
  const held = courseLevel(track).entry;
  for (const ref of written) {
    const topic = ref.topic;
    if (topic === null) continue;
    const rctx = { ref, explain, refs: ctx.refs, link: ctx.link, varieties: lang.varieties, lesson: true };
    const all = guideSections(rctx);
    const guide = guideParts(topic, explain);
    const range = join(all.map((s) => s.range));
    if (range === null) continue;
    const ids = anchorIds(all.map((s) => s.title));
    const title = plainText(textIn(topic.title, explain), reading(explain, false));
    const entries: Record<string, LevelEntry> = { topic: topicEntry(title, guide, explain), [lang.code]: held };
    let n = 0;
    const sections = all
      .map((s, i) => {
        const summary = s.kind === "summary";
        const key = `s${String(i)}`;
        entries[key] = sectionEntry(s.title, guide[i]?.content ?? [], explain);
        const mark = markButton(s.levels, key, levelsLabel(s.levels, explain));
        const label = num(summary ? 0 : ++n);
        return `<section class="part${summary ? " summary" : ""}" id="${ids[i] ?? ""}"${s.varietyLevels}><h2 data-n="${label}">${s.heading}${mark}</h2>${filterEmpty(s.range.from, explain)}${s.html}</section>`;
      })
      .join("\n");
    const section = localize(ref.section.title, explain);
    const minutes = readingMinutes(topic, explain, lang.varieties?.[0]);
    const levels = topicLevels(topic, explain);
    const props = [
      markButton(levels, "topic", levelsLabel(levels, explain)),
      `<span class="prop" title="${escapeHtml(t.readingTime)}">${CLOCK} ${escapeHtml(t.minutes(minutes))}</span>`,
    ].join("");
    const back = (cls: string, href: string, label: string): string =>
      `<a class="ix-up glass tp-back ${cls}" href="${href}" aria-label="${escapeHtml(label)}">${BACK}</a>`;
    const own = topicUrl(explain, lang, ref);
    const head = `<header class="doc-head"><div class="title-row">${back("tp-back-c", trackUrl(explain, lang), course)}${back("tp-back-r", own, t.contents)}<h1>${inline(textIn(topic.title, explain), rctx, false)}</h1><span data-xl-tag hidden></span></div><div data-xl-note hidden></div><p class="props">${props}</p></header>`;
    const { summary } = topic;
    const example = summary.ex === undefined ? "" : ` ${inline(summary.ex, rctx, true, true)}`;
    const intro = `<blockquote><p>${explained(summary.lead, rctx)} ${explained(summary.rule, rctx)}${example}</p></blockquote>`;
    const oneLevel = range.from === range.to ? " one-level" : "";
    const list = parts(all, ids);
    const contents = escapeHtml(t.contents);
    const lesson = `<div class="tp-wrap${oneLevel}"><div class="tp-cols">
<div class="tp-col">
<div class="tp-head" data-topic-explains="${ref.explain.join(" ")}" data-course="${lang.code}" data-course-explains="${explainsOf(lang).join(" ")}">${head}</div>
<main class="tp-main"><article class="doc${oneLevel}">${intro}
<div class="tp-body"><div class="sections lanes">${sections}</div><div class="tp-end">${upNext(track, ref)}${studyPath(track, ref)}</div></div>
</article>
<section class="tp-parts" aria-label="${contents}"><p class="tp-caps">${contents}</p><div class="tp-card"><ol class="tp-list">${list.rows}</ol></div></section>
</main>
</div>
<nav class="tp-outline" aria-label="${contents}"><p class="tp-caps">${contents}</p>${list.outline}</nav>
</div></div>`;
    const body = `<div class="cl" data-cl="topic">
${courseSide(track, { ref, title })}
<div class="cl-main">${lesson}</div>
</div>
${menus(track, { ref, title })}
${levelPopover(explain)}
${levelData(entries)}`;
    ctx.add({
      kind: "topic",
      lang: explain,
      title: `${title} — ${trackTitle}`,
      description: plainText(textIn(summary.lead, explain), reading(explain, false)),
      path: own,
      alternates: alternates((e) => topicUrl(e, lang, ref), track.explains),
      level: true,
      varieties: lang.varieties,
      body,
      about: { name: title, lang: lang.code, topic: ref.id, section, range, minutes },
    });
  }
}
