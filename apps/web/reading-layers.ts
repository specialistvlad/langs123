// The forms a reader with more than one language reads in (R9), offered by the width rule: interleaved, each layer's line
// under its block; main + reveal, the first language and a control under each block, example and list item that opens the
// others; side by side, a column per language with a row for each block, where the room the reading gets once the panes
// beside it give way holds every one of the reader's languages: 640 for two, 1000 for three.
import type { Block } from "../../scripts/generated/export-v1.ts";
import { Reading, THREE, WIDE } from "./reading.ts";
import { block, example, formLead, subtopic, table, tiled, tiles } from "./reading-blocks.ts";
import { errors } from "./reading-errors.ts";
import { essence, head } from "./reading-parts.ts";
import { side } from "./reading-side.ts";
import { esc, parseMarks, plain, tag } from "./reading-marks.ts";
import { ladder, partHead, SVG_CHEV } from "./reading-words.ts";

export const FORMS = ["interleaved", "reveal", "side"] as const;
export type Form = (typeof FORMS)[number];
const LABELS: Record<Form, string> = { interleaved: "layersInterleaved", reveal: "layersReveal", side: "layersSideBySide" };

// The forms the reading takes for the reader's languages: none for one language; side by side where the room holds them all.
export function forms(r: Reading): Form[] {
  if (r.others.length === 0) return [];
  return r.room >= (r.languages.length > 2 ? THREE : WIDE) ? [...FORMS] : ["interleaved", "reveal"];
}

export function switcher(r: Reading, shown: Form): string {
  const buttons = forms(r).map(
    (f) =>
      `<button type="button" role="tab" data-form="${f}" aria-selected="${String(f === shown)}">${esc(r.words.say(LABELS[f]))}</button>`,
  );
  return buttons.length === 0 ? "" : `<div class="rd-seg" role="tablist">${buttons.join("")}</div>`;
}

// One reading without its layers, for the main + reveal form's first language.
const alone = (r: Reading): Reading => new Reading(r.topic, r.source, [r.main], r.words, r.column, r.ctx.variety, r.room, r.speakers);

// The first language's text with the control that opens the other languages' under it, their tags on the control; the
// text alone where no other language has one.
function opener(r: Reading, main: string, others: { lang: string; text: string }[]): string {
  const shown = others.filter((o) => o.text !== "");
  if (shown.length === 0) return main;
  const control = `<button type="button" class="rd-more" aria-expanded="false">${shown.map((o) => tag(o.lang.toUpperCase())).join("")}${SVG_CHEV}</button>`;
  return `<div class="rd-rv">${main}${control}<div class="rd-rv-open" hidden>${shown.map((o) => r.layer(o.lang, o.text)).join("")}</div></div>`;
}

// R9 main + reveal: a fact or a why with one control; each example and each list item's lead with a control of its own; the
// tiles and the tables with the other languages in their lines, as the interleaved form draws them.
function reveal(r: Reading, b: Block, title: string): string {
  const one = alone(r);
  const others = (text: (language: string) => string): { lang: string; text: string }[] =>
    r.others.map((lang) => ({ lang, text: text(lang) }));
  if (b.type === "fact" || b.type === "why") {
    return opener(
      r,
      block(one, b, title),
      others((l) => r.sentences(b.text, l)),
    );
  }
  if (b.type === "example") {
    const items = b.items
      .filter((i) => r.shows(i.variety))
      .map(
        (i) =>
          r.wear(
            i.variety,
            opener(
              r,
              example(one, i),
              others((l) => r.in(l, i.tr)),
            ),
          ) + r.pin(i.id),
      );
    return `<div class="rd-exs">${items.join("")}</div>`;
  }
  if (b.type === "list") {
    const items = b.items.filter((i) => r.shows(i.variety));
    if (tiled(r, items)) return tiles(r, items);
    const lis = items.map((i) => {
      const text = i.text;
      const lead =
        text === undefined
          ? formLead(r, i)
          : opener(
              r,
              `<span>${r.m(r.say(i.id, text))}</span>`,
              others((l) => r.in(l, text)),
            );
      return `<li class="lx-li"><div class="lx-c">${lead}${i.ex === undefined ? "" : example(one, i.ex)}${r.pin(i.id)}</div></li>`;
    });
    return `<ul class="lx-list">${lis.join("")}</ul>`;
  }
  return table(r, b, title);
}

// The reading in a form: the head, the switch, then the parts; a form the room cannot take falls back to interleaved.
export function article(r: Reading, wanted: Form): string {
  const form = forms(r).includes(wanted) ? wanted : "interleaved";
  const bar = switcher(r, form);
  const subs = r.topic.subtopics;
  if (form === "interleaved") {
    const body = essence(r) + subs.map((s, i) => subtopic(r, s, i)).join("") + errors(r);
    return `<div class="rd-form" data-form="interleaved">${head(r)}${bar}${body}</div>`;
  }
  if (form === "reveal") {
    // One language reads: the head and part 00 stand as the one-language reading draws them, each block opening the others.
    const one = alone(r);
    const parts = subs.map((s, i) => {
      const title = r.m(r.say(s.title.id, s.title.text));
      const name = esc(plain(parseMarks(r.say(s.title.id, s.title.text)), r.ctx));
      const blocks = s.blocks.filter((b) => r.shows(b.variety)).map((b) => reveal(r, b, name));
      return `<section class="rd-part" id="${s.id}">${partHead(String(i + 1).padStart(2, "0"), title, ladder([s.level], r.words, false, s.id))}<div class="rd-flow">${blocks.join("")}</div></section>`;
    });
    return `<div class="rd-form" data-form="reveal">${head(one)}${bar}${essence(one)}${parts.join("")}${errors(r)}</div>`;
  }
  return `<div class="rd-form" data-form="side">${head(r, false)}${bar}${side(r)}${errors(r)}</div>`;
}
