// R9 side by side: a column per language, the language heads and the definition first, then a row for each line of the
// essence and for each block of each subtopic, its form or sentence across the row and each language's text in its column;
// a table is drawn once across the columns and a tiled list as tagged tiles across the row.
import type { Block, Example, Subtopic, Table, Translated } from "../../scripts/generated/export-v1.ts";
import type { Reading } from "./reading.ts";
import { tableHtml, tiled } from "./reading-blocks.ts";
import { essenceLevels, essenceLine } from "./reading-parts.ts";
import { esc, marks, tag } from "./reading-marks.ts";
import { formText, ladder, partHead } from "./reading-words.ts";

const cell = (html: string, language: string): string => `<div class="rd-lc" lang="${language}">${html}</div>`;

// The text of a map in a language: the first language's through the reading, which notes what it lacks; the others' as the
// map holds them.
const text = (r: Reading, language: string, id: string, map: Translated | undefined): string =>
  language === r.main ? r.say(id, map) : r.in(language, map);

// A sentence or a form across the row, then a gloss under it in each column that has one; the course's own column holds
// none where the sentence is already its text (`own`).
function glossRow(
  r: Reading,
  sentence: string,
  gloss: { id: string; text: Translated | undefined } | undefined,
  mark: (text: string) => string,
  own: boolean,
): string {
  const tr = (l: string): string => (gloss === undefined || (own && l === r.source) ? "" : text(r, l, gloss.id, gloss.text));
  const cells = r.languages.map((l) => {
    const t = tr(l);
    return cell(t === "" ? "" : `<span class="lx-tr">${mark(t)}</span>`, l);
  });
  return `<div class="rd-lrow"><span class="lx-ex rd-lsent">${sentence}</span>${cells.join("")}</div>`;
}

// An example across the row: the course's sentence, then a translation under it in each column that has one.
const exampleRow = (r: Reading, ex: Example): string => glossRow(r, r.m(ex.text), { id: ex.id, text: ex.tr }, (t) => r.m(t), true);

// The table drawn once across the columns, each head and each label carrying the other languages under it.
const sideTable = (r: Reading, b: Table): string => `<div class="rd-lspan">${tableHtml(r, b, b.columns)}</div>`;

// A tiled list runs across the row, each tile with its gloss in every language but the course's own, tagged.
function sideTiles(r: Reading, items: Extract<Block, { type: "list" }>["items"]): string {
  const row = items.map((i) => {
    const ex = i.ex;
    const sound = i.ipa === undefined ? "" : `<span class="rd-tile-s">${r.m(`{ipa ${i.ipa}}`)}</span>`;
    const word = ex === undefined ? "" : `<span class="rd-tile-w">${r.m(ex.text)}</span>`;
    const glosses = r.languages
      .filter((l) => l !== r.source)
      .map((l) => {
        const t = ex === undefined ? "" : text(r, l, ex.id, ex.tr);
        return t === "" ? "" : `<span class="lx-tr" lang="${l}">${tag(l.toUpperCase())}${r.m(t)}</span>`;
      });
    return `<div class="rd-tile"><b class="rd-term">${r.m(formText(i.form))}</b>${sound}${word}${glosses.join("")}${r.pin(i.id)}</div>`;
  });
  return `<div class="rd-lspan"><div class="rd-tiles rd-tl">${row.join("")}</div></div>`;
}

