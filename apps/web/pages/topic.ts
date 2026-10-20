// Topic pages in the frame (frame.css, topic*.css): a glass up link to the track's index, glass groups at the
// top (the course's index; the level, the variety and Read in), the head with the topic's level mark and reading
// time, the lesson: its lead, the summary as 00 and the sections numbered, rendered as a lesson (lesson.ts,
// tables-html.ts), and the contents column with Up next beside it. A level mark opens the level popover: what each
// level covers in the topic or the section. At the bottom, the contents and the index, and previous and next as
// glass capsules; on phones the contents and the index open as sheets.
import { type Explain, localize, say } from "../../../scripts/lib.ts";
import { join, topicLevels } from "../../../scripts/levels.ts";
import { plainText, reading, textIn, varietyName } from "../../../scripts/text.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { CLOSE } from "../glyphs.ts";
import { guideParts, guideSections } from "../guide.ts";
import { escapeHtml, explained, inline } from "../html.ts";
import { capsules, CLOCK, contents, indexSheet, LIST, num, STACK, upNext } from "../lesson-chrome.ts";
import { levelsLabel, markButton } from "../level-mark.ts";
import { type LevelEntry, levelData, levelPopover, sectionEntry, topicEntry } from "../level-popover.ts";
import { anchorIds } from "../parts.ts";
import { readingMinutes } from "../reading-time.ts";
import { readMenu } from "../toolbar.ts";
import { BACK, GLOBE, levelButton, levelMenu, varietyMenu } from "../track-parts.ts";
import { topicUrl, trackUrl } from "../urls.ts";

// What a section shows when the level filter sits below everything in it: a note naming the filter's level
// (client-chips.ts) and where the section starts, and a button that sets the level there. levels.css shows it.
function filterEmpty(start: string, explain: Explain): string {
  const note = escapeHtml(say("sectionEmpty", explain, { level: "\u0000", start })).replace("\u0000", "<span data-level-now></span>");
  const show = escapeHtml(say("showLevel", explain, { level: start }));
  return `<div class="filter-empty" data-needs="${start}"><p>${note}</p><button type="button" data-set-level="${start}">${show}</button></div>`;
}

// A sheet's or a panel's head: its title and Close.
const sheetHead = (id: string, title: string, close: string): string =>
  `<header class="tp-sheet-head"><h2>${escapeHtml(title)}</h2><button type="button" class="tp-x glass" popovertarget="${id}" popovertargetaction="hide" aria-label="${escapeHtml(close)}">${CLOSE}</button></header>`;

export function topicPages(track: Track): void {
  const { ctx, lang, explain, t, title: trackTitle, written } = track;
  const course = localize(lang.name, explain);
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
    const entries: Record<string, LevelEntry> = { topic: topicEntry(title, parts, explain) };
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
    const head = `<header class="doc-head"><div class="title-row"><span class="page-icon" aria-hidden="true">${lang.flag}</span><h1>${inline(textIn(topic.title, explain), rctx, false)}</h1></div><p class="props">${props}</p></header>`;
    const { summary } = topic;
    const example = summary.ex === undefined ? "" : ` ${inline(summary.ex, rctx, true, true)}`;
    const intro = `<blockquote><p>${explained(summary.lead, rctx)} ${explained(summary.rule, rctx)}${example}</p></blockquote>`;
    const toc = contents(all, ids, explain);
    const next = upNext(track, ref);
    const oneLevel = range.from === range.to ? " one-level" : "";
    const varieties = (lang.varieties ?? []).map((v) => ({ code: v, name: varietyName(v, explain) }));
    const [first] = varieties;
    const variety =
      first === undefined
        ? ""
        : `<button type="button" class="tp-btn tp-variety" popovertarget="ix-varieties" aria-haspopup="menu">${GLOBE}<span class="tp-label"><span class="sr-only">${escapeHtml(t.variety)}: </span><span data-variety-label>${escapeHtml(first.name)}</span></span></button>`;
    const body = `<a class="tp-up glass" href="${trackUrl(explain, lang)}" aria-label="${escapeHtml(course)}">${BACK}</a>
<div class="tp-edge" aria-hidden="true"></div>
<div class="tp-top">
<div class="hm-group glass tp-ixgroup"><button type="button" class="tp-btn tp-index-btn" popovertarget="tp-index" aria-haspopup="dialog">${STACK}<span class="tp-label">${escapeHtml(t.index)}</span></button></div>
<div class="hm-group glass">${levelButton(explain, { level: t.level, all: t.allLevels }, "tp-levels", "tp-btn tp-level", "tp-label")}${variety}${readMenu(
      t,
      readChoices(explain, (e) => topicUrl(e, lang, ref), track.explains),
    )}</div>
</div>
<div class="tp-wrap${oneLevel}">
<div class="tp-head">${head}</div>
<aside class="tp-rail"><p class="tp-caps">${escapeHtml(t.onThisPage)}</p><div class="tp-card tp-contents"><ol class="toc">${toc}</ol></div>${next}</aside>
<main class="tp-main"><article class="doc${oneLevel}">${intro}<div class="sections lanes">${sections}</div><div class="tp-end">${next}</div></article></main>
</div>
<div class="tp-fade" aria-hidden="true"></div>
<nav class="tp-bar" aria-label="${escapeHtml(t.topics)}">
<div class="hm-group glass tp-bar-left"><button type="button" class="tp-btn" popovertarget="tp-contents" aria-haspopup="dialog" aria-label="${escapeHtml(t.contents)}">${LIST}</button><button type="button" class="tp-btn" popovertarget="tp-index" aria-haspopup="dialog" aria-label="${escapeHtml(t.index)}">${STACK}</button></div>
<div class="tp-pagers">${capsules(track, ref)}</div>
</nav>
<div class="tp-sheet" id="tp-contents" popover role="dialog" aria-label="${escapeHtml(t.contents)}">${sheetHead("tp-contents", t.contents, t.close)}<div class="tp-sheet-body"><div class="tp-card tp-contents"><ol class="toc">${toc}</ol></div></div></div>
<div class="tp-sheet tp-index" id="tp-index" popover role="dialog" aria-label="${escapeHtml(course)}">${sheetHead("tp-index", course, t.close)}<div class="tp-sheet-body">${indexSheet(track, ref)}</div></div>
${levelMenu(explain, [ref], { level: t.level, hint: t.levelHidden, all: t.allLevels }, "tp-levels")}
${varieties.length === 0 ? "" : varietyMenu(t.variety, varieties)}
${levelPopover(explain)}
${levelData(entries)}`;
    ctx.add({
      kind: "topic",
      lang: explain,
      title: `${title} — ${trackTitle}`,
      description: plainText(textIn(summary.lead, explain), reading(explain, false)),
      path: topicUrl(explain, lang, ref),
      alternates: alternates((e) => topicUrl(e, lang, ref), track.explains),
      read: readChoices(explain, (e) => topicUrl(e, lang, ref), track.explains),
      level: true,
      varieties: lang.varieties,
      body,
      about: { name: title, lang: lang.code, topic: ref.id, section, range, minutes },
    });
  }
}
