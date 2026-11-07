// The blocks of a subtopic in the interleaved form (R2–R5): each in the first language, the layers' lines under it. A fact runs
// as one paragraph, a why sits in its box, an example is the course's sentence with a translation per language, a list leads
// each item with its text or its form, a table splits into the column groups that fit and opens whole in Full screen.
import type { Block, Example, Subtopic, Table, Translated } from "../../scripts/generated/export-v1.ts";
import type { Reading } from "./reading.ts";
import { esc, marks, parseMarks, plain, tag } from "./reading-marks.ts";
import { columnWidth, splitColumns } from "./reading-table.ts";
import { formText, ladder, partHead, SVG_FULL } from "./reading-words.ts";

type Cell = Table["rows"][number]["cells"][string];
type Item = Extract<Block, { type: "list" }>["items"][number];
export type Own = NonNullable<Reading["topic"]["own"][string]>["blocks"][number];

export function fact(r: Reading, b: Extract<Block, { type: "fact" }>): string {
  const lines = r.layers((l) => r.sentences(b.text, l));
  const first = r.m(r.sentences(b.text));
  return r.wear(b.variety, lines === "" ? `<p class="lx-p">${first}</p>` : `<div class="rd-blk"><p>${first}</p>${lines}</div>`);
}

export function why(r: Reading, b: Extract<Block, { type: "why" }>): string {
  return `<div class="rd-why"><p class="lx-label">${esc(r.words.say("why"))}</p><p>${r.m(r.sentences(b.text))}</p>${r.layers((l) => r.sentences(b.text, l))}</div>`;
}

// The course's sentence and under it its translation into each reader language but the course's own; with layers each
// translation wears its language's code.
export function example(r: Reading, ex: Example): string {
  const tagged = r.others.length > 0;
  const lines = r.languages
    .filter((l) => l !== r.source)
    .map((l) => {
      const text = l === r.main ? r.say(ex.id, ex.tr) : r.in(l, ex.tr);
      if (text === "") return "";
      return tagged
        ? `<span class="lx-tr" lang="${l}"><span class="rd-trl">${tag(l.toUpperCase())}<span>${r.m(text)}</span></span></span>`
        : `<span class="lx-tr" lang="${l}">${r.m(text)}</span>`;
    });
  return `<span class="lx-ex">${r.m(ex.text)}${lines.join("")}</span>`;
}

export function examples(r: Reading, b: Extract<Block, { type: "example" }>): string {
  return `<div class="rd-exs">${b.items
    .filter((i) => r.shows(i.variety))
    .map((i) => r.wear(i.variety, example(r, i)) + r.pin(i.id))
    .join("")}</div>`;
}

// A list whose every shown item is a form with a one-word example lays out as tiles: the form, its transcription, the word
// and its translation, as many across as the column holds, 104 wide at the least and 150 where a tile carries the other
// languages' translations under their tags (reading-tiles.css). A list with a text or a sentence anywhere keeps rows.
export function tiled(r: Reading, items: readonly Item[]): boolean {
  return (
    items.length > 0 &&
    items.every(
      (i) => i.text === undefined && i.form !== undefined && i.ex !== undefined && !/\s/.test(plain(parseMarks(i.ex.text), r.ctx)),
    )
  );
}

export function tiles(r: Reading, items: readonly Item[]): string {
  return `<div class="rd-tiles${r.others.length > 0 ? " rd-tl" : ""}">${items
    .map((i) => {
      const ex = i.ex;
      const tr = ex === undefined || r.main === r.source ? "" : r.say(ex.id, ex.tr);
      const sound = i.ipa === undefined ? "" : `<span class="rd-tile-s">${r.m(`{ipa ${i.ipa}}`)}</span>`;
      const word = ex === undefined ? "" : `<span class="rd-tile-w">${r.m(ex.text)}</span>`;
      const layers = ex === undefined ? "" : r.layers((l) => (l === r.source ? "" : r.in(l, ex.tr)), "lx-tr rd-trl");
      return `<div class="rd-tile"><b class="rd-term">${r.m(formText(i.form))}</b>${sound}${word}${tr === "" ? "" : `<span class="lx-tr">${r.m(tr)}</span>`}${layers}${r.pin(i.id)}</div>`;
    })
    .join("")}</div>`;
}

// An item without a text leads with its form and the transcription after it.
export function formLead(r: Reading, i: Item): string {
  const sound = i.ipa === undefined ? "" : `<span class="lx-j" aria-hidden="true"></span>${r.m(`{ipa ${i.ipa}}`)}`;
  return `<p class="lx-p"><b class="rd-term">${r.m(formText(i.form))}</b>${sound}</p>`;
}

// An item with a text leads with it, the other languages' under it; one without leads with its form.
export function list(r: Reading, b: Extract<Block, { type: "list" }>): string {
  const items = b.items.filter((i) => r.shows(i.variety));
  if (tiled(r, items)) return tiles(r, items);
  return `<ul class="lx-list">${items
    .map((i) => {
      let lead: string;
      if (i.text === undefined) {
        lead = formLead(r, i);
      } else {
        const text = i.text;
        const lines = r.layers((l) => r.in(l, text));
        const first = r.m(r.say(i.id, text));
        lead = lines === "" ? first : `<span class="rd-stk"><span>${first}</span>${lines}</span>`;
      }
      return `<li class="lx-li"><div class="lx-c">${lead}${i.ex === undefined ? "" : example(r, i.ex)}${r.pin(i.id)}</div></li>`;
    })
    .join("")}</ul>`;
}

