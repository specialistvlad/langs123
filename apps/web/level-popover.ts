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
  listOf,
  localize,
  say,
  type TopicRef,
} from "../../scripts/lib.ts";
import { leaves, topicLevels } from "../../scripts/levels.ts";
import { topicTitle } from "../../scripts/content.ts";
import { isLocalized, plainText, reading, textIn } from "../../scripts/text.ts";
import type { Cell, Text } from "../../scripts/lib.ts";
import { guideParts } from "./guide.ts";
import { escapeHtml } from "./html.ts";
import { isExample, single } from "./parts.ts";
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
const MAX = 44;
const cut = (text: string): string => (text.length > MAX ? `${text.slice(0, MAX - 1).trimEnd()}…` : text);

// A topic: per level, its parts holding that level, named: "10 sections: Summary, Overview and 8 more".
export function topicEntry(title: string, parts: { title: string; levels: readonly Level[] }[], explain: Explain): LevelEntry {
  const l: LevelEntry["l"] = {};
  for (const level of LEVELS) {
    const names = parts.filter((p) => p.levels.includes(level)).map((p) => p.title);
    if (names.length === 0) continue;
    const shown = names.length > 3 ? [...names.slice(0, 2), count("andMore", explain, names.length - 2)] : names;
    l[level] = `${count("sections", explain, names.length)}: ${listOf(shown, explain)}`;
  }
  return { t: title, k: "topic", l };
}

// A written topic's entry: its title, and its summary and sections by level.
export function topicEntryOf(ref: TopicRef, explain: Explain): LevelEntry {
  const parts = ref.topic === null ? [] : guideParts(ref.topic, explain);
  return topicEntry(topicTitle(ref, explain), parts, explain);
}

const plain = (value: Text, explain: Explain): string => plainText(value, reading(explain, true)).replace(/\s+/g, " ").trim();
function cellLine(value: Cell | undefined, explain: Explain): string {
  if (value === undefined) return "";
  if (isExample(value)) return plain(value.ex, explain);
  if (typeof value === "object" && !Array.isArray(value) && isLocalized(value)) return plain(textIn(value, explain), explain);
  return plain(value, explain);
}

// A leaf's words as the popover quotes them: its example where it has one, else its text, else its first cell.
function leafLine(block: Block, leaf: object, explain: Explain): string {
  switch (block.type) {
    case "prose":
    case "list": {
      const it = leaf as { ex?: Text; text?: Parameters<typeof textIn>[0] };
      if (it.ex !== undefined) return plain(it.ex, explain);
      return it.text === undefined ? "" : plain(textIn(it.text, explain), explain);
    }
    case "errors":
      return plain((leaf as { right: Text }).right, explain);
    case "paradigm":
    case "usage":
    case "comparison":
    case "inventory": {
      const row = leaf as Record<string, Cell | undefined>;
      return block.columns.map((column) => cellLine(row[column.key], explain)).find((line) => line !== "") ?? "";
    }
  }
}

// A section: per level, its lines at that level and the first of them: "3 lines, such as “I work.”".
export function sectionEntry(title: string, content: Block[], explain: Explain): LevelEntry {
  const l: LevelEntry["l"] = {};
  const lines = content.flatMap((b) => leaves(b, explain).map((leaf) => ({ level: leaf.level, line: leafLine(b, leaf, explain) })));
  for (const level of LEVELS) {
    const here = lines.filter((x) => x.level === level);
    if (here.length === 0) continue;
    const example = here.find((x) => x.line !== "")?.line;
    const n = count("lines", explain, here.length);
    l[level] = example === undefined ? n : `${n}, ${say("suchAs", explain, { example: cut(example) })}`;
  }
  return { t: title, k: "section", l };
}

// A course: per level, the topics covering it and those starting there: "12 topics cover A1; 5 start here, such as A and B".
export function courseEntry(title: string, refs: TopicRef[], explain: Explain): LevelEntry {
  const l: LevelEntry["l"] = {};
  const held = refs
    .flatMap((r) => (r.topic === null ? [] : [{ ref: r, levels: topicLevels(r.topic, explain) }]))
    .filter((x) => x.levels.length > 0);
  for (const level of LEVELS) {
    const covering = held.filter((x) => x.levels.includes(level));
    if (covering.length === 0) continue;
    const starting = covering.filter((x) => x.levels[0] === level);
    const cover = count("topicsCover", explain, covering.length).replace("{level}", level);
    const named = starting.slice(0, 2).map((x) => topicTitle(x.ref, explain));
    l[level] =
      starting.length === 0
        ? cover
        : `${cover}; ${say("startHereSuchAs", explain, { started: count("startHere", explain, starting.length), topics: listOf(named, explain) })}`;
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
