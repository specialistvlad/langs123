// What a product built on the library brings to its pages: its mark beside the site's name on the Home and the
// credits, and the credits' own lines. A build's brand option gives a product's; the library's own is a
// rounded tile in the accent colour with 123 on it, and credits with the library's lines alone.
import type { Explain } from "../../scripts/lib.ts";

// A row of the credits' links: a glyph in the accent on a grey tile, a title, a value and the address it opens.
export interface CreditsRow {
  glyph: "globe" | "mail" | "people" | "doc" | "code" | "branch" | "flag" | "book";
  title: string;
  value?: string;
  href: string;
}

export interface Brand {
  // The mark as an SVG, size pixels square; with a label it is an image of that name.
  mark: (size: number, label?: string) => string;
  // The credits' own lines in an explanation language: the line under the name, the version line, the rows
  // after the website's, and the closing line as HTML. The pages call them while the build writes them.
  credits?: {
    tagline?: (explain: Explain) => string;
    version?: (explain: Explain) => string;
    rows?: (explain: Explain) => CreditsRow[];
    footer?: (explain: Explain) => string;
  };
}

export const LIBRARY_BRAND: Brand = {
  mark: (size, label) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 28 28"${label === undefined ? ' aria-hidden="true"' : ` role="img" aria-label="${label}"`}><rect width="28" height="28" rx="7" style="fill: var(--accent)"/><text x="14" y="18" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="800" style="fill: var(--bg)">123</text></svg>`,
};
