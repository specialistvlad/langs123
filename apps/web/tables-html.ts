// Tables of topic content → HTML: a slot paradigm lays sentences out word by word, its slot columns grouped by
// sentence, merged down where neighbours read the same but for the subject, and centred; any other table shows
// its columns as they are, and a dash where a row leaves a cell empty; an errors table pairs the wrong and the
// right. In a lesson (html.ts Ctx lesson) a table is a card: each row's level mark sits in a Level column, a
// translation column and the empty cells are marked, a key that is a figure or a letter pair takes its own face, a
// row of one variety names it, an errors table names its columns, and a slot paradigm also comes as one card per
// sentence type for phones (slot-cards.ts).
import { serves, type TableBlock, tableShape } from "../../scripts/content.ts";
import {
  type Cell,
  type Column,
  type ErrorsBlock,
  type Explain,
  explainName,
  type FeatureBundle,
  type Level,
  lv,
  say,
} from "../../scripts/lib.ts";
import { isLocalized, varietyName } from "../../scripts/text.ts";
import { type Ctx, escapeHtml, explained, learned, translation } from "./html.ts";
import { translationOf } from "./lesson.ts";
import { bars } from "./level-mark.ts";
import { byVariety, isExample, levelAttrs, single, varietyAttr } from "./parts.ts";
import { slotCards } from "./slot-cards.ts";
import { blockStarts, classAttr, GAP_CELL, gapLevel, gapsAfter, type HeadCell, headHtml, spans } from "./table.ts";

const leafAttr = (level: Level): string => levelAttrs(single(level));
const mark = (level: Level, from: Level, explain: Explain): string => (lv(level) > lv(from) ? bars([level], explain, { small: true }) : "");

// A cell: explanation text, text in the language being learned, or an example with its translation.
function cell(value: Cell | undefined, ctx: Ctx): string {
  if (value === undefined) return "";
  return byVariety(value, ctx, (c) => {
    if (isExample(value)) {
      if (c.lesson !== true) return learned(value.ex, c) + translation(value.tr, c);
      const tr = translationOf(value.tr, c);
      return learned(value.ex, c) + (tr === "" ? "" : `<em data-mark="translation">${tr}</em>`);
    }
    if (typeof value === "object" && !Array.isArray(value) && isLocalized(value)) return explained(value, c);
    return learned(value, c);
  });
}

// A row's level shows as a mark at the start of its first cell, or in a lesson in its Level column. A span of
// 0 leaves the cell to the merged cell above it; a span above 1 covers the rows below. A center column centres
// its cells both ways; an end cell reaches the table's bottom edge.
interface Layout {
  span?: number[] | undefined;
  center?: boolean[];
  gaps?: boolean[];
  end?: boolean[] | undefined;
  // In a lesson: the variety the row names, whether its last column is a translation, and whether it is a slot
  // paradigm's.
  tag?: string | undefined;
  trcol?: boolean;
  slots?: boolean;
}
// A lesson's key that is a figure or a letter pair, in its own face.
function keyFace(content: string): string {
  if (content.includes("<")) return content;
  if (/^\d[\d:.,]*(?:st|nd|rd|th)?$/.test(content)) return `<span class="tp-mono">${content}</span>`;
  return /^\p{L} \p{L}$/u.test(content) ? `<span class="tp-letter">${content}</span>` : content;
}
function row(level: Level, from: Level, cells: string[], layout: Layout, attrs: string, lesson: boolean, explain: Explain): string {
  let tagged = false;
  const tds = cells.map((c, n) => {
    const span = layout.span?.[n] ?? 1;
    const gap = layout.gaps?.[n] === true ? GAP_CELL : "";
    if (span === 0) return gap;
    const names = [
      ...(n === 0 ? ["key"] : []),
      ...(layout.center?.[n] === true ? ["center"] : []),
      ...(layout.end?.[n] === true ? ["end"] : []),
      ...(lesson && c === "—" ? ["tp-none"] : []),
      ...(lesson && layout.trcol === true && n === cells.length - 1 ? ["tp-trcol"] : []),
    ];
    let content = lesson ? (n === 0 ? keyFace(c) : c) : (n === 0 ? mark(level, from, explain) : "") + c;
    if (lesson && layout.tag !== undefined && !tagged) {
      content += `<span class="tp-vtag">${escapeHtml(layout.tag)}</span>`;
      tagged = true;
    }
    return `<td${classAttr(names)}${span > 1 ? ` rowspan="${String(span)}"` : ""}>${content}</td>${gap}`;
  });
  const pillCell = (rows: number): string =>
    `<td class="tp-lvl"${rows > 1 ? ` rowspan="${String(rows)}"` : ""}>${bars([level], explain, { small: true })}</td>`;
  if (!lesson) return `<tr${leafAttr(level)}${attrs}>${tds.join("")}</tr>`;
  if (layout.slots !== true) return `<tr${leafAttr(level)}${attrs}>${tds.join("")}${pillCell(1)}</tr>`;
  // A slot paradigm: the pill spans the rows of its tense, and the row that opens a tense is marked.
  const lead = layout.span?.[0] ?? 1;
  return lead > 1
    ? `<tr class="tp-first"${leafAttr(level)}${attrs}>${tds.join("")}${pillCell(lead)}</tr>`
    : `<tr${leafAttr(level)}${attrs}>${tds.join("")}</tr>`;
}

const SLOT_LABEL = { aux: "slotAux", subj: "slotSubj", verb: "slotVerb", rest: "slotRest" } as const;