function sideBlock(r: Reading, b: Block): string {
  const sentences = (l: string, list: Extract<Block, { type: "fact" | "why" }>["text"]): string => r.m(r.sentences(list, l));
  if (b.type === "fact") return r.languages.map((l) => cell(`<p class="lx-p">${sentences(l, b.text)}</p>`, l)).join("");
  if (b.type === "why") {
    return r.languages
      .map((l) =>
        cell(`<div class="rd-why"><p class="lx-label">${esc(r.words.in(l).say("why"))}</p><p>${sentences(l, b.text)}</p></div>`, l),
      )
      .join("");
  }
  if (b.type === "example") {
    return b.items
      .filter((i) => r.shows(i.variety))
      .map((i) => exampleRow(r, i))
      .join("");
  }
  if (b.type === "list") {
    const items = b.items.filter((i) => r.shows(i.variety));
    if (tiled(r, items)) return sideTiles(r, items);
    return items
      .map((i) => {
        const lead = r.languages.map((l) =>
          cell(`<div class="lx-li"><div class="lx-c">${i.text === undefined ? "" : r.m(text(r, l, i.id, i.text))}</div></div>`, l),
        );
        return lead.join("") + (i.ex === undefined ? "" : exampleRow(r, i.ex));
      })
      .join("");
  }
  return sideTable(r, b);
}

// The own blocks of each language that follow a block, each in its language's column: its tag, then a fact's or a why's
// text as a paragraph or an example's items.
function sideOwn(r: Reading, part: string, after: string): string {
  return r.languages
    .flatMap((l) =>
      (r.topic.own[l]?.blocks ?? []).filter((o) => o.in === part && o.after === after && r.shows(o.variety)).map((o) => ({ l, o })),
    )
    .map(({ l, o }) => {
      const body =
        o.type === "example"
          ? `<div class="rd-exs">${(o.items ?? []).map((i) => `<span class="lx-ex">${r.m(i.text)}<span class="lx-tr" lang="${l}">${r.m(i.tr)}</span></span>`).join("")}</div>`
          : `<p class="lx-p">${marks((o.text ?? []).map((s) => s.text).join(" "), r.ctx)}</p>`;
      const html =
        r.wear(o.variety, `<div class="rd-blk" lang="${l}"><span class="rd-lang">${tag(l.toUpperCase())}</span>${body}</div>`) +
        r.pin(o.id);
      return r.languages.map((c) => cell(c === l ? html : "", c)).join("");
    })
    .join("");
}

function sideSubtopic(r: Reading, s: Subtopic, index: number): string {
  const title = partHead(String(index + 1).padStart(2, "0"), r.m(r.say(s.title.id, s.title.text)), ladder([s.level], r.words, false, s.id));
  const rows = s.blocks.filter((b) => r.shows(b.variety)).map((b) => sideBlock(r, b) + sideOwn(r, s.id, b.id));
  return `<div class="rd-lspan rd-part" id="${s.id}">${title}</div>${rows.join("")}`;
}

// R4 side by side: part 00's head across the columns with the range of its lines' levels, then a row per line, its form or
// example across and each language's gloss or translation in its column, the marks still.
function sideEssence(r: Reading): string {
  const rows = r.topic.essence
    .filter((e) => r.shows(e.variety))
    .map((e) => {
      const { form, gloss } = essenceLine(r, e);
      return glossRow(r, form, gloss, (t) => marks(t, { ...r.ctx, still: true }), e.ex !== undefined);
    });
  const levels = essenceLevels(r);
  const mark = levels.length === 0 ? "" : ladder(levels, r.words, false, "essence");
  return `<div class="rd-lspan rd-part" id="essence">${partHead("00", esc(r.words.say("essence")), mark)}</div>${rows.join("")}`;
}

// The grid: the heads of the languages, the definition in each, part 00 and each subtopic.
export function side(r: Reading): string {
  const heads = r.languages.map((l) => cell(`<span class="rd-lhead">${tag(l.toUpperCase())}${esc(r.words.name(l))}</span>`, l)).join("");
  const define = (l: string): string => text(r, l, r.topic.definition.id, r.topic.definition.text);
  const lead = r.languages.map((l) => cell(`<p class="lx-lead">${r.m(define(l))}</p>`, l)).join("");
  const subs = r.topic.subtopics.map((s, i) => sideSubtopic(r, s, i)).join("");
  return `<div class="rd-lgrid rd-l${String(r.languages.length)}">${heads}${lead}${sideEssence(r)}${subs}</div>`;
}
