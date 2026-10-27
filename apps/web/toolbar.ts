// The glass toolbar of the pages in the frame, the Home's and a track index's: the search field with its clear
// button (client-home.ts), Close while searching, and More, the one menu that ends every toolbar.
import { CLEAR, CLOSE, glyph, INFO, LANGUAGES, MENU_BACK, MENU_GLYPHS, MOON, MORE, SEARCH, SUN, THEME } from "./glyphs.ts";
import { type Explain, say } from "../../scripts/lib.ts";
import { type Brand, LIBRARY_BRAND } from "./brand.ts";
import { escapeHtml } from "./html.ts";
import { item } from "./track-parts.ts";
import type { Ui } from "./ui.ts";
import { creditsUrl, pageUrl } from "./urls.ts";

export const searchForm = (t: Ui): string =>
  `<form class="hm-search glass" id="hm-form" role="search" action="#">${SEARCH}<input type="search" id="hm-q" placeholder="${escapeHtml(t.search)}" aria-label="${escapeHtml(t.search)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" class="hm-clear" id="hm-clear" aria-label="${escapeHtml(t.clear)}" hidden>${CLEAR}</button></form>`;

// A phone's round Search button, on a course index in the bar's place for the field until it is tapped
// (client-home.ts opens the field; track-bar.css shows it on phones only).
export const searchButton = (t: Ui): string =>
  `<button type="button" class="ix-search-open glass" id="ix-search" aria-label="${escapeHtml(t.search)}" title="${escapeHtml(t.search)}">${SEARCH}</button>`;

export const closeButton = (t: Ui): string =>
  `<button type="button" class="hm-close glass" id="hm-close" aria-label="${escapeHtml(t.close)}">${CLOSE}</button>`;

// Where the search's results go, in place of the page's content while the reader searches: the filters the page
// gives (the Home's, search-filters.ts), "Topics · N", the results, and the view for no results, which names the
// query and offers a few topics to try.
export const results = (t: Ui, filters = ""): string =>
  `<div class="hm-results" id="hm-results" data-explained="${escapeHtml(t.searchExplainedIn)}" hidden>
${filters}
<h2 class="hm-heading" data-count="${escapeHtml(t.searchTopicsCount)}">${escapeHtml(t.topics)}</h2>
<div class="hm-list" id="hm-list" aria-live="polite"></div>
<div class="hm-none" id="hm-none" role="status" hidden>${NONE}<p class="hm-none-t" data-query="${escapeHtml(t.searchNoResults)}"></p><p class="hm-none-s">${escapeHtml(t.searchNoResultsHint)}</p></div>
<div class="hm-sugg" id="hm-sugg" hidden><h2 class="hm-heading">${escapeHtml(t.searchTryThese)}</h2><div class="hm-list" id="hm-sugg-list"></div></div>
</div>`;
const NONE = glyph('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/>', 44, 1.8, ' class="hm-none-i"');

// The theme: Auto (the system's), Light or Dark, listed in More in place of its main list (client-theme.ts keeps the
// choice).
const themeItems = (t: Ui): string =>
  [
    item('data-set-theme="auto"', t.themeAuto, true, t.themeSystem, `<span class="ix-end">${THEME}</span>`),
    item('data-set-theme="light"', t.themeLight, false, "", `<span class="ix-end">${SUN}</span>`),
    item('data-set-theme="dark"', t.themeDark, false, "", `<span class="ix-end">${MOON}</span>`),
  ].join("");
// More: a button ending the toolbar of every page, top right (bottom left on a phone, beside Search), whose menu
// (client-more.ts) opens under it, upward on a phone: Languages I know first with the reader's languages under it
// (client-languages.ts fills data-langs-list), then Theme, whose list opens in its place under a way back to More,
// the theme in use under its name, then Credits and the brand's pages after it.
export function moreButton(t: Ui): string {
  const more = escapeHtml(t.more);
  return `<button type="button" class="hm-more" popovertarget="hm-more" aria-haspopup="menu" aria-expanded="false" aria-label="${more}" title="${more}">${MORE}</button>`;
}
// A page the More menu links to beside the credits: its address, its title and the icon it draws.
export interface MenuLink {
  href: string;
  label: string;
  glyph: string;
}
// The brand's pages that carry a menu entry, to follow the credits wherever the credits are offered.
export const menuLinks = (home: Explain, brand: Brand): MenuLink[] =>
  (brand.pages ?? []).flatMap((p) =>
    p.menu === undefined ? [] : [{ href: pageUrl(home, p.slug), label: p.title(home), glyph: MENU_GLYPHS[p.menu.glyph] }],
  );
export function moreMenu(t: Ui, home: Explain, brand: Brand = LIBRARY_BRAND): string {
  const more = escapeHtml(t.more);
  const text = (title: string, sub: string): string =>
    `<span class="ix-tick" aria-hidden="true"></span><span class="ix-text"><span class="ix-title">${escapeHtml(title)}</span>${sub}</span>`;
  const link = (href: string, title: string, sub: string, end: string): string =>
    `<a href="${escapeHtml(href)}" role="menuitem" class="ix-item">${text(title, sub)}<span class="ix-end">${end}</span></a>`;
  const back = `<button type="button" class="ix-item hm-back" data-more="main"><span class="ix-tick" aria-hidden="true">${MENU_BACK}</span><span class="ix-text"><span class="ix-title">${more}</span></span></button>`;
  const main = [
    link(pageUrl(home, "languages"), t.languagesIKnow, `<span class="ix-sub"><span data-langs-list></span></span>`, LANGUAGES),
    `<button type="button" role="menuitem" class="ix-item" data-more="theme" aria-haspopup="menu">${text(t.theme, `<span class="ix-sub" data-theme-now>${escapeHtml(t.themeAuto)}</span>`)}<span class="ix-end">${THEME}</span></button>`,
    link(creditsUrl(home), say("credits", home), "", INFO),
    ...menuLinks(home, brand).map((p) => link(p.href, p.label, "", p.glyph)),
  ].join("");
  return `<div class="ix-menu hm-more-menu" id="hm-more" popover role="menu" aria-label="${more}"><div data-panel="main">${main}</div><div data-panel="theme" hidden>${back}${themeItems(t)}</div></div>`;
}
