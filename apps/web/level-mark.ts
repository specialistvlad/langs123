// The level mark: seven bars, A0 to C2, in a grey capsule, each level a part holds lit in its colour (levels.css),
// then the range in words, "A1–C1" or "A0"; small in table rows, list items and errors. As a button it opens the
// level popover (level-popover.ts), which names the levels the topic, section or course holds.
import { type Explain, type Level, LEVELS, listOf, lv, say } from "../../scripts/lib.ts";
import type { Range } from "../../scripts/levels.ts";
import { escapeHtml } from "./html.ts";

// The levels of a range, lowest first.
export const levelsOf = (r: Range): Level[] => LEVELS.filter((l) => lv(l) >= lv(r.from) && lv(l) <= lv(r.to));

// The range in words: the lowest level and the highest, A1–C1, or one level, A0; the bars show any gap.
export function rangeText(levels: readonly Level[]): string {
  const held = LEVELS.filter((l) => levels.includes(l));
  const [low] = held;
  const high = held.at(-1);
  return low === undefined || high === undefined ? "" : low === high ? low : `${low}–${high}`;
}

// What a mark reads to a screen reader: "Level A1", "Levels A1, A2 and B1".
export const levelsLabel = (levels: readonly Level[], explain: Explain): string =>
  `${say(levels.length === 1 ? "level" : "levels", explain)} ${listOf([...levels], explain)}`;

export interface MarkOptions {
  // Table rows, list items, errors and the study path take the small bars.
  small?: boolean;
}

// The bars alone, for a screen reader one image.
export function bars(levels: readonly Level[], explain: Explain, o: MarkOptions = {}): string {
  if (levels.length === 0) return "";
  return `<span class="lvm${o.small === true ? " lvm-sm" : ""}" role="img" aria-label="${escapeHtml(levelsLabel(levels, explain))}">${cells(levels)}</span>`;
}

const cells = (levels: readonly Level[]): string =>
  LEVELS.map((l) => `<i class="lv-${l}${levels.includes(l) ? " on" : ""}"></i>`).join("") +
  `<span class="lvm-t">${rangeText(levels)}</span>`;

// The bars as a button: a tap opens the level popover on the entry `key` of the page's level data.
export function markButton(levels: readonly Level[], key: string, label: string, o: MarkOptions = {}): string {
  if (levels.length === 0) return "";
  return `<button type="button" class="lvm lvm-b${o.small === true ? " lvm-sm" : ""}" data-lv="${escapeHtml(key)}" aria-haspopup="dialog" popovertarget="lv-pop" aria-label="${escapeHtml(label)}">${cells(levels)}</button>`;
}
