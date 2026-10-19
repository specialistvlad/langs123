// Small HTML and text pieces the pages share: level badges and attributes, anchors, edit links.
import { type Block, type Explain, type Level, lv, SITE, type TopicRef } from "../../scripts/lib.ts";
import { join, leaves, type Range, refRange } from "../../scripts/levels.ts";
import type { Ctx } from "./html.ts";

// Opens the file in GitHub's editor (a fork for anyone without write access).
export const editUrl = (path: string): string => `${SITE.repository}/edit/main/${path}`;

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

export const single = (level: Level): Range => ({ from: level, to: level });

// A level badge: one level reads (A1); a range joins two halves, (A1][B1), the lowest on the left and
// the highest on the right, each in its own level's colour (levels.css). A hidden dash makes the text
// read A1–B1. client.ts builds the same halves when it trims the highest level to the level filter.
const half = (level: Level): string => `<span class="half lvl-${level}">${level}</span>`;
export const badgeHalves = (r: Range): string =>
  r.from === r.to ? half(r.from) : `${half(r.from)}<span class="sr-only">–</span>${half(r.to)}`;
export const badge = (r: Range | null): string =>
  r === null ? "" : `<span class="badge lvl" data-from="${r.from}" data-to="${r.to}">${badgeHalves(r)}</span>`;

// A badge in a list (the menu, the rail, the track index, Up next) has halves of one width and room
// for two, so the badges of a list line up in columns: the lowest levels in one, the highest in the
// next; one level takes the first column and leaves the second empty (layout.css).
export const listBadge = (r: Range | null): string =>
  r === null ? "" : `<span class="badge lvl pair" data-from="${r.from}" data-to="${r.to}">${badgeHalves(r)}</span>`;

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
export const refsRange = (refs: TopicRef[], explain: Explain): Range | null => join(refs.map((r) => refRange(r, explain)));

const hasVariant = (v: unknown): boolean =>
  Array.isArray(v) ? v.some(hasVariant) : typeof v === "object" && v !== null && ("variant" in v || Object.values(v).some(hasVariant));

// On a language with varieties, a cell whose text has variants holds a copy in each variety: the chosen
// copy reads as plain text, and the others keep the column as wide as theirs (levels.css).
export function byVariety(value: unknown, ctx: Ctx, html: (c: Ctx) => string): string {
  if (ctx.varieties === undefined || !hasVariant(value)) return html(ctx);
  return ctx.varieties.map((v) => `<span class="cell-variety" data-variety="${v}">${html({ ...ctx, pick: v })}</span>`).join("");
}
