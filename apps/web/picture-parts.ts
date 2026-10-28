// The figure and the grounds of the pictures (pictures.ts), each drawn in the colour tokens' variables on the 96x96 cell.
// ---- the colours ----

const TEXT = "var(--c-text)";
const BODY = "var(--c-body)";
const ACCENT = "var(--c-accent)";
const FILL = "var(--c-fill)";
const SEP = "var(--c-sep)";
export const SURFACE = "var(--c-surface)";

// ---- the drawing's measures ----

export const SIDE = 96;
export const FLOOR = 74;
export const WEIGHT = 2;
export const RADIUS = 9; // the ball's

export const n = (v: number): string => String(Math.round(v * 100) / 100);

/** The centre of a ball resting on a line at y. */
export const rest = (y: number): number => y - RADIUS - WEIGHT / 2;

// A shape filled with the surface first and the ground's fill over it, so what stands behind it stays hidden.
const solid = (tag: "rect" | "path", geometry: string, stroke: string = TEXT, fill: string = FILL): string =>
  `<${tag} ${geometry} fill="${SURFACE}"/><${tag} ${geometry} fill="${fill}" stroke="${stroke}"/>`;
const line = (d: string, stroke: string, extra = ""): string => `<path d="${d}" fill="none" stroke="${stroke}"${extra}/>`;

// ---- the figure ----

export const ball = (cx: number, cy: number): string =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${RADIUS}" fill="${ACCENT}"/>` +
  line(`M${n(cx - 5.5)} ${n(cy - 1)}A5.5 5.5 0 0 1 ${n(cx - 1)} ${n(cy - 5.5)}`, SURFACE, ` stroke-opacity="0.6"`);

// ---- the grounds ----

/** A drawn ground: `back` lies behind the figure, `front` in front of it; the rest is where it reaches. */
export interface Drawn {
  back: string;
  front: string;
  left: number;
  right: number;
  top: number;
}

export const box = (cx: number, base: number, w: number, h: number, open: boolean): Drawn => {
  const top = base - h;
  if (open) {
    // Seen from a little above: the far rim shows behind the figure, the near wall in front of it.
    const flare = 2;
    const rim = 5;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    return {
      back: solid("path", `d="M${n(x0 - flare)} ${n(top)}L${n(x0)} ${n(top - rim)}H${n(x1)}L${n(x1 + flare)} ${n(top)}Z"`, TEXT, SEP),
      front:
        solid("path", `d="M${n(x0 - flare)} ${n(top)}L${n(x0)} ${n(base)}H${n(x1)}L${n(x1 + flare)} ${n(top)}Z"`) +
        line(`M${n(cx - 4)} ${n(top + 7)}H${n(cx + 4)}`, BODY),
      left: x0 - flare,
      right: x1 + flare,
      top,
    };
  }
  const lid = Math.max(4, Math.round(h / 4.5));
  const x = cx - w / 2;
  const handle = h >= 22 ? line(`M${n(cx - 4)} ${n(top + lid + 5)}H${n(cx + 4)}`, BODY) : "";
  return {
    back: "",
    front:
      solid("rect", `x="${n(x)}" y="${n(top + lid)}" width="${n(w)}" height="${n(h - lid)}" rx="1"`) +
      handle +
      solid("rect", `x="${n(x - 2)}" y="${n(top)}" width="${n(w + 4)}" height="${n(lid)}" rx="1.5"`),
    left: x - 2,
    right: x + w + 2,
    top,
  };
};

const BAR = 5; // the thickness of a tabletop or a shelf board

export const table = (cx: number, base: number, w: number, h: number): Drawn => {
  const top = base - h;
  const inset = 5;
  return {
    back: "",
    front:
      line(`M${n(cx - w / 2 + inset)} ${n(top + BAR)}V${n(base)}M${n(cx + w / 2 - inset)} ${n(top + BAR)}V${n(base)}`, TEXT) +
      solid("rect", `x="${n(cx - w / 2)}" y="${n(top)}" width="${n(w)}" height="${n(BAR)}" rx="1.5"`),
    left: cx - w / 2,
    right: cx + w / 2,
    top,
  };
};

