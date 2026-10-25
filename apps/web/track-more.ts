// Show more on a track's index: the last row of a list whose topics the chosen level hides. It names how many topics
// the next level that has hidden topics adds, carries that level's pill, and sets the site-wide level choice to
// that level (data-set-level, client.ts). A list holds one row for each run of chosen levels that share the same
// next level and count; the level filter shows the row of the level chosen (moreCss) and hides the others, so the
// client counts nothing.
import { count, type Explain, type Level, LEVELS, lv } from "../../scripts/lib.ts";
import { pill } from "./track-parts.ts";
import { single } from "./parts.ts";

export interface More {
  // The chosen levels the row shows at, and what it adds.
  at: Level[];
  next: Level;
  n: number;
}

// The rows of a list whose topics start at `lows`: for each chosen level, the lowest level above it that has topics
// and how many topics start there; chosen levels with the same pair share a row.
export function moreSteps(lows: readonly Level[]): More[] {
  const rows: More[] = [];
  for (const chosen of LEVELS) {
    const above = lows.filter((l) => lv(l) > lv(chosen));
    const next = above.reduce<Level | null>((a, l) => (a === null || lv(l) < lv(a) ? l : a), null);
    if (next === null) continue;
    const n = above.filter((l) => l === next).length;
    const last = rows.at(-1);
    if (last?.next === next && last.n === n) last.at.push(chosen);
    else rows.push({ at: [chosen], next, n });
  }
  return rows;
}

// A Show more row as a list item: the count in the accent colour, the next level's pill at the end.
export const moreRows = (lows: readonly Level[], explain: Explain): string =>
  moreSteps(lows)
    .map(
      (m) =>
        `<li class="ix-more" data-more="${m.at.join(" ")}"><button type="button" class="ix-more-b" data-set-level="${m.next}"><span class="ix-more-t">${count("showMore", explain, m.n)}</span>${pill(single(m.next))}</button></li>`,
    )
    .join("");

// What shows at each chosen level: its Show more row (and, on the study path, the card holding it), and the
// separator over a row the hidden rows before it leave first.
export function moreCss(): string[] {
  const codes = LEVELS.slice();
  return codes.flatMap((code, i) => {
    const at = `html[data-level="${code}"]`;
    const row = `.ix-more[data-more~="${code}"]`;
    const above = codes.slice(i + 1).map((c) => `[data-level="${c}"]`);
    const shown = above.length === 0 ? "li:not(.ix-more)" : `li:not(.ix-more, :is(${above.join(", ")}))`;
    return [
      `${at} ${row} { display: block; }`,
      `${at} .ix-sec-more:has(${row}) { display: block; }`,
      ...(above.length === 0 ? [] : [`${at} .ix-rows > li:not(${shown} ~ li)::before { display: none; }`]),
    ];
  });
}
