// The glyphs of the pages in the frame (frame.css): the Home, a track's index and a topic, drawn as the iOS
// app draws them.
export const glyph = (body: string, size: number, width: number, extra = ""): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${body}</svg>`;

export const SEARCH = glyph('<circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.4" y2="16.4"/>', 17, 2.2);
// The languages symbol of the Read in button.
export const LANGUAGES = glyph(
  '<path d="M4 5h9"/><path d="M8.5 3v2"/><path d="M11 5c-1 4-3.5 7-7 9"/><path d="M6 9c1 2.5 3 4.5 5.5 5.5"/><path d="M13 21l4.5-10 4.5 10"/><path d="M14.5 17.5h6"/>',
  20,
  2,
);
export const INFO = glyph(
  '<circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.5" x2="12" y2="11"/><line x1="12" y1="7.5" x2="12.01" y2="7.5"/>',
  20,
  2,
);
export const CLOSE = glyph('<path d="M6 6l12 12M18 6L6 18"/>', 18, 2.4);
export const CLEAR =
  '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#8e8e93"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>';

// The theme: half of a circle filled (Auto), a sun (Light), a moon (Dark).
export const THEME = glyph('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>', 20, 2);
export const SUN = glyph(
  '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  20,
  2,
);
export const MOON = glyph('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>', 20, 2);
// More: three dots, filled; and the way back from one of its lists.
export const MORE =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';
export const MENU_BACK = glyph('<path d="M15 5l-7 7 7 7"/>', 18, 2.4);
// The house of the up link to Home.
export const HOME = glyph('<path d="M3.5 10.5L12 3.5l8.5 7"/><path d="M5.5 9v10.5h13V9"/><path d="M10 19.5v-5h4v5"/>', 20, 2);
