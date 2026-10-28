// The forms a reader with more than one language reads in (R9), offered by the width rule: interleaved, each layer's line
// under its block; main + reveal, the first language and a control under each block that opens the others; side by side,
// a column per language with a row for each block, from a column of 640 for two languages and, for three, where the page
// gives the column 1000 once the panes beside it give way.
import type { Block, Example, Subtopic, Table } from "../../scripts/generated/export-v1.ts";
import { Reading, THREE, WIDE } from "./reading.ts";
import { block, cellLines, ownBlock, subtopic } from "./reading-blocks.ts";
import { essence, errors, head } from "./reading-parts.ts";
import { esc, tag } from "./reading-marks.ts";
import { formText, ladder, partHead, SVG_CHEV } from "./reading-words.ts";

export const FORMS = ["interleaved", "reveal", "side"] as const;
export type Form = (typeof FORMS)[number];
const LABELS: Record<Form, string> = { interleaved: "layersInterleaved", reveal: "layersReveal", side: "layersSideBySide" };

// The forms the reading column takes for the reader's languages: none for one language.
export function forms(r: Reading): Form[] {
  if (r.others.length === 0) return [];
  return (r.languages.length > 2 ? r.room >= THREE : r.column >= WIDE) ? [...FORMS] : ["interleaved", "reveal"];
}

export function switcher(r: Reading, shown: Form): string {
  const buttons = forms(r).map(
    (f) =>
      `<button type="button" role="tab" data-form="${f}" aria-selected="${String(f === shown)}">${esc(r.words.say(LABELS[f]))}</button>`,
  );
  return buttons.length === 0 ? "" : `<div class="rd-seg" role="tablist">${buttons.join("")}</div>`;
}

// One reading without its layers, for the main + reveal form's first language.
const alone = (r: Reading): Reading => new Reading(r.topic, r.source, [r.main], r.words, r.column, r.ctx.variety);

// A block in the first language with the control that opens its other languages.
function reveal(r: Reading, b: Block, title: string): string {
  const others = r.others.filter((l) => layerOf(r, b, l) !== "");
  const main = block(alone(r), b, title);
  if (others.length === 0) return main;
  const control = `<button type="button" class="rd-more" aria-expanded="false">${others.map((l) => tag(l.toUpperCase())).join("")}${SVG_CHEV}</button>`;
  return `<div class="rd-rv">${main}${control}<div class="rd-rv-open" hidden>${others.map((l) => r.layer(l, layerOf(r, b, l))).join("")}</div></div>`;
}

// A block's text in a layer language, as one line.
function layerOf(r: Reading, b: Block, language: string): string {
  if (b.type === "fact" || b.type === "why") return r.sentences(b.text, language);
  if (b.type === "example") {
    return b.items
      .map((i) => r.in(language, i.tr))
      .join(" ")
      .trim();
  }
  if (b.type === "list") {
    return b.items
      .map((i) => r.in(language, i.text))
      .join(" · ")
      .replace(/^( · )+|( · )+$/g, "");
  }
  return "";
}

const cell = (html: string, language: string): string => `<div class="rd-lc" lang="${language}">${html}</div>`;

// An example across the row: the course's sentence, then a translation under it in each column that has one.
function exampleRow(r: Reading, ex: Example): string {
  const tr = (l: string): string => (l === r.source ? "" : l === r.main ? r.say(ex.id, ex.tr) : r.in(l, ex.tr));
  return `<div class="rd-lrow"><span class="lx-ex rd-lsent">${r.m(ex.text)}</span>${r.languages.map((l) => cell(tr(l) === "" ? "" : `<span class="lx-tr">${r.m(tr(l))}</span>`, l)).join("")}</div>`;
}

// The table drawn once across the columns, each head carrying the other languages under it.
function sideTable(r: Reading, b: Table): string {
  const th = b.columns
    .map(
      (c) =>
        `<th scope="col">${r.m(r.say(c.id, c.text))}${r.others.map((l) => `<span class="rd-th2" lang="${l}">${r.m(r.in(l, c.text))}</span>`).join("")}</th>`,
    )
    .join("");
  const tr = b.rows.map(
    (row) =>
      `<tr>${b.columns
        .map(
          (c) =>
            `<td>${cellLines(r, row.cells[c.key])
              .map((f) => r.m(f))
              .join("<br>")}</td>`,
        )
        .join("")}</tr>`,
  );
  return `<div class="rd-lspan"><div class="lx-tcard"><table class="lx-table"><thead><tr>${th}</tr></thead><tbody>${tr.join("")}</tbody></table></div></div>`;
}

