// The parts of a track's index (pages/track.ts) in the frame: the topics as inset lists under prominent
// headers that end with their topic count, a card per category or per level of the study path, each topic a row of its
// title and a chevron, and the toolbar's level, variety and group menus.
import { topicTitle } from "../../scripts/content.ts";
import { count, type Explain, type Level, LEVEL_INFO, levelName, localize, say, type TopicRef } from "../../scripts/lib.ts";
import type { Range } from "../../scripts/levels.ts";
import { refRange } from "../../scripts/levels.ts";
import type { Track } from "./context.ts";
import { glyph } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";
import { levelAttrs, single } from "./parts.ts";
import { countsByLevel, moreRows } from "./track-more.ts";
import { topicUrl } from "./urls.ts";

export const CHEVRON =
  '<svg class="ix-chev" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5"/></svg>';
export const TICK =
  '<svg width="15" height="13" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 7.5l4.5 4.5L14.5 1.5"/></svg>';
export const FILTER = glyph('<path d="M4 7h16M7 12h10M10 17h4"/>', 20, 2);
export const GLOBE = glyph(
  '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c2.8 2.7 4.2 5.9 4.2 9.5s-1.4 6.8-4.2 9.5c-2.8-2.7-4.2-5.9-4.2-9.5s1.4-6.8 4.2-9.5z"/>',
  20,
  2,
);
// list.bullet.indent: the Group button's symbol.
export const GROUP = glyph(
  '<circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none"/><path d="M8.5 6H21"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><path d="M13.5 12H21"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><path d="M13.5 18H21"/>',
  20,
  1.9,
);
export const CHOOSE_TOPIC = glyph(
  '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  44,
  1.6,
);
export const BACK =
  '<svg width="13" height="22" viewBox="0 0 13 22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 2L2.5 11l8 9"/></svg>';

// A level pill: one level, or two joined halves.
const half = (level: string): string => `<span class="half lvl-${level}">${level}</span>`;
export const pill = (r: Range): string =>
  `<span class="badge lvl" data-from="${r.from}" data-to="${r.to}">${r.from === r.to ? half(r.from) : `${half(r.from)}<span class="sr-only">–</span>${half(r.to)}`}</span>`;

interface Row {
  attrs: string;
  name: string;
  href: string;
  step?: string;
  // The explanation languages the topic is written in (the Languages client's, for its "EN" tag and note).
  explains: string;
  // The topic is the one the page shows.
  current: boolean;
}
// A row: the topic's link over the whole row, the tag the Languages client shows for a topic in another language, and a chevron; the topic the page shows is marked current.
function row(r: Row): string {
  const step = r.step === undefined ? "" : ` data-path-step="${r.step}"`;
  const here = r.current ? ' aria-current="true"' : "";
  return `<li${r.attrs} data-topic-explains="${r.explains}"${r.current ? " data-current" : ""}><span class="ix-row"><a class="ix-cover" href="${r.href}"${step}${here}><span class="ix-name">${escapeHtml(r.name)}</span></a><span data-xl-tag hidden></span>${CHEVRON}</span></li>`;
}
// A list of rows, its Show more row (track-more.ts) last; the heading ends with the count of its topics.
const list = (attrs: string, head: string, total: string, rows: Row[], more: string): string =>
  `<section class="ix-sec"${attrs}><h2 class="ix-h">${head}${total}</h2><ol class="ix-rows">${rows.map(row).join("")}${more}</ol></section>`;

// A topic counts by its lowest level: the level it starts at.
const lowest = (ref: TopicRef, explain: Explain): Level | undefined => refRange(ref, explain)?.from;
const lowests = (refs: TopicRef[], explain: Explain): Level[] => refs.flatMap((r) => lowest(r, explain) ?? []);

// A heading's count; it follows the chosen level (client-chips.ts).
const counted = (refs: TopicRef[], explain: Explain): string =>
  `<span class="ix-count ix-sec-n" data-counts="${escapeHtml(
    countsByLevel(
      refs.map((r) => lowest(r, explain) ?? null),
      explain,
    ),
  )}">${escapeHtml(count("topics", explain, refs.length))}</span>`;

// The topics by category: a card per section of the curriculum holding written topics, each topic a row, the section
// staying while the chosen level hides some of its topics; `current` is the topic the page shows.
export function byCategory(track: Track, current?: TopicRef): string {
  const { lang, explain, langRefs } = track;
  return lang.sections
    .map((section) => {
      const refs = langRefs.filter((r) => r.section === section && r.topic !== null);
      if (refs.length === 0) return "";
      const rows = refs.map((ref): Row => ({
        attrs: levelAttrs(refRange(ref, explain)),
        name: topicTitle(ref, explain),
        href: topicUrl(explain, lang, ref),
        explains: ref.explain.join(" "),
        current: ref === current,
      }));
      const head = `<span class="ix-ht"><span class="ix-num">${section.dir.slice(0, 2)}</span><span>${escapeHtml(localize(section.title, explain))}</span></span>`;
      return list("", head, counted(refs, explain), rows, moreRows(lowests(refs, explain), explain));
    })
    .join("");
}

