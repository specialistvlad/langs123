// The rows of the credits page (pages/credits.ts): a glyph in the accent on a grey tile, as iOS Settings draws them,
// a title with what it is, a value, and an arrow out; and the credit line's copy button.
import type { CreditsRow } from "./brand.ts";
import { glyph } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";

const EXTERNAL = glyph('<path d="M7 17L17 7"/><path d="M8.5 7H17v8.5"/>', 15, 2.2);
export const COPY = glyph(
  '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5v-2a2.5 2.5 0 0 0-2.5-2.5H6.5A2.5 2.5 0 0 0 4 6.5V13a2.5 2.5 0 0 0 2.5 2.5h2"/>',
  18,
  1.9,
  ' class="cr-copy-on"',
);
export const CHECK = glyph('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 18, 2.4, ' class="cr-copy-done"');
export const GLYPHS: Record<CreditsRow["glyph"], string> = {
  globe: glyph(
    '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c3 3 3 16.5 0 19M12 2.5c-3 3-3 16.5 0 19"/>',
    18,
    1.9,
  ),
  mail: glyph('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>', 18, 1.9),
  people: glyph(
    '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.5-3.6 3-5.5 6.5-5.5s6 1.9 6.5 5.5"/><path d="M16 5.3a3.3 3.3 0 0 1 0 6.4M18.5 14.8c1.8.7 2.8 2.3 3 5.2"/>',
    18,
    1.9,
  ),
  doc: glyph('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', 18, 1.9),
  code: glyph('<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>', 18, 2.1),
  branch: glyph(
    '<circle cx="6.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M6.5 8v8M17.5 11.5c0 3.5-4 4-11 5"/>',
    18,
    1.9,
  ),
  flag: glyph('<path d="M5 21V4"/><path d="M5 4.5c4-2 7 2 14 0v9c-7 2-10-2-14 0"/>', 18, 1.9),
  book: glyph(
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    18,
    1.9,
  ),
};

// A row; sub is what the title names, rel the link's relation (license).
export const row = (r: CreditsRow & { sub?: string; rel?: string }): string =>
  `<a class="cr-row" href="${escapeHtml(r.href)}"${r.rel === undefined ? "" : ` rel="${r.rel}"`}><span class="cr-tile">${GLYPHS[r.glyph]}</span><span class="cr-text"><span class="cr-title-line">${escapeHtml(r.title)}</span>${r.sub === undefined ? "" : `<span class="cr-sub">${escapeHtml(r.sub)}</span>`}</span>${r.value === undefined ? "" : `<span class="cr-value">${escapeHtml(r.value)}</span>`}<span class="cr-trail">${EXTERNAL}</span></a>`;
