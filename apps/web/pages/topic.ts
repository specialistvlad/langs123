// Topic pages in the frame (frame.css, topic*.css) as a split view (split.ts): above 860px the left pane holds the
// topic's contents (the numbered parts with their level marks, the part being read marked) under a title row with Back
// to the course and the list button, and the search at its top; the right pane holds the lesson (the head with the
// topic's level mark and reading time, its lead, the summary as 00 and the sections numbered, rendered as a lesson
// by lesson.ts and tables-html.ts, then Up next and the study path) with the glass group of Level, Variety and Read
// in at its top right. A level mark opens the level popover: what each level covers in the topic or the section; the
// group's Level button opens it headed by the course. On a phone the lesson is the page: Back shares the title row
// with the topic's title, and the bottom bar holds Contents (a sheet), the group and a round Search button that opens
// the field (client-home.ts) over the results.
import { type Explain, localize, say } from "../../../scripts/lib.ts";
import { join, topicLevels } from "../../../scripts/levels.ts";
import { plainText, reading, textIn, varietyName } from "../../../scripts/text.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { CLOSE } from "../glyphs.ts";
import { guideParts, guideSections } from "../guide.ts";
import { escapeHtml, explained, inline } from "../html.ts";
import { CLOCK, contents, LIST, num, studyPath, upNext } from "../lesson-chrome.ts";
import { levelsLabel, markButton } from "../level-mark.ts";
import { courseEntry, type LevelEntry, levelData, levelPopover, sectionEntry, topicEntry } from "../level-popover.ts";
import { anchorIds } from "../parts.ts";
import { readingMinutes } from "../reading-time.ts";
import { searchFilters } from "../search-filters.ts";
import { listButton, split } from "../split.ts";
import { closeButton, readMenu, results, searchButton, searchForm } from "../toolbar.ts";
import { topicParts } from "../topic-parts.ts";
import { BACK, GLOBE, item, levelButton } from "../track-parts.ts";
import type { Ui } from "../ui.ts";
import { topicUrl, trackUrl } from "../urls.ts";

// What a section shows when the level filter sits below everything in it: a note naming the filter's level
// (client-chips.ts) and where the section starts, and a button that sets the level there. levels.css shows it.
function filterEmpty(start: string, explain: Explain): string {
  const note = escapeHtml(say("sectionEmpty", explain, { level: "\u0000", start })).replace("\u0000", "<span data-level-now></span>");
  const show = escapeHtml(say("showLevel", explain, { level: start }));
  return `<div class="filter-empty" data-needs="${start}"><p>${note}</p><button type="button" data-set-level="${start}">${show}</button></div>`;
}

// The variety menu: what the choice hides, then the varieties (under the tools' group on a wide screen).
const varietyMenu = (t: Ui, varieties: { code: string; name: string }[]): string =>
  `<div class="ix-menu ix-menu-variety" id="ix-varieties" data-sp-extras popover role="menu" aria-label="${escapeHtml(t.variety)}"><p class="ix-hint">${escapeHtml(t.varietyHidden)}</p>${varieties.map((v) => item(`data-set-variety="${v.code}"`, v.name, false)).join("")}</div>`;

// A sheet's or a panel's head: its title and Close.
const sheetHead = (id: string, title: string, close: string): string =>
  `<header class="tp-sheet-head"><h2>${escapeHtml(title)}</h2><button type="button" class="tp-x glass" popovertarget="${id}" popovertargetaction="hide" aria-label="${escapeHtml(close)}">${CLOSE}</button></header>`;

