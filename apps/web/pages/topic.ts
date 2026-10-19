// Topic pages: the cheatsheet as section 00, the guide in numbered sections, and the rail beside them.
import { type Explain, localize, say } from "../../../scripts/lib.ts";
import { join } from "../../../scripts/levels.ts";
import { alternates, readChoices, type Track } from "../context.ts";
import { guideSections } from "../guide.ts";
import { pageTools, viewTabs } from "../chrome.ts";
import { trackCrumb, trackNav } from "../nav.ts";
import { readingMinutes } from "../reading-time.ts";
import { barNext, pagers, upNext } from "../sequence.ts";
import { plainText, reading, textIn } from "../../../scripts/text.ts";
import { anchorIds, badge, editUrl, levelAttrs, listBadge } from "../parts.ts";
import { escapeHtml, explained, inline } from "../html.ts";
import { searchUrl, sectionSheet, sheetUrl, topicUrl } from "../urls.ts";

// What a view shows when the level filter sits below everything in it: a note and a button that
// sets the level where the view starts. views.css shows it for its view below that level.
function filterEmpty(view: "cheatsheet" | "extended", level: string, explain: Explain): string {
  const note = escapeHtml(say("filterEmpty", explain, { level }));
  const show = escapeHtml(say("showLevel", explain, { level }));
  return `<div class="filter-empty ${view}" data-needs="${level}"><p>${note}</p><button type="button" data-set-level="${level}">${show}</button></div>`;
}

export function topicPages(track: Track): void {
  const { ctx, lang, explain, t, title: trackTitle, written } = track;
  for (const ref of written) {
    const topic = ref.topic;
    if (topic === null) continue;
    const rctx = { ref, explain, refs: ctx.refs, link: ctx.link, varieties: lang.varieties };
    const all = guideSections(rctx);
    const range = join(all.map((s) => s.range));
    if (range === null) continue;
    const sheetFrom = all.find((s) => s.kind === "cheatsheet")?.range.from ?? range.from;
    const empty = filterEmpty("cheatsheet", sheetFrom, explain) + filterEmpty("extended", range.from, explain);
    const ids = anchorIds(all.map((s) => s.title));
    const idOf = new Map(all.map((s, i) => [s, ids[i] ?? ""]));
    const sections = all
      .map((s) => {
        const cls = s.kind === "cheatsheet" ? "part cheatsheet" : "part";
        const anchor = idOf.get(s);
        const id = anchor === undefined ? "" : ` id="${anchor}"`;
        return `<section class="${cls}"${id}${levelAttrs(s.range)}${s.varietyLevels}><h2>${s.heading}${badge(s.range)}</h2>${s.html}</section>`;
      })
      .join("\n");

    // Rail: the cheatsheet, then the guide sections with their ranges, which the Extended view
    // lists, and the next topic.
    const tocItems = all.map((s) => {
      const guide = s.kind === "cheatsheet" ? "" : ' class="guide"';
      return `<li${guide}${levelAttrs(s.range)}${s.varietyLevels}><a href="#${idOf.get(s) ?? ""}"><span class="name">${s.heading}</span>${listBadge(s.range)}</a></li>`;
    });
    const rail = `<h4>${escapeHtml(t.onThisPage)}</h4><ol class="toc">${tocItems.join("")}</ol>${upNext(track, ref)}`;
    const title = plainText(textIn(topic.title, explain), reading(explain, false));
    const section = localize(ref.section.title, explain);
    const minutes = readingMinutes(topic, explain, lang.varieties?.[0]);
    const props = [
      badge(range),
      `<a class="prop" href="${sheetUrl(explain, lang, sectionSheet(ref))}" title="${escapeHtml(t.sheets)}">${escapeHtml(section)}</a>`,
      `<span class="prop" title="${escapeHtml(t.readingTime)}"><span aria-hidden="true">◷</span> ${escapeHtml(t.minutes(minutes))}</span>`,
    ].join("");
    const head =
      `<header class="doc-head"><div class="title-row"><span class="page-icon" aria-hidden="true">${lang.flag}</span><h1>${inline(textIn(topic.title, explain), rctx, false)}</h1></div>` +
      `<p class="props">${props}</p><div class="lesson-bar">${viewTabs(explain)}</div></header>`;
    // The summary: its lead, its rule and the rule's examples, read as one paragraph.
    const { summary } = topic;
    const example = summary.ex === undefined ? "" : ` ${inline(summary.ex, rctx, true, true)}`;
    const intro = `<blockquote><p>${explained(summary.lead, rctx)} ${explained(summary.rule, rctx)}${example}</p></blockquote>`;
    ctx.add({
      kind: "topic",
      lang: explain,
      title: `${title} — ${trackTitle}`,
      description: plainText(textIn(summary.lead, explain), reading(explain, false)),
      path: topicUrl(explain, lang, ref),
      alternates: alternates((e) => topicUrl(e, lang, ref), track.explains),
      read: readChoices(explain, (e) => topicUrl(e, lang, ref), track.explains),
      level: true,
      crumbs: [trackCrumb(track, trackTitle), { label: section }, { label: title }],
      about: { name: title, lang: lang.code, topic: ref.id, section, range, minutes },
      search: [searchUrl(explain, lang)],
      varieties: lang.varieties,
      nav: trackNav(track, ref),
      rail,
      next: barNext(track, ref),
      main: `<article class="doc${range.from === range.to ? " one-level" : ""}">${head}${intro}${empty}<div class="sections lanes">${sections}</div>${pagers(track, ref, "bottom")}${pageTools(t, editUrl(ref.path))}</article>`,
    });
  }
}
