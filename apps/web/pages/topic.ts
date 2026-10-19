// Topic pages in the frame (frame.css, topic*.css): a glass up link to the track's index, glass groups at the
// top (the course's index; the level, the variety and Read in), the head with the topic's levels, section and
// reading time, the contents column with Up next, and the lesson: the summary, the cheatsheet as 00 and the
// sections numbered, rendered as a lesson (lesson.ts, tables-html.ts). At the bottom, the contents and the
// index, and previous and next as glass capsules; on phones the contents and the index open as sheets.
import { type Explain, LEVELS, localize, say, SITE } from "../../../scripts/lib.ts";
import { join } from "../../../scripts/levels.ts";
import { plainText, reading, textIn, varietyName } from "../../../scripts/text.ts";
import { viewTabs } from "../chrome.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { CLOSE } from "../glyphs.ts";
import { guideSections } from "../guide.ts";
import { escapeHtml, explained, inline } from "../html.ts";
import { capsules, CHEVRON, CLOCK, contents, indexSheet, LIST, num, PRINT, STACK, tools, upNext } from "../lesson-chrome.ts";
import { anchorIds, badge, editUrl, levelAttrs } from "../parts.ts";
import { readingMinutes } from "../reading-time.ts";
import { readMenu } from "../toolbar.ts";
import { BACK, FILTER, GLOBE, pill } from "../track-parts.ts";
import { sectionSheet, sheetUrl, topicUrl, trackUrl } from "../urls.ts";

