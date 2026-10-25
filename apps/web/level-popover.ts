// The level popover: opened from a level mark (level-mark.ts), it names the element with its bars and range, lists
// the seven levels and sets the level filter like the level menu. A page holds one popover and the names of its
// marks as JSON (#lv-data); client-levels.ts fills the popover from the entry the tapped mark names and the levels
// the mark lights. A level the element lacks dims and cannot be chosen.
import {
  type Block,
  count,
  type Explain,
  type Level,
  LEVEL_INFO,
  LEVELS,
  levelName,
  localize,
  say,
  type TopicRef,
} from "../../scripts/lib.ts";
import { leaves, topicLevels } from "../../scripts/levels.ts";
import { topicTitle } from "../../scripts/content.ts";
import { guideParts } from "./guide.ts";
import { escapeHtml } from "./html.ts";
import { single } from "./parts.ts";
import { pill } from "./track-parts.ts";

export type LevelKind = "topic" | "section" | "course";

// One mark's entry: the element's name, its kind, and per level it holds what that level covers there.
export interface LevelEntry {
  t: string;
  k: LevelKind;
  l: Partial<Record<Level, string>>;
}

const TICK =
  '<svg width="15" height="13" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 7.5l4.5 4.5L14.5 1.5"/></svg>';

const CROSS =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

// A topic: per level, how many of its parts hold that level: "10 sections".
export function topicEntry(title: string, parts: { title: string; levels: readonly Level[] }[], explain: Explain): LevelEntry {
  const l: LevelEntry["l"] = {};
  for (const level of LEVELS) {
    const n = parts.filter((p) => p.levels.includes(level)).length;
    if (n > 0) l[level] = count("sections", explain, n);
  }
  return { t: title, k: "topic", l };
}

// A written topic's entry: its title, and its summary and sections by level.
export function topicEntryOf(ref: TopicRef, explain: Explain): LevelEntry {
  const parts = ref.topic === null ? [] : guideParts(ref.topic, explain);
  return topicEntry(topicTitle(ref, explain), parts, explain);
}

// A section: per level, how many of its lines sit at that level: "3 lines".
export function sectionEntry(title: string, content: Block[], explain: Explain): LevelEntry {
  const l: LevelEntry["l"] = {};
  const levels = content.flatMap((b) => leaves(b, explain).map((leaf) => leaf.level));
  for (const level of LEVELS) {
    const n = levels.filter((x) => x === level).length;
    if (n > 0) l[level] = count("lines", explain, n);
  }
  return { t: title, k: "section", l };
}

// A course: per level, the topics covering it and those starting there, joined as each language joins them
// (coverAndStart): "12 topics cover A1; 5 start here", "12トピックがA1を扱う（うち5トピックはここから始まる）".
export function courseEntry(title: string, refs: TopicRef[], explain: Explain): LevelEntry {
  const l: LevelEntry["l"] = {};
  const held = refs
    .flatMap((r) => (r.topic === null ? [] : [{ ref: r, levels: topicLevels(r.topic, explain) }]))
    .filter((x) => x.levels.length > 0);
  for (const level of LEVELS) {
    const covering = held.filter((x) => x.levels.includes(level));
    if (covering.length === 0) continue;
    const starting = covering.filter((x) => x.levels[0] === level).length;
    const cover = count("topicsCover", explain, covering.length).replace("{level}", level);
    l[level] = starting === 0 ? cover : say("coverAndStart", explain, { cover, start: count("startHere", explain, starting) });
  }
  return { t: title, k: "course", l };
}

// The page's level data, read by client-levels.ts.
export const levelData = (entries: Record<string, LevelEntry>): string =>
  `<script type="application/json" id="lv-data">${JSON.stringify(entries).replace(/</g, "\\u003c")}</script>`;

// The popover a page's marks open: its head (the element's name, its bars and range as a pill, and on a phone a close
// button), the line on hiding, then the seven levels, each with its name, what a learner does there and its pill.
// The top level reads "Proficiency (All levels)": the filter's default, which shows everything.
export function levelPopover(explain: Explain): string {
  const top = LEVELS.at(-1) ?? "C2";
  const levels = LEVEL_INFO.map((info) => {
    const name =
      info.code === top ? say("levelAllLevels", explain, { level: levelName(info.code, explain) }) : levelName(info.code, explain);
    return `<button type="button" role="menuitemradio" class="lv-row" data-row="${info.code}" data-set-level="${info.code}" aria-checked="false"><span class="lv-tick">${TICK}</span><span class="lv-text"><span class="lv-name">${escapeHtml(name)}</span><span class="lv-sub">${escapeHtml(localize(info.description, explain))}</span></span>${pill(single(info.code))}</button>`;
  }).join("");
  const cells = LEVELS.map((l) => `<i class="lv-${l}"></i>`).join("");
  const close = escapeHtml(say("close", explain));
  return `<div class="lv-pop" id="lv-pop" popover role="dialog" aria-labelledby="lv-pop-t"><header class="lv-pop-h"><span class="lv-pop-t" id="lv-pop-t"></span><span class="lvm lv-pop-m" aria-hidden="true">${cells}</span><span class="lv-pop-r"></span><button type="button" class="lv-pop-x" popovertarget="lv-pop" popovertargetaction="hide" aria-label="${close}">${CROSS}</button></header><p class="lv-pop-note">${escapeHtml(say("levelHidden", explain))}</p><div class="lv-rows" role="menu">${levels}</div></div>`;
}