// The sentence a slot column belongs to, named by its features: Question, Statement, Negative.
function sentenceName(c: Column, explain: Explain): string | undefined {
  const f = c.features as FeatureBundle | undefined;
  if (c.slot === undefined || f === undefined) return undefined;
  if (f.interrogativity === "int") return say("groupQuestion", explain);
  return say(f.polarity === "neg" ? "groupNegative" : "groupStatement", explain);
}

function columnTitle(c: Column, ctx: Ctx): string {
  if (c.slot !== undefined) return escapeHtml(say(SLOT_LABEL[c.slot], ctx.explain));
  return cell(c.label, ctx);
}

// A table in its wrapper; in a lesson, in its card, which scrolls sideways from five columns.
function wrap(table: string, ctx: Ctx, o: { slot?: boolean; columns?: number } = {}): string {
  const inner = `<div class="table-wrap">${table}</div>`;
  if (ctx.lesson !== true) return inner;
  const scroll = o.slot !== true && (o.columns ?? 0) >= 5;
  return `<div class="tp-card${o.slot === true ? " tp-slot-wide" : ""}${scroll ? " tp-scroll tp-wide" : ""}">${inner}</div>`;
}

export function tableHtml(block: TableBlock, ctx: Ctx, from: Level): string {
  const lesson = ctx.lesson === true;
  const shape = tableShape(block, ctx.explain, ctx.ref.lang);
  const titles = shape.columns.map((c) => columnTitle(c, ctx));
  if (shape.translation) titles.push(escapeHtml(explainName(ctx.explain)));
  const empty = shape.slots ? "" : "—";
  const grid = shape.rows.map((r) => {
    const cells = shape.columns.map((c) => (r[c.key] === undefined ? empty : cell(r[c.key] as Cell, ctx)));
    if (shape.translation) cells.push(r.tr === undefined ? "" : cell(r.tr, ctx));
    return cells;
  });
  const levels = shape.rows.map((r) => r.level);
  const r = (n: number): Level => levels[n] ?? from;
  // A row of one variety shows while the reader has chosen it, on a track with varieties.
  const varieties = shape.rows.map((leaf) => (ctx.varieties === undefined ? undefined : leaf.variety));
  const merged = shape.columns.map((c) => shape.slots && c.slot !== "subj");
  const starts = blockStarts(grid, levels, merged[0] === true, varieties);
  const span = spans(grid, levels, [...merged, false], starts, varieties);
  const center = shape.columns.map(() => shape.slots);
  const groups = shape.columns.map((c) => {
    const name = sentenceName(c, ctx.explain);
    return name === undefined ? undefined : escapeHtml(name);
  });
  const gaps = gapsAfter(groups);
  const width = grid[0]?.length ?? 0;
  // A gap row hides along with the row of one variety below it.
  const spacer = (n: number): string =>
    `<tr class="gap-row"${leafAttr(gapLevel(r(n - 1), r(n)))}${varietyAttr(varieties[n])}><td colspan="${String(width + gaps.filter(Boolean).length + (lesson ? 1 : 0))}"></td></tr>`;
  const end = (n: number): boolean[] | undefined => span[n]?.map((s) => n + s === grid.length);
  const value = (n: number): string => {
    const v = shape.rows[n]?.value;
    return v === undefined ? "" : ` data-value="${escapeHtml(String(v))}"`;
  };
  const tag = (n: number): string | undefined => {
    const v = varieties[n];
    return lesson && v !== undefined ? varietyName(v, ctx.explain) : undefined;
  };
  const rows = grid.map(
    (cells, n) =>
      (starts.has(n) ? spacer(n) : "") +
      row(
        r(n),
        from,
        cells,
        { span: span[n], center, gaps, end: end(n), tag: tag(n), trcol: shape.translation, slots: shape.slots },
        value(n) + varietyAttr(varieties[n]),
        lesson,
        ctx.explain,
      ),
  );
  const heads: HeadCell[] = titles.map((title, n) => ({
    title,
    group: groups[n],
    center: center[n] === true,
    ...(lesson && shape.translation && n === titles.length - 1 ? { names: ["tp-trcol"] } : {}),
  }));
  const compact = shape.slots ? ' class="compact"' : "";
  const table = `<table${compact} data-type="${block.type}">${headHtml(heads, lesson ? say("level", ctx.explain) : undefined)}<tbody>${rows.join("")}</tbody></table>`;
  const card = wrap(table, ctx, { slot: shape.slots, columns: titles.length });
  return lesson && shape.slots ? card + slotCards({ titles, groups, grid, levels, span, explain: ctx.explain }) : card;
}

export function errorsHtml(block: ErrorsBlock, ctx: Ctx, from: Level): string {
  const lesson = ctx.lesson === true;
  const rows = block.rows.filter((r) => serves(r, ctx.explain));
  const withRule = rows.some((r) => r.rule !== undefined);
  const heads: HeadCell[] = lesson
    ? [
        { title: escapeHtml(say("wrong", ctx.explain)), group: undefined, center: false, names: ["tp-wrong"] },
        { title: escapeHtml(say("right", ctx.explain)), group: undefined, center: false, names: ["tp-right"] },
      ]
    : ["✗", "✓"].map((title) => ({ title, group: undefined, center: false }));
  if (withRule) heads.push({ title: escapeHtml(say("ruleColumn", ctx.explain)), group: undefined, center: false });
  const body = rows.map((r) =>
    row(r.level, from, [cell(r.wrong, ctx), cell(r.right, ctx), ...(withRule ? [cell(r.rule, ctx)] : [])], {}, "", lesson, ctx.explain),
  );
  return wrap(
    `<table class="errors">${headHtml(heads, lesson ? say("level", ctx.explain) : undefined)}<tbody>${body.join("")}</tbody></table>`,
    ctx,
  );
}
