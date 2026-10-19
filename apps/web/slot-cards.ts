// A slot paradigm on a phone (tables-html.ts): one card per sentence type for each tense, its persons as rows,
// under the tense's name and its level.
import type { Level } from "../../scripts/lib.ts";
import { single } from "./parts.ts";
import { pill } from "./track-parts.ts";

export interface SlotTable {
  titles: string[];
  groups: (string | undefined)[];
  grid: string[][];
  levels: Level[];
  span: number[][];
}

export function slotCards(t: SlotTable): string {
  // The sentence types in order, each with its columns.
  const groups: { name: string; cols: number[] }[] = [];
  t.groups.forEach((name, c) => {
    if (name === undefined) return;
    const group = groups.find((g) => g.name === name);
    if (group) group.cols.push(c);
    else groups.push({ name, cols: [c] });
  });
  const tenses: string[] = [];
  for (let r = 0; r < t.grid.length;) {
    const rows = Math.max(1, t.span[r]?.[0] ?? 1);
    const level = t.levels[r] ?? "A0";
    const cards = groups.map((g) => {
      const head = g.cols.map((c) => `<th>${t.titles[c] ?? ""}</th>`).join("");
      const body = t.grid
        .slice(r, r + rows)
        .map((cells, k) => {
          const tds = g.cols.map((c) => {
            const span = t.span[r + k]?.[c] ?? 1;
            if (span === 0) return "";
            return `<td${c === g.cols[0] ? ' class="c0"' : ""}${span > 1 ? ` rowspan="${String(span)}"` : ""}>${cells[c] ?? ""}</td>`;
          });
          return `<tr>${tds.join("")}</tr>`;
        })
        .join("");
      return `<p class="tp-caps">${g.name}</p><div class="tp-card"><div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
    });
    tenses.push(
      `<section class="tp-slot" data-level="${level}" data-to="${level}"><h3 class="tp-tense"><span>${t.grid[r]?.[0] ?? ""}</span>${pill(single(level))}</h3>${cards.join("")}</section>`,
    );
    r += rows;
  }
  return `<div class="tp-slot-cards">${tenses.join("")}</div>`;
}
