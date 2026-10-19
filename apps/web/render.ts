// Topic content (topic.yaml) → HTML: blocks with level badges, lists, and tables laid out from what their
// columns hold (CONVENTIONS.md §12).
import { shows } from "../../scripts/content.ts";
import { reading, varietyName } from "../../scripts/text.ts";
import { type Ctx, escapeHtml, explained, learned, translation } from "./html.ts";
import { lessonText } from "./lesson.ts";
import { blockRange } from "../../scripts/levels.ts";
import { badge, blockVariety, levelAttrs, single, varietyAttr, varietyLevelAttrs } from "./parts.ts";
import { errorsHtml, tableHtml } from "./tables-html.ts";
import { type Block, filled, type Item, type Level, type Localized, lv, type Text, type Variety } from "../../scripts/lib.ts";

// A leaf carries its level for the filter; its badge shows when it sits above its block's lowest level.
const leafAttr = (level: Level): string => levelAttrs(single(level));
const mark = (level: Level, from: Level): string => (lv(level) > lv(from) ? badge(single(level)) : "");

// Explanation text, then its example in the language being learned.
const textAndExample = (text: Localized | undefined, ex: Text | undefined, ctx: Ctx): string =>
  [explained(text, ctx), learned(ex, ctx)].filter(filled).join(" ");

// ---------- Lists ----------

interface Rendered {
  html: string;
  level: Level;
  attrs: string;
}

// A list item: a rule, a note or an example; a note about another variety names it first.
function item(it: Item, ctx: Ctx, from: Level): Rendered | null {
  if (!shows(it, ctx.explain)) return null;
  const base = textAndExample(it.text, it.ex, ctx);
  if (!filled(base)) return null;
  const variety =
    it.variety === undefined ? "" : `<span data-mark="variety">${escapeHtml(reading(ctx.explain, false).variety(it.variety))}:</span> `;
  const attrs = ` data-type="${it.type}"${it.variety === undefined ? "" : ` data-variety="${it.variety}"`}`;
  const html =
    ctx.lesson === true
      ? `<div class="tp-li">${lessonText(mark(it.level, from) + variety, it.text, it.ex, it.tr, ctx, it.type === "example")}</div>`
      : mark(it.level, from) + variety + base + translation(it.tr, ctx);
  return { html, level: it.level, attrs };
}

function list(items: Item[], ctx: Ctx, from: Level): string | null {
  const shown = items.map((i) => item(i, ctx, from)).filter((i): i is Rendered => i !== null);
  if (shown.length === 0) return null;
  return `<ul>${shown.map((i) => `<li${leafAttr(i.level)}${i.attrs}>${i.html}</li>`).join("")}</ul>`;
}

// ---------- Blocks ----------

// lead: what opens a lesson's paragraph, the badge of its block.
function contentHtml(b: Block, ctx: Ctx, from: Level, lead = ""): string | null {
  switch (b.type) {
    case "prose": {
      const base = textAndExample(b.text, b.ex, ctx);
      if (!filled(base)) return null;
      return ctx.lesson === true ? `<p>${lessonText(lead, b.text, b.ex, b.tr, ctx, false)}</p>` : `<p>${base}${translation(b.tr, ctx)}</p>`;
    }
    case "list":
      return list(b.items, ctx, from);
    case "paradigm":
    case "usage":
    case "comparison":
    case "inventory":
      return tableHtml(b, ctx, from);
    case "errors":
      return errorsHtml(b, ctx, from);
  }
}

// A block in a wrapper that carries its range, so the filter hides it together with its last leaf.
// Its badge shows when it starts above the section or cheatsheet around it.
// In a lesson a paragraph opens with that badge, and a block of one variety names it beside it.
function blockHtml(b: Block, ctx: Ctx, parent: Level): string | null {
  const range = blockRange(b, ctx.explain);
  if (range === null) return null;
  const level = lv(range.from) > lv(parent) ? badge(range) : "";
  const inside = ctx.lesson === true && b.type === "prose";
  const html = contentHtml(b, ctx, range.from, inside ? level : "");
  if (html === null) return null;
  const variety = blockVariety(b, ctx.varieties);
  const tag =
    ctx.lesson === true && variety !== undefined
      ? `<span class="tp-vtag tp-vblock">${escapeHtml(varietyName(variety as Variety, ctx.explain))}</span>`
      : "";
  const shown = tag + (inside ? "" : level);
  const head = shown === "" ? "" : `<div class="blk-level">${shown}</div>`;
  return `<div class="blk"${levelAttrs(range)}${varietyLevelAttrs([b], ctx.explain, ctx.varieties, range.from)}${varietyAttr(variety)}>${head}${html}</div>`;
}

// The blocks of a section or cheatsheet whose lowest level is parent.
export const blocksHtml = (blocks: Block[], ctx: Ctx, parent: Level): string =>
  blocks
    .map((b) => blockHtml(b, ctx, parent))
    .filter(filled)
    .join("\n");