function sideBlock(r: Reading, b: Block): string {
  const text = (l: string, list: Extract<Block, { type: "fact" | "why" }>["text"]): string => r.m(r.sentences(list, l));
  if (b.type === "fact") return r.languages.map((l) => cell(`<p class="lx-p">${text(l, b.text)}</p>`, l)).join("");
  if (b.type === "why") {
    return r.languages
      .map((l) => cell(`<div class="rd-why"><p class="lx-label">${esc(r.words.in(l).say("why"))}</p><p>${text(l, b.text)}</p></div>`, l))
      .join("");
  }
  if (b.type === "example") {
    return b.items
      .filter((i) => r.shows(i.variety))
      .map((i) => exampleRow(r, i))
      .join("");
  }
  if (b.type === "list") {
    return b.items
      .filter((i) => r.shows(i.variety))
      .map((i) => {
        const lead = r.languages.map((l) =>
          cell(
            `<div class="lx-li"><div class="lx-c">${i.text === undefined ? "" : r.m(l === r.main ? r.say(i.id, i.text) : r.in(l, i.text))}</div></div>`,
            l,
          ),
        );
        return lead.join("") + (i.ex === undefined ? "" : exampleRow(r, i.ex));
      })
      .join("");
  }
  return sideTable(r, b);
}

// The own blocks of each language that follow a block, each in its language's column.
function sideOwn(r: Reading, part: string, after: string): string {
  return r.languages
    .flatMap((l) =>
      (r.topic.own[l]?.blocks ?? []).filter((o) => o.in === part && o.after === after && r.shows(o.variety)).map((o) => ({ l, o })),
    )
    .map(({ l, o }) => r.languages.map((c) => cell(c === l ? ownBlock(r, l, o) : "", c)).join(""))
    .join("");
}

function sideSubtopic(r: Reading, s: Subtopic, index: number): string {
  const title = partHead(String(index + 1).padStart(2, "0"), r.m(r.say(s.title.id, s.title.text)), ladder([s.level], r.words));
  const rows = s.blocks.filter((b) => r.shows(b.variety)).map((b) => sideBlock(r, b) + sideOwn(r, s.id, b.id));
  return `<div class="rd-lspan rd-part" id="${s.id}">${title}</div>${rows.join("")}`;
}

// R4 side by side: part 00's head across the columns, then a row per line, its form or example across and each language's
// gloss or translation in its column.
function sideEssence(r: Reading): string {
  const rows = r.topic.essence
    .filter((e) => r.shows(e.variety))
    .map((e) => {
      if (e.ex !== undefined) return exampleRow(r, e.ex);
      const sound = e.ipa === undefined ? "" : `<span class="lx-j" aria-hidden="true"></span>${r.m(`{ipa ${e.ipa}}`)}`;
      const form = `<b class="lx-b">${r.m(formText(e.form))}</b>${sound}`;
      const gloss = (l: string): string => (e.text === undefined ? "" : l === r.main ? r.say(e.id, e.text) : r.in(l, e.text));
      return `<div class="rd-lrow"><span class="rd-lsent">${form}</span>${r.languages.map((l) => cell(gloss(l) === "" ? "" : `<span class="lx-tr">${r.m(gloss(l))}</span>`, l)).join("")}</div>`;
    });
  return `<div class="rd-lspan rd-part" id="essence">${partHead("00", esc(r.words.say("essence")))}</div>${rows.join("")}`;
}

// The reading in a form: the head, the switch, then the parts; a form the column cannot take falls back to interleaved.
export function article(r: Reading, wanted: Form): string {
  const form = forms(r).includes(wanted) ? wanted : "interleaved";
  const bar = switcher(r, form);
  const subs = r.topic.subtopics;
  if (form === "interleaved") {
    const body = essence(r) + subs.map((s, i) => subtopic(r, s, i)).join("") + errors(r);
    return `<div class="rd-form" data-form="interleaved">${head(r)}${bar}${body}</div>`;
  }
  if (form === "reveal") {
    const parts = subs.map((s, i) => {
      const title = r.m(r.say(s.title.id, s.title.text));
      const blocks = s.blocks.filter((b) => r.shows(b.variety)).map((b) => reveal(r, b, title));
      return `<section class="rd-part" id="${s.id}">${partHead(String(i + 1).padStart(2, "0"), title, ladder([s.level], r.words))}<div class="rd-flow">${blocks.join("")}</div></section>`;
    });
    return `<div class="rd-form" data-form="reveal">${head(r)}${bar}${essence(r)}${parts.join("")}${errors(r)}</div>`;
  }
  const heads = r.languages.map((l) => cell(`<span class="rd-lhead">${tag(l.toUpperCase())}${esc(r.words.name(l))}</span>`, l)).join("");
  const define = (l: string): string =>
    l === r.main ? r.say(r.topic.definition.id, r.topic.definition.text) : r.in(l, r.topic.definition.text);
  const lead = r.languages.map((l) => cell(`<p class="lx-lead">${r.m(define(l))}</p>`, l)).join("");
  const grid = `<div class="rd-lgrid rd-l${String(r.languages.length)}">${heads}${lead}${sideEssence(r)}${subs.map((s, i) => sideSubtopic(r, s, i)).join("")}</div>`;
  return `<div class="rd-form" data-form="side">${head(r, false)}${bar}${grid}${errors(r)}</div>`;
}
