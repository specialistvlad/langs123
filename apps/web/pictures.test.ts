// The pictures: every place draws a valid square svg in the colour tokens' variables alone, a ground a place cannot take is
// refused, the grid carries each cell's caption, label and line, and the sample topic's picture (words of place), as the new
// library's export carries it, makes its 15 cells. pictures.e2e.ts draws them and finds the figure in each.
import { expect, test } from "bun:test";
import { exportLibrary } from "../../scripts/export.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import {
  type Figure,
  figures,
  type Ground,
  grounds,
  GROUNDS,
  type Place,
  places,
  primitive,
  primitives,
  scene,
  sceneGrid,
} from "./pictures.ts";
import { wordsOfPlace } from "./pictures-sample.ts";

const COLOURS = ["text", "body", "accent", "fill", "sep", "surface"];
// The scenes of every place on every ground it takes.
const SCENES: [Place, Ground][] = places.flatMap((p) => GROUNDS[p].map((g): [Place, Ground] => [p, g]));

// Whether the markup is well formed: each tag closes, in order, and, unless text is allowed, nothing but tags stands between them.
function wellFormed(svg: string, text = false): boolean {
  const open: string[] = [];
  for (const [, slash, name, , self] of svg.matchAll(/<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)\s*(\/?)>/g)) {
    if (self === "/") continue;
    if (slash !== "/") open.push(name ?? "");
    else if (open.pop() !== name) return false;
  }
  return open.length === 0 && (text || svg.replace(/<[^>]*>/g, "").trim() === "");
}

test("the places are the data schema's, and the figure and the grounds are drawn objects it names", async () => {
  const schema = (await Bun.file(`${import.meta.dir}/../../library/schema/library.schema.json`).json()) as {
    definitions: { place: { enum: string[] }; object: { enum: string[] } };
  };
  expect([...schema.definitions.place.enum].sort()).toEqual([...places].sort());
  for (const drawn of [...figures, ...grounds]) expect(schema.definitions.object.enum).toContain(drawn);
});

test("thirteen places, each with the grounds it takes", () => {
  expect(places).toHaveLength(13);
  expect(new Set(places).size).toBe(13);
  for (const p of places) {
    expect(GROUNDS[p].length).toBeGreaterThan(0);
    for (const g of GROUNDS[p]) expect(grounds).toContain(g);
  }
  expect(figures).toEqual(["ball"]);
});

test("every place on every ground yields one valid square svg without text", () => {
  for (const [place, ground] of SCENES) {
    const svg = scene(place, { ground });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 96 96" aria-hidden="true">/);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(wellFormed(svg), `${place} on ${ground}`).toBe(true);
    expect(svg).not.toContain("<text");
  }
  for (const name of primitives) expect(wellFormed(primitive(name)), name).toBe(true);
});

test("the colours are the tokens' variables alone, the strokes one weight", () => {
  const all = [...SCENES.map(([p, g]) => scene(p, { ground: g })), ...primitives.map((p) => primitive(p))];
  for (const svg of all) {
    for (const [, attr, value] of svg.matchAll(/\s(fill|stroke)="([^"]*)"/g)) {
      if (value === "none") continue;
      const colour = /^var\(--c-([a-z]+)\)$/.exec(value ?? "")?.[1];
      expect(COLOURS, `${attr ?? ""}="${value ?? ""}"`).toContain(colour ?? "");
    }
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    expect([...new Set([...svg.matchAll(/stroke-width="([^"]*)"/g)].map((m) => m[1]))]).toEqual(["2"]);
  }
});

test("a ground a place cannot take, a wrong count and an unknown place are refused", () => {
  expect(() => scene("under-covered", { ground: "table" })).toThrow("under-covered is drawn on cover, box, not table");
  expect(() => scene("contained", { ground: ["box", "box"] })).toThrow("contained takes 1 ground, not 2");
  expect(() => scene("between", { ground: ["box", "box", "box"] })).toThrow("between takes 2 grounds, not 3");
  expect(() => scene("nowhere" as Place)).toThrow("no place nowhere");
  expect(() => scene("under", { figure: "cat" as Figure })).toThrow("no figure cat");
  expect(scene("between", { ground: "table" })).toBe(scene("between", { ground: ["table", "table"] }));
  expect(scene("between", { ground: ["box", "table"] })).not.toBe(scene("between", { ground: "box" }));
});

test("the label names the picture for a screen reader, the size sets its box", () => {
  expect(scene("under", { label: 'The ball is "under" the <box>.' })).toContain(
    ` role="img" aria-label="The ball is &quot;under&quot; the &lt;box&gt;."`,
  );
  expect(scene("under", { size: 120 })).toContain(` width="120" height="120" viewBox="0 0 96 96"`);
  expect(scene("under", { size: "100%" })).toContain(` width="100%" height="100%"`);
});

test("the grid holds a figure per cell, each tied to its line, and fixes the count across when asked", () => {
  const html = sceneGrid([
    { place: "contained", caption: "in", label: "The ball is in the box.", line: "ess.in", figure: "ball" },
    { place: "above", caption: "a < b", ground: "shelf" },
  ]);
  expect(html.startsWith('<div class="rd-grid">')).toBe(true);
  expect(html.match(/<figure class="rd-cell"/g)).toHaveLength(2);
  expect(html).toContain(`data-line="ess.in"`);
  expect(html).toContain(`aria-label="The ball is in the box."`);
  expect(html).toContain('<figcaption class="rd-cell-t">in</figcaption>');
  expect(html).toContain(">a &lt; b</figcaption>");
  expect(html).not.toContain("style=");
  expect(wellFormed(html, true)).toBe(true);
  expect(sceneGrid([], 3)).toBe('<div class="rd-grid rd-n3"></div>');
});

test("the sample's picture makes 15 cells, one for each essence line, captioned with its form", async () => {
  const cells = wordsOfPlace(await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true }));
  expect(cells).toHaveLength(15);
  expect(new Set(cells.map((c) => c.place))).toEqual(new Set(places));
  const html = sceneGrid(cells);
  expect(html.match(/<svg /g)).toHaveLength(15);
  expect(html).toContain(">in</figcaption>");
  expect(html).toContain(">in front of</figcaption>");
  expect(html).toContain(`aria-label="The ball is in the box."`);
  expect(html).toContain(`data-line="ess.beneath"`);
});