// What a view shows when the level filter sits below everything in it: a note and a button that sets the level
// where the view starts. views.css shows it for its view below that level.
function filterEmpty(view: "cheatsheet" | "extended", level: string, explain: Explain): string {
  const note = escapeHtml(say("filterEmpty", explain, { level }));
  const show = escapeHtml(say("showLevel", explain, { level }));
  return `<div class="filter-empty ${view}" data-needs="${level}"><p>${note}</p><button type="button" data-set-level="${level}">${show}</button></div>`;
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
    const range = join(all.map((s) => s.range));
    if (range === null) continue;
    const sheetFrom = all.find((s) => s.kind === "cheatsheet")?.range.from ?? range.from;
    const ids = anchorIds(all.map((s) => s.title));
    let n = 0;
    const sections = all
      .map((s, i) => {
        const cheat = s.kind === "cheatsheet";
        return `<section class="part${cheat ? " cheatsheet" : ""}" id="${ids[i] ?? ""}"${levelAttrs(s.range)}${s.varietyLevels}><h2 data-n="${num(cheat ? 0 : ++n)}">${s.heading}${badge(s.range)}</h2>${s.html}</section>`;
      })
      .join("\n");
    const cheat = all.find((s) => s.kind === "cheatsheet");
    const cheatRow =
      cheat === undefined
        ? ""
        : `<button type="button" class="tp-cheat" data-set-view="cheatsheet"${levelAttrs(cheat.range)}><span class="tp-n">00</span><span class="tp-ct">${cheat.heading}</span>${pill(cheat.range)}${CHEVRON}</button>\n`;
    const title = plainText(textIn(topic.title, explain), reading(explain, false));
    const section = localize(ref.section.title, explain);
    const minutes = readingMinutes(topic, explain, lang.varieties?.[0]);
    const props = [
      badge(range),
      `<a class="prop" href="${sheetUrl(explain, lang, sectionSheet(ref))}" title="${escapeHtml(t.sheets)}">${escapeHtml(section)}</a>`,
      `<span class="prop" title="${escapeHtml(t.readingTime)}">${CLOCK} ${escapeHtml(t.minutes(minutes))}</span>`,
    ].join("");
    const head = `<header class="doc-head"><div class="title-row"><span class="page-icon" aria-hidden="true">${lang.flag}</span><h1>${inline(textIn(topic.title, explain), rctx, false)}</h1></div><p class="props">${props}</p>${viewTabs(explain)}</header>`;
    const { summary } = topic;
    const example = summary.ex === undefined ? "" : ` ${inline(summary.ex, rctx, true, true)}`;
    const intro = `<blockquote><p>${explained(summary.lead, rctx)} ${explained(summary.rule, rctx)}${example}</p></blockquote>`;
    const empty = filterEmpty("cheatsheet", sheetFrom, explain) + filterEmpty("extended", range.from, explain);
    const toc = contents(all, ids);
    const next = upNext(track, ref);
    const oneLevel = range.from === range.to ? " one-level" : "";
    const allWord = escapeHtml(t.allLevels);
    const level = `<button type="button" class="tp-btn tp-level" popovertarget="level-panel" aria-haspopup="dialog">${FILTER}<span class="level-dot" aria-hidden="true"></span><span class="tp-label"><span class="sr-only">${escapeHtml(t.level)}: </span><span data-level-label data-all="${allWord}" data-up-to="${escapeHtml(`${t.upTo} {level}`)}">${allWord}</span></span></button>`;
    const varieties = lang.varieties ?? [];
    const [first] = varieties;
    const variety =
      first === undefined
        ? ""
        : `<button type="button" class="tp-btn tp-variety" popovertarget="variety-panel" aria-haspopup="dialog">${GLOBE}<span class="tp-label"><span class="sr-only">${escapeHtml(t.variety)}: </span><span data-variety-label>${escapeHtml(varietyName(first, explain))}</span></span></button>`;
    const levelButtons = LEVELS.map((l) => `<button type="button" class="lvl-${l}" data-set-level="${l}">${l}</button>`).join("");
    const varietyButtons = varieties
      .map((v) => `<button type="button" data-set-variety="${v}">${escapeHtml(varietyName(v, explain))}</button>`)
      .join("");
    const body = `<a class="tp-up glass" href="${trackUrl(explain, lang)}" aria-label="${escapeHtml(course)}">${BACK}</a>
<div class="tp-edge" aria-hidden="true"></div>
<div class="tp-top">
<div class="hm-group glass tp-ixgroup"><button type="button" class="tp-btn tp-index-btn" popovertarget="tp-index" aria-haspopup="dialog">${STACK}<span class="tp-label">${escapeHtml(t.index)}</span></button></div>
<div class="hm-group glass">${level}${variety}${readMenu(
      t,
      readChoices(explain, (e) => topicUrl(e, lang, ref), track.explains),
    )}</div>
</div>
<div class="tp-wrap${oneLevel}">
<div class="tp-head">${head}</div>
<aside class="tp-rail"><p class="tp-caps">${escapeHtml(t.onThisPage)}</p><div class="tp-card tp-contents"><ol class="toc">${toc}</ol></div>${next}</aside>
<main class="tp-main"><article class="doc${oneLevel}">${intro}${empty}${cheatRow}<div class="sections lanes">${sections}</div><div class="tp-end">${next}</div><div class="tp-tools">${tools(editUrl(ref.path), { edit: t.editPage, print: t.print })}</div></article></main>
</div>
<div class="tp-fade" aria-hidden="true"></div>
<nav class="tp-bar" aria-label="${escapeHtml(t.topics)}">
<div class="hm-group glass tp-bar-left"><button type="button" class="tp-btn" popovertarget="tp-contents" aria-haspopup="dialog" aria-label="${escapeHtml(t.contents)}">${LIST}</button><button type="button" class="tp-btn" popovertarget="tp-index" aria-haspopup="dialog" aria-label="${escapeHtml(t.index)}">${STACK}</button></div>
<div class="tp-pagers">${capsules(track, ref)}</div>
</nav>
<div class="tp-sheet" id="tp-contents" popover role="dialog" aria-label="${escapeHtml(t.contents)}">${sheetHead("tp-contents", t.contents, t.close)}<div class="tp-sheet-body"><div class="tp-card tp-contents"><ol class="toc">${toc}</ol><div class="tp-gap"></div><button type="button" class="tp-print" data-print>${PRINT}<span>${escapeHtml(t.print)}</span></button></div></div></div>
<div class="tp-sheet tp-index" id="tp-index" popover role="dialog" aria-label="${escapeHtml(course)}">${sheetHead("tp-index", course, t.close)}<div class="tp-sheet-body">${indexSheet(track, ref)}</div></div>
<div class="panel tp-panel" id="level-panel" popover>${sheetHead("level-panel", t.level, t.close)}<div class="seg">${levelButtons}</div><p class="panel-note">${escapeHtml(t.levelHidden)}</p></div>
${varieties.length === 0 ? "" : `<div class="panel tp-panel" id="variety-panel" popover>${sheetHead("variety-panel", t.variety, t.close)}<div class="seg">${varietyButtons}</div></div>`}`;
    // Printed, each page names where the lesson lives in its footer.
    const foot = `${new URL(SITE.url).host} / ${course} / ${title}`.replace(/\\/g, "").replace(/"/g, "'");
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
      main: "",
      body,
      headTags: [`<style>@media print { @page { @bottom-left { content: "${foot}"; } } }</style>`],
      about: { name: title, lang: lang.code, topic: ref.id, section, range, minutes },
    });
  }
}
