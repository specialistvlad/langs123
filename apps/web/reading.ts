// A topic of the new library read in the reader's languages (R1–R9 of the presentation map): the first language explains,
// the others follow it as layers. Reading holds what every block needs: the topic, its languages, the variety on show, the
// width of the reading column and the wording. The blocks are reading-blocks.ts, the parts reading-parts.ts, the layers'
// forms reading-layers.ts; each returns HTML, on the server and in the browser alike.
import type { Sentence, Topic, Translated } from "../../scripts/generated/export-v1.ts";
import { type Ctx, marks, tag, varietyLabel } from "./reading-marks.ts";
import { flat, type Words } from "./reading-words.ts";

// Where the reading column is wide enough for two languages side by side; the essence's two columns and an error's three
// follow the same width in the stylesheet.
export const WIDE = 640;
// Where three languages stand side by side.
export const THREE = 1000;

export class Reading {
  readonly ctx: Ctx;
  // The ids of the texts the first language lacks: the course's own text stands in for them.
  readonly missing: string[] = [];
  constructor(
    readonly topic: Topic,
    // The course's own language: the language of its text.
    readonly source: string,
    // The reader's languages that the topic has, the first the one that explains.
    readonly languages: readonly string[],
    readonly words: Words,
    readonly column: number,
    variety: string,
    // The width the column takes once the panes beside it give way: the side-by-side form of three languages asks for it.
    readonly room: number = column,
    // The languages of the reader whose speakers' errors show: Languages I know, the page's first, whether the topic is
    // written in them or not.
    readonly speakers: readonly string[] = languages,
  ) {
    this.ctx = { variety, name: (code) => words.variety(code), tap: words.say("variantTap") };
  }
  // What a reviewer's page sets under an element, by the id the reading draws it with (pages/review.ts); nothing elsewhere.
  pin: (id: string) => string = () => "";
  get main(): string {
    return this.languages[0] ?? this.source;
  }
  get others(): readonly string[] {
    return this.languages.slice(1);
  }
  // The first language's text of a map; where it lacks one, the course's own text, and the id is noted.
  say(id: string, text: Translated | undefined): string {
    const found = flat(text?.[this.main]);
    if (found === undefined) this.missing.push(id);
    return found ?? flat(text?.[this.source]) ?? "";
  }
  // A layer language's text of a map, or nothing.
  in(language: string, text: Translated | undefined): string {
    return flat(text?.[language]) ?? "";
  }
  // The sentences of a block in a language, as one paragraph.
  sentences(list: readonly Sentence[], language = this.main): string {
    return list
      .map((s) => (language === this.main ? this.say(s.id, s.text) : this.in(language, s.text)))
      .join(" ")
      .trim();
  }
  shows(variety: string | undefined): boolean {
    return variety === undefined || this.ctx.variety === "all" || variety === this.ctx.variety;
  }
  m(text: string): string {
    return marks(text, this.ctx);
  }
  // A block that serves one variety wears its name.
  wear(variety: string | undefined, html: string): string {
    return variety === undefined ? html : `<div class="rd-tag-row">${tag(varietyLabel(variety, this.ctx))}${html}</div>`;
  }
  // A layer's line under a block: the language's code on a capsule and its text; a translation's line wears the classes of
  // one (lx-tr rd-trl), and an essence row's gloss draws its marks still.
  layer(language: string, text: string, cls = "rd-lang", mark: (text: string) => string = (t) => this.m(t)): string {
    return text === "" ? "" : `<span class="${cls}" lang="${language}">${tag(language.toUpperCase())}<span>${mark(text)}</span></span>`;
  }
  // The layers' lines of a map, in the reader's order.
  layers(text: (language: string) => string, cls = "rd-lang", mark?: (text: string) => string): string {
    return this.others.map((l) => this.layer(l, text(l), cls, mark)).join("");
  }
}
