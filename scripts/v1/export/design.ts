// The chosen design's tokens as an app draws with them (9.10), read from the design's tokens file (apps/web/tokens.ts)
// so the export's --design carries through: every colour token with its light and dark value, and every type style
// with its group, its family's role, its size, line height, tracking and weight. Each value comes in the one shape a
// native client decodes: a colour as #rrggbb, or #rrggbbaa where it is translucent; a style's size in its unit (px, pt,
// or em of the text around it), its line height and tracking in that unit, its line height left out where the font's
// own stands.
import { DEFAULT_DESIGN, designTokens } from "../../../apps/web/tokens.ts";
import type { Design, TypeStyle } from "../../generated/export-v1.ts";

interface Style {
  name: string;
  fontSize: string;
  lineHeight?: string | number;
  fontWeight?: string | number;
  letterSpacing?: string;
}
interface Group {
  name: string;
  family: string;
  styles: Style[];
}

const hex = (n: number): string => Math.round(n).toString(16).padStart(2, "0");
const rounded = (n: number): number => Math.round(n * 1000) / 1000;

// A colour as #rrggbb or #rrggbbaa, from the hex or rgb() forms the tokens write.
export function colourOf(value: string): string {
  const v = value.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short !== null) {
    return `#${short
      .slice(1)
      .map((c) => c + c)
      .join("")}`;
  }
  if (/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/.test(v)) return v;
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(v);
  if (rgb === null) throw new Error(`a colour the export can't read: ${value}`);
  const [r = "0", g = "0", b = "0", a] = rgb.slice(1);
  return `#${hex(Number(r))}${hex(Number(g))}${hex(Number(b))}${a === undefined ? "" : hex(Number(a) * 255)}`;
}

// A length as its number and unit; a bare number is a ratio of the size.
function lengthOf(value: string | number, size: number): number {
  if (typeof value === "number") return rounded(value * size);
  const m = /^(-?[\d.]+)(px|pt|em)?$/.exec(value.trim());
  if (m === null) throw new Error(`a length the export can't read: ${value}`);
  const n = Number(m[1]);
  return rounded(m[2] === "em" ? n * size : n);
}

function styleOf(group: Group, s: Style): TypeStyle {
  const m = /^([\d.]+)(px|pt|em)$/.exec(s.fontSize);
  if (m === null) throw new Error(`${s.name}: a size the export can't read: ${s.fontSize}`);
  const size = Number(m[1]);
  return {
    name: s.name,
    group: group.name,
    family: group.family as TypeStyle["family"],
    size,
    unit: m[2] as TypeStyle["unit"],
    ...(s.lineHeight !== undefined && s.lineHeight !== "normal" && { lineHeight: lengthOf(s.lineHeight, size) }),
    tracking: s.letterSpacing === undefined ? 0 : lengthOf(s.letterSpacing, size),
    weight: Number(s.fontWeight ?? 400),
  };
}

export function designOf(name: string = DEFAULT_DESIGN): Design {
  const tokens = designTokens(name);
  return {
    name,
    colours: tokens.color.tokens.map((t) => ({
      name: t.name,
      light: colourOf(typeof t.value === "string" ? t.value : (t.value["light"] ?? "")),
      dark: colourOf(typeof t.value === "string" ? t.value : (t.value["dark"] ?? "")),
    })),
    type: (tokens.type.groups as unknown as Group[]).flatMap((g) => g.styles.map((s) => styleOf(g, s))),
  };
}
