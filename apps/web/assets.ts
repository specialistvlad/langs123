// Files every page loads: the stylesheet, the browser script, and the level colours with the level filter
// and the variety switch.
import { join } from "node:path";
import { LEVEL_INFO } from "../../scripts/lib.ts";
import { levelColoursCss } from "./level-colours.ts";
import { tokensCss } from "./tokens.ts";

const APP = import.meta.dir;

// The stylesheet's parts in cascade order; each stays under 200 lines (npm run lint).
const STYLES = [
  "base",
  "topbar",
  "head",
  "panels",
  "layout",
  "document",
  "tables",
  "media",
  "static-pages",
  "views",
  "rail",
  "frame",
  "notfound",
  "home",
  "home-results",
  "home-bar",
  "home-phone",
  "track",
  "track-rows",
  "track-menu",
  "track-phone",
  "home-more",
  "credits",
  "credits-cards",
  "level-mark",
  "topic",
  "topic-page",
  "topic-lists",
  "topic-marks",
  "topic-slots",
  "topic-rail",
  "topic-pagers",
  "topic-sheets",
  "topic-wide",
  "topic-phone",
  "topic-phone-bar",
  "topic-print",
];

// style.css: the colours and shadows of tokens.json (tokens.ts), then the parts of apps/web/styles/ joined in order.
export async function styleCss(): Promise<string> {
  const parts = await Promise.all(STYLES.map((name) => Bun.file(join(APP, "styles", `${name}.css`)).text()));
  return [tokensCss(), ...parts].join("\n");
}

// The browser script: client.ts and its modules bundled, types stripped.
export async function clientJs(): Promise<string> {
  const out = await Bun.build({ entrypoints: [join(APP, "client.ts")], target: "browser", format: "iife" });
  const [file] = out.outputs;
  if (!out.success || file === undefined) throw new Error(`client.ts does not build: ${out.logs.map((l) => l.message).join("\n")}`);
  return file.text();
}

// Everything about levels that depends on the scale in languages/levels.yaml: the rule handing each level's colours
// to its elements (level-colours.ts), the level marks' bars, and the level filter. An element's data-level is its
// lowest level; it hides while the filter (data-level on <html>) sits below it. The rail keeps its entries and greys
// them out; a section whose content all sits above the filter shows its note instead. A pill keeps its range and
// fades the half above the filter (layout.css draws the faded half); a mark dims the bars above it.
export function levelsCss(): string {
  const codes = LEVEL_INFO.map((l) => l.code);
  // A mark's bar of a level it holds: the level's strong colour, ringed in its ink where the theme draws the ring.
  const bars = codes.map(
    (code) =>
      `.lvm > i.lv-${code}.on { background: var(--lvl-${code}-strong); box-shadow: inset 0 0 0 var(--lvm-ring) var(--lvl-${code}-ink); }`,
  );
  const filter = codes.flatMap((code, i) => {
    const above = codes.slice(i + 1).map((c) => `[data-level="${c}"]`);
    if (above.length === 0) return [];
    const at = `html[data-level="${code}"]`;
    const list = `:is(${above.join(", ")})`;
    const needs = `:is(${codes
      .slice(i + 1)
      .map((c) => `[data-needs="${c}"]`)
      .join(", ")})`;
    const halves = `:is(${codes
      .slice(i + 1)
      .map((c) => `.lvl-${c}`)
      .join(", ")})`;
    return [
      `${at}:is([data-page="topic"], [data-page="track"]) ${list}:not(.toc > li) { display: none !important; }`,
      `${at}:is([data-page="topic"], [data-page="track"]) .lvl > .half${halves} { background: var(--beyond-bg); box-shadow: var(--beyond-edge); color: var(--beyond-ink); }`,
      `${at}[data-page="topic"] .toc > li${list} { opacity: 0.4; pointer-events: none; }`,
      `${at} .lvm > i:is(${codes
        .slice(i + 1)
        .map((c) => `.lv-${c}`)
        .join(", ")}).on { opacity: 0.35; }`,
      `${at} .filter-empty${needs} { display: block; }`,
    ];
  });
  // Previous, next and Up next of the other levels (sequence.ts), at every level the top one included.
  const around = codes.map((code) => `html[data-level="${code}"] [data-at]:not([data-at~="${code}"]) { display: none !important; }`);
  return [levelColoursCss(), ...bars, ...filter, ...around].join("\n") + "\n";
}

// The variety switch, for each language being learned with varieties (curriculum.yaml): the page names
// the chosen variety in data-variety on <html>, and every element tagged with another of its varieties
// hides. A table row, or a table cell's copy, of another variety keeps its place in the column widths
// with no height, its inline marks set to the top so their baselines open no line, so switching moves no column. An element whose leaves start later in the chosen variety (data-level-{variety}) follows the
// level filter from there. levels.css carries these rules after the level filter.
export function varietiesCss(varieties: readonly (readonly string[])[]): string {
  const codes = LEVEL_INFO.map((l) => l.code);
  const rules = varieties.flatMap((list) =>
    list.flatMap((chosen) => {
      const others = list.filter((v) => v !== chosen).map((v) => `[data-variety="${v}"]`);
      const page = `html[data-variety="${chosen}"]`;
      const other = `:is(${others.join(", ")})`;
      const hidden = [
        `${page} ${other}:not(tr, .cell-variety) { display: none !important; }`,
        `${page} :is(tr, .cell-variety)${other} { visibility: hidden; overflow: hidden; }`,
        `${page} :is(tr${other} :is(td, td *), .cell-variety${other}, .cell-variety${other} *) { height: 0 !important; min-height: 0 !important; padding-block: 0 !important; margin-block: 0 !important; border-block-width: 0 !important; line-height: 0 !important; vertical-align: top !important; }`,
      ];
      const attr = `data-level-${chosen.toLowerCase()}`;
      const filter = codes.flatMap((code, i) => {
        const above = codes.slice(i + 1).map((c) => `[${attr}="${c}"]`);
        if (above.length === 0) return [];
        const at = `html[data-variety="${chosen}"][data-level="${code}"]`;
        return [
          `${at}:is([data-page="topic"], [data-page="track"]) :is(${above.join(", ")}):not(.toc > li) { display: none !important; }`,
          `${at}[data-page="topic"] .toc > li:is(${above.join(", ")}) { opacity: 0.4; pointer-events: none; }`,
        ];
      });
      return [...hidden, ...filter];
    }),
  );
  return rules.map((r) => `${r}\n`).join("");
}
