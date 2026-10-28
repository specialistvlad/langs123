// The pictures of the library, drawn from primitives. A topic that says where things are carries a picture
// (kind scene-grid): a grid of cells, one per essence line, each a scene that puts a figure against a ground.
// The data names the place (`contained`, `under`, `across`…), the figure and the ground; this file draws it, so
// a picture follows the design and the words and never goes stale.
//
// Every scene is one square, a 96x96 viewBox, drawn in the colour tokens' variables alone (tokens.ts), so light and dark
// need no second drawing:
//   --c-text    the outline of a ground            --c-accent   the figure
//   --c-body    the detail inside a ground         --c-fill     the body of a ground
//   --c-sep     the floor, the road's markings     --c-surface  the cell, and what hides a figure behind a ground
// All strokes weigh 2. The drawing holds no text: a cell's caption is the essence line's word and its alt text the
// line's example, both set by the page from the data. picture-parts.ts draws the figure and the grounds, picture-scenes.ts
// composes them per place, and this file frames a scene, a primitive and the grid.
//
// Primitives
//   figure   ball
//   grounds  box (closed with a lid, or open at the top), table, shelf (a board on a wall), cover (a cloth),
//            house (a room's outline with a roof)
//   setting  road (the strip between two sides, drawn by `across` alone)
// The place decides how figure and ground meet: its composition is the rule below.
//
//   contained      the ball rises from an open box, its lower half hidden by the front wall (or stands in a house)
//   on-surface     the ball rests on the top of the ground
//   under          the ground stands or hangs just over the ball, which sits on the floor within its width
//   front          the ball is lower and nearer than the ground and covers part of it
//   back           the ball is higher and farther, and the ground covers part of it
//   beside         the ball stands against the ground's side, a hand's breadth away
//   near           the ball stands a ball's width and more from the ground, a little farther back
//   between        a ground each side, the ball in the gap
//   above          the ball floats over the ground
//   below          the ground hangs high, the ball on the floor, off to one side of it
//   across         the ball on one side of the road, the ground on the other
//   outside        the ground drawn open or as a house, the ball beside it, clear of the walls
//   under-covered  the ball half hidden by the ground tipped over it (or by a cloth over its left half)
import { ball, box, cover, type Drawn, floor, house, road, shelf, SIDE, SURFACE, table, WEIGHT } from "./picture-parts.ts";
import { compose } from "./picture-scenes.ts";

export const places = [
  "contained",
  "on-surface",
  "under",
  "front",
  "back",
  "beside",
  "near",
  "between",
  "above",
  "below",
  "across",
  "outside",
  "under-covered",
] as const;
export type Place = (typeof places)[number];

export const figures = ["ball"] as const;
export type Figure = (typeof figures)[number];

export const grounds = ["box", "table", "shelf", "cover", "house"] as const;
export type Ground = (typeof grounds)[number];

/** The grounds a place can be drawn on, the first its own (what `scene(place)` draws when the data names none). */
export const GROUNDS: Record<Place, readonly Ground[]> = {
  contained: ["box", "house"],
  "on-surface": ["box", "table", "shelf"],
  under: ["table", "box", "shelf"],
  front: ["box", "table"],
  back: ["box", "table"],
  beside: ["box", "table"],
  near: ["box", "table"],
  between: ["box", "table"],
  above: ["box", "shelf"],
  below: ["box", "shelf"],
  across: ["box", "table"],
  outside: ["house", "box"],
  "under-covered": ["cover", "box"],
};

export interface SceneOptions {
  /** The ground; two for `between`, the left then the right. Omitted, the place's own. */
  ground?: Ground | readonly Ground[];
  /** The figure; default "ball". */
  figure?: Figure;
  /** Pixel size of the svg element (a number, or a CSS length such as "100%"); omitted, the svg scales to its container. */
  size?: number | string;
  /** Accessible name; omitted, the svg is decorative. */
  label?: string | undefined;
}

// ---- the scene ----

