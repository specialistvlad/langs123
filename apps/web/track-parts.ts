// The parts of a track's index (pages/track.ts) in the frame: the topics as inset lists under prominent
// headers, a card per category or per level of the study path, each topic with its level mark, and the toolbar's
// level and variety menus.
import { topicTitle } from "../../scripts/content.ts";
import { count, type Explain, type Level, LEVEL_INFO, levelName, localize, type TopicRef } from "../../scripts/lib.ts";
import type { Range } from "../../scripts/levels.ts";
import { refRange } from "../../scripts/levels.ts";
import type { Track } from "./context.ts";
import { glyph } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";
import { type LevelEntry, topicEntryOf } from "./level-popover.ts";
import { bars, levelsLabel, markButton } from "./level-mark.ts";
import { levelAttrs, refLevels, refsRange, single } from "./parts.ts";
import { topicUrl } from "./urls.ts";

const CHEVRON =
  '<svg class="ix-chev" width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5L6.5 7l-5 5.5"/></svg>';
export const TICK =
  '<svg width="15" height="13" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 7.5l4.5 4.5L14.5 1.5"/></svg>';
export const FILTER = glyph('<path d="M4 7h16M7 12h10M10 17h4"/>', 20, 2);
export const GLOBE = glyph(
  '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c2.8 2.7 4.2 5.9 4.2 9.5s-1.4 6.8-4.2 9.5c-2.8-2.7-4.2-5.9-4.2-9.5s1.4-6.8 4.2-9.5z"/>',
  20,
  2,
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
  href?: string;
  step?: string;
  // The topic's levels, and the key of its entry in the page's level data when it has one.
  levels: Level[];
  key?: string;
  label: string;
  explain: Explain;
}
// A row: the topic's link over the whole row, its level mark above the link, and a chevron.
function row(r: Row): string {
  const mark = r.key === undefined ? bars(r.levels, r.explain) : markButton(r.levels, r.key, r.label);
  if (r.href === undefined) {
    return `<li${r.attrs} class="ix-todo"><span class="ix-row"><span class="ix-name">${escapeHtml(r.name)}</span>${mark}</span></li>`;
  }
  const step = r.step === undefined ? "" : ` data-path-step="${r.step}"`;
  return `<li${r.attrs}><span class="ix-row"><a class="ix-cover" href="${r.href}"${step}><span class="ix-name">${escapeHtml(r.name)}</span></a>${mark}${CHEVRON}</span></li>`;
}
const list = (attrs: string, head: string, rows: Row[]): string =>
  `<section class="ix-sec"${attrs}><h2 class="ix-h">${head}</h2><ol class="ix-rows">${rows.map(row).join("")}</ol></section>`;

// A written topic's row keeps its entry in the page's level data, once for both orders.
function keyed(ref: TopicRef, explain: Explain, entries: Record<string, LevelEntry>): { key?: string } {
  if (ref.topic === null) return {};
  entries[ref.id] ??= topicEntryOf(ref, explain);
  return { key: ref.id };
}

// The topics by category: a card per section of the curriculum, each topic with its levels.
export function byCategory(track: Track, entries: Record<string, LevelEntry>): string {
  const { lang, explain, langRefs } = track;
  return lang.sections
    .map((section) => {
      const refs = langRefs.filter((r) => r.section === section);
      const rows = refs.map((ref): Row => {
        const levels = refLevels(ref, explain);
        return {
          attrs: levelAttrs(refRange(ref, explain)),
          name: topicTitle(ref, explain),
          ...(ref.topic === null ? {} : { href: topicUrl(explain, lang, ref) }),
          levels,
          label: levelsLabel(levels, explain),
          explain,
          ...keyed(ref, explain, entries),
        };
      });
      const head = `<span class="ix-num">${section.dir.slice(0, 2)}</span><span>${escapeHtml(localize(section.title, explain))}</span>`;
      return list(levelAttrs(refsRange(refs, explain)), head, rows);
    })
    .join("");
}

