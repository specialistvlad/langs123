// The wording and the small parts of the reading (reading-*.ts): the interface wording of the new library's export in a
// language, English where it lacks one; the languages' names from its site; the glyphs; the level mark and a part's head.
import type { LibraryFile } from "../../scripts/generated/export-v1.ts";
import { esc } from "./reading-marks.ts";

export type Text = Record<string, Record<string, string>>;

export class Words {
  constructor(
    readonly text: Text,
    readonly names: Text,
    readonly language: string,
    // The varieties' names by code (the interface's `varieties`: "Британія", "Латинська Америка").
    readonly varieties: Text = {},
  ) {}
  static of(library: Pick<LibraryFile, "interface" | "site">, language: string): Words {
    const { text, varieties } = library.interface as { text: Text; varieties?: Text };
    const { explain } = library.site as { explain: { code: string; name: Record<string, string> }[] };
    return new Words(text, Object.fromEntries(explain.map((e) => [e.code, e.name])), language, varieties ?? {});
  }
  // The same wording in another language.
  in(language: string): Words {
    return new Words(this.text, this.names, language, this.varieties);
  }
  // A key's wording; `{n}`, `{language}` and `{language:lower}` take their values from the call.
  say(key: string, values: Record<string, string> = {}): string {
    const entry = this.text[key];
    const raw = entry?.[this.language] ?? entry?.["en"] ?? key;
    return raw.replace(/\{(\w+)(:lower)?\}/g, (_, name: string, lower: string | undefined) => {
      const value = values[name] ?? `{${name}}`;
      return lower === undefined ? value : value.toLowerCase();
    });
  }
  // A language's name in this language.
  name(code: string): string {
    return this.names[code]?.[this.language] ?? this.names[code]?.["en"] ?? code;
  }
  // A variety's name in this language, English where it lacks one, nothing where the wording has no such variety.
  variety(code: string): string | undefined {
    return this.varieties[code]?.[this.language] ?? this.varieties[code]?.["en"];
  }
}

const svg = (w: number, h: number, box: string, weight: string, body: string): string =>
  `<svg width="${String(w)}" height="${String(h)}" viewBox="${box}" fill="none" stroke="currentColor" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const SVG_CLOCK = svg(13, 13, "0 0 14 14", "1.4", '<circle cx="7" cy="7" r="5.6"></circle><path d="M7 4v3.2l2 1.2"></path>');
export const SVG_CHEV = svg(8, 14, "0 0 8 14", "2", '<path d="M1.5 1.5L6.5 7l-5 5.5"></path>');
export const SVG_TICK = svg(18, 18, "0 0 24 24", "2.6", '<path d="M4.5 12.5l5 5 10-11"></path>');
export const SVG_X = svg(18, 18, "0 0 24 24", "2.6", '<path d="M6 6l12 12M18 6L6 18"></path>');
export const SVG_FULL = svg(16, 16, "0 0 24 24", "2", '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>');

export const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

// The level pill: a level's code alone on the level's colour, in the essence rows of a topic whose subtopics span levels.
export const pill = (level: string, words: Words): string =>
  `<span class="lx-pill lx-pill-${level}" aria-label="${esc(`${words.say("level")} ${level}`)}">${level}</span>`;

// The level mark: seven bars, those of the levels on, and the range in words; `opens` names the entry of the page's level
// popover a tap opens (level-popover.ts), the mark naming its levels for it.
export function ladder(levels: readonly string[], words: Words, small = false, opens = ""): string {
  const on = new Set(levels);
  const cells = LEVELS.map((l) => `<span class="lx-cell${on.has(l) ? ` lx-on-${l}` : ""}"></span>`).join("");
  const first = levels[0] ?? "";
  const range = levels.length > 1 ? `${first}–${levels[levels.length - 1] ?? ""}` : first;
  const label = `${words.say(levels.length > 1 ? "levels" : "level")} ${range}`;
  const popover = opens === "" ? "" : ` data-lv="${esc(opens)}" data-lv-levels="${levels.join(" ")}" popovertarget="lv-pop"`;
  return `<button type="button" class="lx-ladder${small ? " lx-sm" : ""}"${popover} aria-haspopup="dialog" aria-label="${esc(label)}"><span class="lx-cells" aria-hidden="true">${cells}<span class="lx-lvt">${range}</span></span></button>`;
}

// A part's head: its number, its title and its level mark.
export const partHead = (num: string, title: string, mark = ""): string =>
  `<h2 class="lx-h2"><span class="lx-t">${num === "" ? "" : `<span class="lx-num">${num}</span>`}${title}</span>${mark}</h2>`;

// A list of the sentences a translation splits reads as one text.
export const flat = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value.join(" ") : value);
// A form is one string or the pieces of one (a capital and its small letter), read as one line.
export const formText = (form: string | string[] | undefined): string => (Array.isArray(form) ? form.join(" ") : (form ?? ""));