export const shelf = (cx: number, base: number, w: number, h: number): Drawn => {
  const top = base - h;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  return {
    // The wall behind the board: a panel of the ground's fill without an outline, floor to near the cell's top.
    back: `<rect x="10" y="10" width="76" height="${n(base - 10)}" fill="${SURFACE}"/><rect x="10" y="10" width="76" height="${n(base - 10)}" fill="${FILL}"/>`,
    front:
      line(
        `M${n(x0 + 4)} ${n(top + BAR + 8)}L${n(x0 + 12)} ${n(top + BAR)}M${n(x1 - 4)} ${n(top + BAR + 8)}L${n(x1 - 12)} ${n(top + BAR)}`,
        BODY,
      ) + solid("rect", `x="${n(x0)}" y="${n(top)}" width="${n(w)}" height="${n(BAR)}" rx="1.5"`),
    left: x0,
    right: x1,
    top,
  };
};

export const house = (cx: number, base: number, w: number, h: number): Drawn => {
  const top = base - h;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const roof = Math.round(w * 0.38);
  const door = line(`M${n(x1 - 14)} ${n(base)}V${n(base - 14)}H${n(x1 - 6)}V${n(base)}`, BODY);
  return {
    back:
      solid("rect", `x="${n(x0)}" y="${n(top)}" width="${n(w)}" height="${n(h)}"`) +
      solid("path", `d="M${n(x0 - 4)} ${n(top)}L${n(cx)} ${n(top - roof)}L${n(x1 + 4)} ${n(top)}Z"`) +
      door,
    front: "",
    left: x0,
    right: x1,
    top: top - roof,
  };
};

// A cloth over a lump the size of the ball: a dome centred on cx, its right foot lifted, so the lower right of a
// lump set a little right of cx shows.
export const cover = (cx: number, base: number): Drawn => {
  const d =
    `M${n(cx - 14)} ${n(base)}C${n(cx - 14)} ${n(base - 12)} ${n(cx - 9)} ${n(base - 23)} ${n(cx)} ${n(base - 23)}` +
    `C${n(cx + 9)} ${n(base - 23)} ${n(cx + 14)} ${n(base - 17)} ${n(cx + 14)} ${n(base - 14)}` +
    `Q${n(cx + 5)} ${n(base - 8)} ${n(cx - 5)} ${n(base)}Z`;
  return {
    back: "",
    front:
      solid("path", `d="${d}"`) +
      line(`M${n(cx - 10)} ${n(base - 8)}C${n(cx - 9)} ${n(base - 13)} ${n(cx - 6)} ${n(base - 17)} ${n(cx - 2)} ${n(base - 19)}`, BODY),
    left: cx - 14,
    right: cx + 14,
    top: base - 23,
  };
};

/** The road: a strip across the floor in perspective, its far edge at 68 and its near edge at 86, a dashed line down its middle. */
export const road = (cx: number, far: number, near: number): string =>
  solid("path", `d="M${n(cx - far / 2)} 68L${n(cx + far / 2)} 68L${n(cx + near / 2)} 86L${n(cx - near / 2)} 86Z"`, BODY) +
  line(`M${n(cx)} 71V83`, SEP, ` stroke-dasharray="3 4"`);

export const floor = (x0 = 10, x1 = 86): string => line(`M${n(x0)} ${n(FLOOR)}H${n(x1)}`, SEP);

export type Standing = "box" | "table" | "shelf";
const SIZES: Record<Standing, { big: [number, number]; small: [number, number] }> = {
  box: { big: [32, 26], small: [22, 18] },
  table: { big: [48, 30], small: [30, 22] },
  shelf: { big: [46, 30], small: [30, 22] },
};

/** A ground that stands or hangs: `base` is the line it rests on, and `h` overrides its height. */
export const stand = (ground: Standing, cx: number, base: number, size: "big" | "small" = "big", height?: number): Drawn => {
  const [w, h] = SIZES[ground][size];
  const high = height ?? h;
  return ground === "box" ? box(cx, base, w, high, false) : ground === "table" ? table(cx, base, w, high) : shelf(cx, base, w, high);
};
