// The parts of a topic page in the frame (pages/topic.ts): the contents, numbered from the cheatsheet's 00, Up
// next, the previous and next capsules, the course's index as a sheet, and the tools at the lesson's end.
import { topicTitle } from "../../scripts/content.ts";
import { levelName, localize, type TopicRef } from "../../scripts/lib.ts";
import { type Range, refRange } from "../../scripts/levels.ts";
import type { Track } from "./context.ts";
import { glyph } from "./glyphs.ts";
import type { GuideSection } from "./guide.ts";
import { escapeHtml } from "./html.ts";
import { levelAttrs, refsRange, single } from "./parts.ts";
import { stepLink } from "./path.ts";
import { placed } from "./sequence.ts";
import { pill } from "./track-parts.ts";
import { topicUrl } from "./urls.ts";

const sym = (body: string, size = 22, width = 1.9): string => glyph(body, size, width);
export const LIST = sym(
  '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
);
export const STACK = sym('<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M6.5 5h11M9 2.5h6"/>');
const PREV = sym('<path d="M15 4.5L7.5 12l7.5 7.5"/>');
const NEXT = sym('<path d="M9 4.5l7.5 7.5L9 19.5"/>');
const RESTART = sym('<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>', 20);
export const PRINT = sym(
  '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="7" y="14" width="10" height="7"/>',
  20,
);
const PENCIL = sym('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 20);
export const CHEVRON =
  '<svg class="tp-chev" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5"/></svg>';
const TICK =
  '<svg class="tp-tick" width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 7.5l4.5 4.5L14.5 1.5"/></svg>';
export const CLOCK =
  '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.6" stroke="currentColor" stroke-width="1.4"/><path d="M7 4v3.2l2 1.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

export const num = (n: number): string => String(n).padStart(2, "0");

// The contents: the cheatsheet as 00, opening the Cheatsheet view, then each section numbered, with its range.
export function contents(sections: GuideSection[], ids: string[]): string {
  let n = 0;
  return sections
    .map((s, i) => {
      const cheat = s.kind === "cheatsheet";
      const label = cheat ? 0 : ++n;
      return `<li${cheat ? "" : ' class="guide"'}${levelAttrs(s.range)}${s.varietyLevels}><a href="#${ids[i] ?? ""}"${cheat ? ' data-set-view="cheatsheet"' : ""}><span class="tp-n">${num(label)}</span><span class="name">${s.heading}</span>${pill(s.range)}</a></li>`;
    })
    .join("");
}

// Up next: the next page, or the first to start over, with its range and first sentence.
export const upNext = (track: Track, ref: TopicRef): string =>
  placed(track, ref)
    .flatMap(({ attrs, around: a }) => {
      const e = a.next;
      if (e === undefined) return [];
      const range = refRange(e.ref, track.explain) ?? single(e.level);
      return [
        `<div class="up-next"${attrs}><p class="tp-caps">${escapeHtml(a.restart ? track.t.startOver : track.t.upNext)}</p><a class="next" ${e.link}><strong>${escapeHtml(e.title)}</strong>${pill(e.link.includes("data-path-step") ? single(e.level) : range)}${CHEVRON}<span class="summary">${escapeHtml(e.summary)}</span></a></div>`,
      ];
    })
    .join("");

// Previous and next as glass capsules, per grouping and level; a side with nowhere to go back stays, inactive.
export function capsules(track: Track, ref: TopicRef): string {
  const { t } = track;
  return placed(track, ref)
    .map(({ attrs, around: a }) => {
      const prev =
        a.prev === undefined
          ? `<span class="tp-side tp-prev tp-off" aria-disabled="true" aria-label="${escapeHtml(`${t.previous}:`)}">${PREV}<span class="tp-pt"></span></span>`
          : `<a class="tp-side tp-prev" ${a.prev.link} aria-label="${escapeHtml(`${t.previous}: ${a.prev.title}`)}">${PREV}<span class="tp-pt">${escapeHtml(a.prev.title)}</span></a>`;
      const next =
        a.next === undefined
          ? ""
          : a.restart
            ? `<a class="tp-side tp-next tp-restart" ${a.next.link} aria-label="${escapeHtml(t.startOver)}"><span class="tp-pt tp-start">${escapeHtml(t.startOver)}</span>${RESTART}</a>`
            : `<a class="tp-side tp-next" ${a.next.link} aria-label="${escapeHtml(`${t.next}: ${a.next.title}`)}"><span class="tp-pt">${escapeHtml(a.next.title)}</span>${NEXT}</a>`;
      return `<nav class="tp-pager glass"${attrs}>${prev}<span class="tp-div" aria-hidden="true"></span>${next}</nav>`;
    })
    .join("");
}

interface IndexRow {
  href: string;
  attrs: string;
  name: string;
  range?: Range;
  on: boolean;
  mark: string;
}
const indexRow = (r: IndexRow): string =>
  `<li${r.attrs}><a class="tp-row${r.on ? " on" : ""}" ${r.href}${r.attrs}${r.mark}><span class="tp-rn">${escapeHtml(r.name)}</span>${r.range === undefined ? "" : pill(r.range)}${TICK}${CHEVRON}</a></li>`;
const indexSection = (attrs: string, head: string, rows: IndexRow[]): string =>
  `<section class="tp-ix-sec"${attrs}><h2 class="tp-ix-h">${head}</h2><ol class="tp-ix-rows">${rows.map(indexRow).join("")}</ol></section>`;

// The course's index as the sheet holds it: the order switch, a card per category and per level of the path.
export function indexSheet(track: Track, ref: TopicRef): string {
  const { ctx, lang, explain, t } = track;
  const categories = lang.sections.flatMap((section) => {
    const refs = ctx.refs.filter((r) => r.lang === lang.code && r.section === section);
    const range = refsRange(refs, explain);
    if (range === null) return [];
    const rows = refs.flatMap((r): IndexRow[] => {
      const own = refRange(r, explain);
      if (r.topic === null) return [];
      const on = r === ref;
      return [
        {
          href: `href="${topicUrl(explain, lang, r)}"`,
          attrs: levelAttrs(own),
          name: topicTitle(r, explain),
          ...(own === null ? {} : { range: own }),
          on,
          mark: on ? ' aria-current="page"' : "",
        },
      ];
    });
    return [
      indexSection(
        levelAttrs(range),
        `<span class="tp-n">${section.dir.slice(0, 2)}</span><span>${escapeHtml(localize(section.title, explain))}</span>`,
        rows,
      ),
    ];
  });
  const path = track.path.map((stage) => {
    const level = single(stage.level);
    const rows = stage.steps.map((s): IndexRow => ({
      href: stepLink(s.href, s.level),
      attrs: levelAttrs(level),
      name: topicTitle(s.ref, explain),
      on: s.ref === ref,
      mark: "",
    }));
    return indexSection(levelAttrs(level), `${pill(level)}<span>${escapeHtml(levelName(stage.level, explain))}</span>`, rows);
  });
  const seg = `<button type="button" data-set-order="categories">${escapeHtml(t.categories)}</button><button type="button" data-set-order="path">${escapeHtml(t.byLevel)}</button>`;
  return `<div class="tp-seg" role="group" aria-label="${escapeHtml(t.grouping)}">${seg}</div><div class="nav-list" data-order="categories">${categories.join("")}</div><div class="nav-list" data-order="path">${path.join("")}</div>`;
}

// The lesson's end: edit its file on GitHub, and print it.
export const tools = (edit: string | undefined, words: { edit: string; print: string }): string =>
  `<div class="page-tools">${edit === undefined ? "" : `<a class="page-tool edit" href="${edit}" rel="noopener">${PENCIL}<span>${escapeHtml(words.edit)}</span></a>`}<button class="page-tool" type="button" data-print>${PRINT}<span>${escapeHtml(words.print)}</span></button></div>`;