// A cell's lines: a text, a sentence in the first language, or its forms, each with its variety as the mark that shows it.
export function cellLines(r: Reading, cell: Cell | undefined): string[] {
  if (cell === undefined) return [];
  if (typeof cell === "string") return [cell];
  if (Array.isArray(cell)) return cell.map((f) => (typeof f === "string" ? f : `{variant ${f.variety} ${f.form}}`));
  return [r.say(cell.id, cell.text)];
}

// The card of a table with the columns named, drawn once for every reader language: each header and each label cell (a
// text, not a form, which belongs to the course's language) carries the other languages under it.
export function tableHtml(r: Reading, b: Table, columns: Table["columns"]): string {
  const more = (text: Translated | undefined): string =>
    r.others
      .map((l) => {
        const t = r.in(l, text);
        return t === "" ? "" : `<span class="rd-th2" lang="${l}">${r.m(t)}</span>`;
      })
      .join("");
  const th = columns.map((c) => `<th scope="col">${r.m(r.say(c.id, c.text))}${more(c.text)}</th>`).join("");
  const td = (cell: Cell | undefined): string => {
    const lines = cellLines(r, cell)
      .map((f) => r.m(f))
      .join("<br>");
    const label = cell !== undefined && typeof cell === "object" && !Array.isArray(cell) ? more(cell.text) : "";
    return `<td>${lines}${label}</td>`;
  };
  const rows = b.rows.map((row) => `<tr>${columns.map((c) => td(row.cells[c.key])).join("")}</tr>`);
  return `<div class="lx-tcard"><table class="lx-table"><thead><tr>${th}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

// R5: a table wider than the reading column splits into column groups that fit, each repeating the first column; Full screen
// opens a sheet over the dimmed page with the subtopic's title (its plain text) and Close, the whole table fitted to its
// width (client-reading.ts).
export function table(r: Reading, b: Extract<Block, { type: "table" }>, title = ""): string {
  const width = (c: Table["columns"][number]): number => {
    const lines = b.rows.flatMap((row) => cellLines(r, row.cells[c.key])).map((l) => plain(parseMarks(l), r.ctx).length);
    return columnWidth(r.say(c.id, c.text).length, lines, c === b.columns[0]);
  };
  const groups = splitColumns(b.columns, width, r.column);
  if (groups.length < 2) return tableHtml(r, b, b.columns);
  const full = esc(r.words.say("fullScreen"));
  const sheet =
    `<dialog class="rd-full" id="full-${b.id}" aria-label="${full}"><div class="rd-fs-dlg"><header class="rd-fs-bar"><h2 class="rd-fs-t">${title}</h2>` +
    `<form method="dialog"><button class="rd-btn">${esc(r.words.say("close"))}</button></form></header>` +
    `<div class="rd-fs-body"><div class="rd-fit">${tableHtml(r, b, b.columns)}</div></div></div></dialog>`;
  return `<div class="rd-card-s"><div class="rd-bar"><button type="button" class="rd-btn" data-full="${b.id}">${SVG_FULL} ${full}</button></div>${groups.map((g) => tableHtml(r, b, g)).join("")}${sheet}</div>`;
}

// A block written for one language alone: a fact, a why or examples, with the language's code.
export function ownBlock(r: Reading, l: string, o: Own): string {
  const text = marks((o.text ?? []).map((s) => s.text).join(" "), r.ctx);
  const code = `<span class="rd-lang">${tag(l.toUpperCase())}</span>`;
  if (o.type === "fact") return r.wear(o.variety, `<div class="rd-blk" lang="${l}">${code}<p>${text}</p></div>`);
  if (o.type === "why") {
    return r.wear(
      o.variety,
      `<div class="rd-why" lang="${l}"><p class="lx-label">${esc(r.words.say("why"))}</p>${code}<p>${text}</p></div>`,
    );
  }
  const items = (o.items ?? []).map((i) => `<span class="lx-ex">${r.m(i.text)}<span class="lx-tr" lang="${l}">${r.m(i.tr)}</span></span>`);
  return r.wear(o.variety, `<div class="rd-exs">${items.join("")}</div>`);
}

// The own blocks of each reader language that follow a block.
function own(r: Reading, part: string, after: string): string {
  return r.languages
    .flatMap((l) =>
      (r.topic.own[l]?.blocks ?? [])
        .filter((o) => o.in === part && o.after === after && r.shows(o.variety))
        .map((o) => ownBlock(r, l, o) + r.pin(o.id)),
    )
    .join("");
}

export function block(r: Reading, b: Block, title = ""): string {
  if (b.type === "fact") return fact(r, b);
  if (b.type === "why") return why(r, b);
  if (b.type === "example") return examples(r, b);
  if (b.type === "list") return list(r, b);
  return table(r, b, title);
}

// R1: a subtopic's head, numbered from 01, with its level, and its blocks; a table's Full screen names the subtopic in plain text.
export function subtopic(r: Reading, s: Subtopic, index: number): string {
  const num = String(index + 1).padStart(2, "0");
  const title = r.m(r.say(s.title.id, s.title.text));
  const name = esc(plain(parseMarks(r.say(s.title.id, s.title.text)), r.ctx));
  const blocks = s.blocks.filter((b) => r.shows(b.variety)).map((b) => block(r, b, name) + r.pin(b.id) + own(r, s.id, b.id));
  return `<section class="rd-part" id="${s.id}">${partHead(num, title, ladder([s.level], r.words))}${r.pin(s.id)}<div class="rd-flow">${blocks.join("")}</div></section>`;
}
