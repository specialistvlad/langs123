// The level popover: opened from a level mark (level-mark.ts), it names the element, says what each level covers
// in it, and sets the level filter like the level menu. A page holds one popover and the data of its marks as
// JSON (#lv-data); client-levels.ts fills the popover from the entry the tapped mark names. A level an element
// lacks reads "Not in this topic" and dims.
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

// The popover a page's marks open: its head, what the levels cover and what the filter does, All levels, then
// each level with its name, what a learner does there, what it covers in the element and its pill.
export function levelPopover(explain: Explain): string {
  const notes = { topic: say("levelsTopic", explain), section: say("levelsSection", explain), course: say("levelsCourse", explain) };
  const off = { topic: say("notInTopic", explain), section: say("notInSection", explain), course: say("notInCourse", explain) };
  const row = (level: string, name: string, sub: string, end: string, attrs: string): string =>
    `<button type="button" role="menuitemradio" class="lv-row" data-set-level="${level}" aria-checked="false"${attrs}><span class="lv-tick">${TICK}</span><span class="lv-text"><span class="lv-name">${escapeHtml(name)}</span>${sub === "" ? "" : `<span class="lv-sub">${escapeHtml(sub)}</span><span class="lv-here"></span>`}</span>${end}</button>`;
  const top = LEVELS.at(-1) ?? "C2";
  const levels = LEVEL_INFO.map((info) =>
    row(info.code, levelName(info.code, explain), localize(info.description, explain), pill(single(info.code)), ` data-row="${info.code}"`),
  ).join("");
  return `<div class="lv-pop" id="lv-pop" popover role="dialog" aria-labelledby="lv-pop-t" data-notes="${escapeHtml(JSON.stringify(notes))}" data-off="${escapeHtml(JSON.stringify(off))}"><header class="lv-pop-h"><span class="lv-pop-t" id="lv-pop-t"></span><span class="lv-pop-m"></span></header><p class="lv-pop-note"><span class="lv-pop-what"></span> ${escapeHtml(say("levelHidden", explain))}</p><div class="lv-rows" role="menu">${row(top, say("allLevels", explain), "", "", " data-all")}${levels}</div></div>`;
}
