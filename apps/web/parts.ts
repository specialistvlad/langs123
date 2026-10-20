// Small HTML and text pieces the pages share: level attributes and levels, anchors.
import { type Block, type Cell, type Example, type Explain, type Level, lv, type TopicRef } from "../../scripts/lib.ts";
import { join, leaves, type Range, refRange, topicLevels } from "../../scripts/levels.ts";
import { levelsOf } from "./level-mark.ts";
import type { Ctx } from "./html.ts";

// Anchor id from a heading: lowercase ASCII words joined by hyphens.
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Anchor ids for headings, in page order: each slugified, unique within the page.
export function anchorIds(titles: string[]): string[] {
  const ids = new Set<string>();
  return titles.map((title) => {
    let id = slugify(title);
    if (id === "") id = "section";
    while (ids.has(id)) id += "-";
    ids.add(id);
    return id;
  });
}

// A table cell that is an example with its translation.
export const isExample = (value: Cell): value is Example =>
  typeof value === "object" && !Array.isArray(value) && "ex" in value && "tr" in value;

export const single = (level: Level): Range => ({ from: level, to: level });

// What the level filter reads: an element hides while the filter sits below its lowest level.
// A range as an optional field: { range } when there is one.
export const ranged = (r: Range | null): { range?: Range } => (r === null ? {} : { range: r });
export const levelAttrs = (r: Range | null): string => (r === null ? "" : ` data-level="${r.from}" data-to="${r.to}"`);

// What the variety switch reads: an element of one variety shows while the reader has chosen it.
export const varietyAttr = (variety: string | undefined): string => (variety === undefined ? "" : ` data-variety="${variety}"`);

// On a language with varieties, the variety every leaf of a block shares, so the block hides with them.
export function blockVariety(block: Block, varieties: readonly string[] | undefined): string | undefined {
  if (varieties === undefined) return undefined;
  const tags = new Set(leaves(block).map((leaf) => (leaf as { variety?: string }).variety));
  const [only] = tags;
  return tags.size === 1 ? only : undefined;
}

// On a language with varieties, the lowest level of blocks for each variety whose leaves start above
// `from`, as data-level-{variety}: the level filter hides the blocks with the last leaf that variety shows.
export function varietyLevelAttrs(blocks: Block[], explain: Explain, varieties: readonly string[] | undefined, from: Level): string {
  if (varieties === undefined) return "";
  const all = blocks.flatMap((b) => leaves(b, explain)) as { level: Level; variety?: string }[];
  return varieties
    .map((v) => {
      const own = all.filter((l) => l.variety === undefined || l.variety === v).map((l) => l.level);
      const low = own.reduce<Level | null>((a, l) => (a === null || lv(l) < lv(a) ? l : a), null);
      return low === null || low === from ? "" : ` data-level-${v.toLowerCase()}="${low}"`;
    })
    .join("");
}

// The range of some curriculum topics in an explanation language.
// A curriculum topic's levels: its leaves' when written, its planned range otherwise.
export function refLevels(ref: TopicRef, explain?: Explain): Level[] {
  if (ref.topic !== null) return topicLevels(ref.topic, explain);
  const range = refRange(ref, explain);
  return range === null ? [] : levelsOf(range);
}

export const refsRange = (refs: TopicRef[], explain: Explain): Range | null => join(refs.map((r) => refRange(r, explain)));

const hasVariant = (v: unknown): boolean =>
  Array.isArray(v) ? v.some(hasVariant) : typeof v === "object" && v !== null && ("variant" in v || Object.values(v).some(hasVariant));

// On a language with varieties, a cell whose text has variants holds a copy in each variety: the chosen
// copy reads as plain text, and the others keep the column as wide as theirs (levels.css).
export function byVariety(value: unknown, ctx: Ctx, html: (c: Ctx) => string): string {
  if (ctx.varieties === undefined || !hasVariant(value)) return html(ctx);
  return ctx.varieties.map((v) => `<span class="cell-variety" data-variety="${v}">${html({ ...ctx, pick: v })}</span>`).join("");
}