// The topics along the study path: a card per level, each step leading where its level starts.
export function byLevel(track: Track, entries: Record<string, LevelEntry>): string {
  const { explain } = track;
  return track.path
    .map((stage) => {
      const level = single(stage.level);
      const rows = stage.steps.map((s): Row => {
        const levels = refLevels(s.ref, explain);
        return {
          attrs: levelAttrs(level),
          name: topicTitle(s.ref, explain),
          href: s.href,
          step: stage.level.toLowerCase(),
          levels,
          label: levelsLabel(levels, explain),
          explain,
          ...keyed(s.ref, explain, entries),
        };
      });
      const head = `${bars([stage.level], explain)}<span class="ix-lv-name">${stage.level} ${escapeHtml(levelName(stage.level, explain))}</span><span class="ix-lv-n">${escapeHtml(count("topics", explain, rows.length))}</span>`;
      return list(levelAttrs(level), head, rows);
    })
    .join("");
}

// A menu's item: a tick, its title and what it says, and an end piece (a pill, a glyph).
export const item = (data: string, title: string, on: boolean, sub = "", end = ""): string =>
  `<button type="button" role="menuitemradio" class="ix-item" ${data} aria-checked="${String(on)}"><span class="ix-tick" aria-hidden="true">${TICK}</span><span class="ix-text"><span class="ix-title">${escapeHtml(title)}</span>${sub === "" ? "" : `<span class="ix-sub">${escapeHtml(sub)}</span>`}</span>${end}</button>`;

// The level menu: what the filter does, All levels, then every level with what a learner does there; a level
// the course or topic lacks dims (refs: the topics it holds).
export function levelMenu(
  explain: Explain,
  refs: TopicRef[],
  words: { level: string; hint: string; all: string },
  id = "ix-levels",
): string {
  const held = new Set(refs.flatMap((r) => refLevels(r, explain)));
  const codes = LEVEL_INFO.map((l) => l.code);
  const levels = LEVEL_INFO.map((l) =>
    item(
      `data-set-level="${l.code}"${held.has(l.code) ? "" : ' data-absent=""'}`,
      levelName(l.code, explain),
      false,
      localize(l.description, explain),
      pill(single(l.code)),
    ),
  );
  const top = codes.at(-1) ?? "";
  return `<div class="ix-menu" id="${id}" popover role="menu" aria-label="${escapeHtml(words.level)}"><p class="ix-hint">${escapeHtml(words.hint)}</p>${item(`data-set-level="${top}" data-all=""`, words.all, true)}<div class="ix-band"></div>${levels.join("")}</div>`;
}

// The variety menu of a language with varieties.
export const varietyMenu = (title: string, varieties: { code: string; name: string }[]): string =>
  `<div class="ix-menu ix-menu-variety" id="ix-varieties" popover role="menu" aria-label="${escapeHtml(title)}">${varieties.map((v) => item(`data-set-variety="${v.code}"`, v.name, false)).join("")}</div>`;

// The level button: All levels, or the chosen level's bar lit and its name (client-chips.ts); it opens the menu `target`.
export function levelButton(
  explain: Explain,
  words: { level: string; all: string },
  target: string,
  cls = "ix-btn ix-level",
  label = "ix-label",
): string {
  const names = Object.fromEntries(LEVEL_INFO.map((l) => [l.code, `${l.code} ${levelName(l.code, explain)}`]));
  const cells = LEVEL_INFO.map((l) => `<i class="lv-${l.code}"></i>`).join("");
  const all = escapeHtml(words.all);
  return `<button type="button" class="${cls}" popovertarget="${target}" aria-haspopup="menu">${FILTER}<span class="lvm lvm-one" aria-hidden="true" hidden>${cells}</span><span class="${label}"><span class="sr-only">${escapeHtml(words.level)}: </span><span data-level-label data-all="${all}" data-names="${escapeHtml(JSON.stringify(names))}">${all}</span></span></button>`;
}