export function topicPages(track: Track): void {
  const { ctx, lang, explain, t, title: trackTitle, written } = track;
  const course = localize(lang.name, explain);
  const held = courseEntry(course, track.langRefs, explain);
  const courseLevels = { key: lang.code, levels: Object.keys(held.l) };
  for (const ref of written) {
    const topic = ref.topic;
    if (topic === null) continue;
    const rctx = { ref, explain, refs: ctx.refs, link: ctx.link, varieties: lang.varieties, lesson: true };
    const all = guideSections(rctx);
    const parts = guideParts(topic, explain);
    const range = join(all.map((s) => s.range));
    if (range === null) continue;
    const ids = anchorIds(all.map((s) => s.title));
    const title = plainText(textIn(topic.title, explain), reading(explain, false));
    const entries: Record<string, LevelEntry> = { topic: topicEntry(title, parts, explain), [lang.code]: held };
    let n = 0;
    const sections = all
      .map((s, i) => {
        const summary = s.kind === "summary";
        const key = `s${String(i)}`;
        entries[key] = sectionEntry(s.title, parts[i]?.content ?? [], explain);
        const mark = markButton(s.levels, key, levelsLabel(s.levels, explain));
        return `<section class="part${summary ? " summary" : ""}" id="${ids[i] ?? ""}"${s.varietyLevels}><h2 data-n="${num(summary ? 0 : ++n)}">${s.heading}${mark}</h2>${filterEmpty(s.range.from, explain)}${s.html}</section>`;
      })
      .join("\n");
    const section = localize(ref.section.title, explain);
    const minutes = readingMinutes(topic, explain, lang.varieties?.[0]);
    const levels = topicLevels(topic, explain);
    const props = [
      markButton(levels, "topic", levelsLabel(levels, explain)),
      `<span class="prop" title="${escapeHtml(t.readingTime)}">${CLOCK} ${escapeHtml(t.minutes(minutes))}</span>`,
    ].join("");
    const up = `<a class="tp-up glass" href="${trackUrl(explain, lang)}" aria-label="${escapeHtml(course)}">${BACK}</a>`;
    const head = `<header class="doc-head"><div class="title-row">${up}<span class="page-icon" aria-hidden="true">${lang.flag}</span><h1>${inline(textIn(topic.title, explain), rctx, false)}</h1></div><p class="props">${props}</p></header>`;
    const { summary } = topic;
    const example = summary.ex === undefined ? "" : ` ${inline(summary.ex, rctx, true, true)}`;
    const intro = `<blockquote><p>${explained(summary.lead, rctx)} ${explained(summary.rule, rctx)}${example}</p></blockquote>`;
    const oneLevel = range.from === range.to ? " one-level" : "";
    const varieties = (lang.varieties ?? []).map((v) => ({ code: v, name: varietyName(v, explain) }));
    const [first] = varieties;
    const variety =
      first === undefined
        ? ""
        : `<button type="button" class="tp-btn tp-variety" popovertarget="ix-varieties" aria-haspopup="menu">${GLOBE}<span class="tp-label"><span class="sr-only">${escapeHtml(say("labelled", explain, { label: t.variety, value: "" }))}</span><span data-variety-label>${escapeHtml(first.name)}</span></span></button>`;
    const read = readChoices(explain, (e) => topicUrl(e, lang, ref), track.explains);
    // The pane's tools (wide) and the bottom bar's group (phone) hold the same three controls.
    const controls = `${levelButton(explain, { level: t.level, all: t.allLevels }, "lv-pop", "tp-btn tp-level", "tp-label", courseLevels)}${variety}${readMenu(t, read)}`;
    const left = `<div class="sp-title">
<a class="sp-back glass" href="${trackUrl(explain, lang)}" aria-label="${escapeHtml(course)}">${BACK}</a>
${listButton(t)}
<span class="tp-name">${escapeHtml(title)}</span>
</div>
<nav class="hm-bar tp-sbar" aria-label="${escapeHtml(t.search)}">${searchForm(t)}${closeButton(t)}</nav>
<div class="hm-main tp-results">
<div id="hm-cards" class="tp-index${oneLevel}"><p class="tp-caps">${escapeHtml(t.contents)}</p><div class="tp-card tp-contents"><ol class="toc">${contents(all, ids, explain, true)}</ol></div></div>
${results(t, searchFilters(t, explain, ctx.languages, read, lang.code))}
</div>`;
    const lesson = `<div class="tp-wrap${oneLevel}">
<div class="tp-head">${head}</div>
<main class="tp-main"><article class="doc${oneLevel}">${intro}<div class="sections lanes">${sections}</div><div class="tp-end">${upNext(track, ref)}${studyPath(track, ref)}</div></article></main>
</div>`;
    const body = `${split({
      t,
      cls: "sp-topic sp-item",
      left,
      tools: `<div class="hm-group glass tp-tools" data-sp-tools>${controls}</div>`,
      body: lesson,
      open: topicUrl(explain, lang, ref),
    })}
${topicParts(track, ref, { all, ids, props, lead: explained(summary.lead, rctx) })}
<div class="tp-fade" aria-hidden="true"></div>
<nav class="tp-bar" aria-label="${escapeHtml(t.topics)}">
<div class="hm-group glass tp-bar-left"><button type="button" class="tp-btn" popovertarget="tp-contents" aria-haspopup="dialog" aria-label="${escapeHtml(t.contents)}">${LIST}</button></div>
<div class="hm-group glass">${controls}</div>
${searchButton(t)}
</nav>
<div class="tp-sheet" id="tp-contents" popover role="dialog" aria-label="${escapeHtml(t.contents)}">${sheetHead("tp-contents", t.contents, t.close)}<div class="tp-sheet-body"><div class="tp-card tp-contents"><ol class="toc">${contents(all, ids, explain)}</ol></div></div></div>
${varieties.length === 0 ? "" : varietyMenu(t, varieties)}
${levelPopover(explain)}
${levelData(entries)}`;
    ctx.add({
      kind: "topic",
      lang: explain,
      title: `${title} — ${trackTitle}`,
      description: plainText(textIn(summary.lead, explain), reading(explain, false)),
      path: topicUrl(explain, lang, ref),
      alternates: alternates((e) => topicUrl(e, lang, ref), track.explains),
      read,
      level: true,
      varieties: lang.varieties,
      body,
      about: { name: title, lang: lang.code, topic: ref.id, section, range, minutes },
    });
  }
}
