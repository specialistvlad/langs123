// What a product built on the library brings to its pages: its mark beside the site's name on the Home and the
// credits, the credits' own lines, and pages of its own. A build's brand option gives a product's; the library's own is a
// rounded tile in the accent colour with 123 on it, and credits with the library's lines alone.
import type { Explain } from "../../scripts/lib.ts";

// A row of the credits' links: a glyph in the accent on a grey tile, a title, a value and the address it opens.
export interface CreditsRow {
  glyph: "globe" | "mail" | "people" | "doc" | "code" | "branch" | "flag" | "book";
  title: string;
  value?: string;
  href: string;
}

// A page of the product's own, at /{slug}/ in every explanation language as the credits are: the build draws the
// Home button and the title in the credits' column around the body.
export interface BrandPage {
  // An entry after Credits wherever the Home offers Credits (the toolbar's icon, the phone's More menu), labelled
  // with the page's title; glyph names the icon it draws.
  menu?: { glyph: "hand" };
  // The address segment, lowercase letters, digits and hyphens.
  slug: string;
  title: (explain: Explain) => string;
  // The page's description for search results and link previews; the title when absent.
  description?: (explain: Explain) => string;
  // The body as HTML, laid out with the credits' classes: a bold cr-lead line, cr-h2 headings over cr-card blocks of cr-para
  // paragraphs, and a closing cr-updated line.
  body: (explain: Explain) => string;
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
  pages?: BrandPage[];
}

export const LIBRARY_BRAND: Brand = {
  mark: (size, label) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 28 28"${label === undefined ? ' aria-hidden="true"' : ` role="img" aria-label="${label}"`}><rect width="28" height="28" rx="7" style="fill: var(--accent)"/><text x="14" y="18" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10.5" font-weight="800" style="fill: var(--bg)">123</text></svg>`,
};