// The topics along the study path: a card per level, each step leading where its level starts, and one Show more row
// for the levels the chosen level hides.
export function byLevel(track: Track, current?: TopicRef): string {
  const { explain } = track;
  const cards = track.path.map((stage) => {
    const level = single(stage.level);
    const rows = stage.steps.map((s): Row => ({
      attrs: levelAttrs(level),
      name: topicTitle(s.ref, explain),
      href: s.href,
      step: stage.level.toLowerCase(),
      explains: s.ref.explain.join(" "),
      current: s.ref === current,
    }));
    // The level's code set as Categories' section number, then its name.
    const head = `<span class="ix-ht"><span class="ix-num">${stage.level}</span><span>${escapeHtml(levelName(stage.level, explain))}</span></span>`;
    const n = `<span class="ix-count ix-sec-n">${escapeHtml(count("topics", explain, rows.length))}</span>`;
    return list(levelAttrs(level), head, n, rows, "");
  });
  const refs = new Map(track.path.flatMap((stage) => stage.steps.map((s) => [s.ref.id, s.ref] as const)));
  const more = moreRows(lowests([...refs.values()], explain), explain);
  return cards.join("") + (more === "" ? "" : `<section class="ix-sec-more"><ol class="ix-rows">${more}</ol></section>`);
}

// A menu's item: a tick, its title and what it says, and an end piece (a pill, a glyph).
export const item = (data: string, title: string, on: boolean, sub = "", end = ""): string =>
  `<button type="button" role="menuitemradio" class="ix-item" ${data} aria-checked="${String(on)}"><span class="ix-tick" aria-hidden="true">${TICK}</span><span class="ix-text"><span class="ix-title">${escapeHtml(title)}</span>${sub === "" ? "" : `<span class="ix-sub">${escapeHtml(sub)}</span>`}</span>${end}</button>`;

// The variety menu of a language with varieties; a topic page's begins with what the choice hides.
export const varietyMenu = (title: string, varieties: { code: string; name: string }[], hint = ""): string =>
  `<div class="ix-menu ix-menu-variety" id="ix-varieties" popover role="menu" aria-label="${escapeHtml(title)}">${hint === "" ? "" : `<p class="ix-hint">${escapeHtml(hint)}</p>`}${varieties.map((v) => item(`data-set-variety="${v.code}"`, v.name, false)).join("")}</div>`;

// The Group button of a course's toolbars: it opens "Group by" with Categories and By level (client-track.ts ticks the
// one in force).
export const groupButton = (title: string, cls = "ix-btn ix-group"): string =>
  `<button type="button" class="${cls}" popovertarget="ix-groups" aria-haspopup="menu" aria-label="${escapeHtml(title)}" title="${escapeHtml(title)}">${GROUP}</button>`;
export const groupMenu = (t: { groupBy: string; categories: string; byLevel: string }): string =>
  `<div class="ix-menu ix-menu-group" id="ix-groups" popover role="menu" aria-label="${escapeHtml(t.groupBy)}"><p class="ix-menu-h">${escapeHtml(t.groupBy)}</p>${item('data-set-order="categories"', t.categories, false)}${item('data-set-order="path"', t.byLevel, false)}</div>`;

// The level button of a course's pages: All levels or the chosen level's name (client-chips.ts); it opens the level
// popover `target` of the course (`course`: its key in the page's level data and the levels it holds) under the
// toolbar's group (client-levels.ts).
export function levelButton(
  explain: Explain,
  words: { level: string; all: string },
  target: string,
  cls = "ix-btn ix-level",
  label = "ix-label",
  course: { key: string; levels: string[] },
  extra = "",
): string {
  const names = Object.fromEntries(LEVEL_INFO.map((l) => [l.code, levelName(l.code, explain)]));
  const all = escapeHtml(words.all);
  const opens = ` aria-haspopup="dialog" data-lv="${escapeHtml(course.key)}" data-lv-levels="${course.levels.join(" ")}" data-lv-under=".cl-tools, .cl-bar"${extra}`;
  return `<button type="button" class="${cls}" popovertarget="${target}"${opens}>${FILTER}<span class="${label}"><span class="sr-only">${escapeHtml(say("labelled", explain, { label: words.level, value: "" }))}</span><span data-level-label data-all="${all}" data-names="${escapeHtml(JSON.stringify(names))}">${all}</span></span></button>`;
}