const pick = (place: Place, ground: SceneOptions["ground"]): readonly Ground[] => {
  const allowed = GROUNDS[place];
  const given: Ground[] = ground === undefined ? allowed.slice(0, 1) : typeof ground === "string" ? [ground] : [...ground];
  const count = place === "between" ? 2 : 1;
  const [only] = given;
  if (given.length === 1 && count === 2 && only !== undefined) given.push(only);
  if (given.length !== count) {
    throw new Error(`${place} takes ${String(count)} ground${count === 1 ? "" : "s"}, not ${String(given.length)}`);
  }
  for (const g of given) if (!allowed.includes(g)) throw new Error(`${place} is drawn on ${allowed.join(", ")}, not ${g}`);
  return given;
};

const frame = (inner: string, { size, label }: Pick<SceneOptions, "size" | "label">): string => {
  const dims = size === undefined ? "" : ` width="${String(size)}" height="${String(size)}"`;
  const aria = label === undefined ? ` aria-hidden="true"` : ` role="img" aria-label="${esc(label)}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg"${dims} viewBox="0 0 ${String(SIDE)} ${String(SIDE)}"${aria}><rect width="${String(SIDE)}" height="${String(SIDE)}" rx="10" fill="${SURFACE}"/><g stroke-width="${String(WEIGHT)}" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
};

const esc = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The scene of a place: the figure against the ground, one square svg in the colour tokens' variables. */
export const scene = (place: Place, options: SceneOptions = {}): string => {
  if (!(places as readonly string[]).includes(place)) throw new Error(`no place ${place}; the places are ${places.join(", ")}`);
  if (options.figure !== undefined && !figures.includes(options.figure)) throw new Error(`no figure ${options.figure}`);
  return frame(compose[place](pick(place, options.ground)), options);
};

// ---- a primitive alone, for the design system's sheet ----

export const primitives = ["ball", "box", "box-open", "table", "shelf", "cover", "house", "road"] as const;
export type Primitive = (typeof primitives)[number];

/** One primitive on its own in the cell's frame. */
export const primitive = (name: Primitive, options: Pick<SceneOptions, "size" | "label"> = {}): string => {
  const bare = (d: Drawn): string => d.back + d.front;
  const parts: Record<Primitive, string> = {
    ball: ball(48, 48),
    box: bare(box(48, 62, 32, 26, false)),
    "box-open": bare(box(48, 62, 32, 26, true)),
    table: bare(table(48, 70, 48, 38)),
    shelf: bare(shelf(48, 74, 46, 40)),
    cover: cover(54, 66).front,
    house: bare(house(48, 72, 52, 30)),
    road: floor(10, 32) + floor(64, 86) + road(48, 24, 48),
  };
  return frame(parts[name], options);
};

// ---- the grid ----

export interface SceneCell {
  place: Place;
  /** The essence line's word, shown under the scene. */
  caption: string;
  /** The line's example, the scene's alt text. */
  label?: string;
  /** The essence line's id, carried as `data-line` so the page can tie the cell to its line. */
  line?: string;
  ground?: SceneOptions["ground"];
  figure?: Figure;
}

/** The cells as a grid, its classes' rules in the reading's stylesheet: on the web a cell takes 150 px at the least, so two
 * stand across at 402, three in a 556 column and five in 816; `across` fixes the count instead (rd-n3…rd-n5). */
export const sceneGrid = (cells: readonly SceneCell[], across?: number): string =>
  `<div class="rd-grid${across === undefined ? "" : ` rd-n${String(across)}`}">${cells
    .map((c) => {
      const options: SceneOptions = { size: "100%", label: c.label };
      if (c.ground !== undefined) options.ground = c.ground;
      if (c.figure !== undefined) options.figure = c.figure;
      const tie = c.line === undefined ? "" : ` data-line="${esc(c.line)}"`;
      return `<figure class="rd-cell"${tie}><div class="rd-sq">${scene(c.place, options)}</div><figcaption class="rd-cell-t">${esc(c.caption)}</figcaption></figure>`;
    })
    .join("")}</div>`;
