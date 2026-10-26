// The glass toolbar of the pages in the frame, the Home's and a track index's: the search field with its clear
// button (client-home.ts), the Read in menu, the theme menu, More on a phone's Home, and Close while searching.
import type { Choice } from "./context.ts";
import { CLEAR, CLOSE, glyph, INFO, LANGUAGES, MENU_BACK, MOON, MORE, SEARCH, SUN, THEME } from "./glyphs.ts";
import { say } from "../../scripts/lib.ts";
import { escapeHtml } from "./html.ts";
import { readItems } from "./read-menu.ts";
import { item } from "./track-parts.ts";
import type { Ui } from "./ui.ts";

export const searchForm = (t: Ui): string =>
  `<form class="hm-search glass" id="hm-form" role="search" action="#">${SEARCH}<input type="search" id="hm-q" placeholder="${escapeHtml(t.search)}" aria-label="${escapeHtml(t.search)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" class="hm-clear" id="hm-clear" aria-label="${escapeHtml(t.clear)}" hidden>${CLEAR}</button></form>`;

// A phone's round Search button, on a course index in the bar's place for the field until it is tapped
// (client-home.ts opens the field; track-bar.css shows it on phones only).
export const searchButton = (t: Ui): string =>
  `<button type="button" class="ix-search-open glass" id="ix-search" aria-label="${escapeHtml(t.search)}" title="${escapeHtml(t.search)}">${SEARCH}</button>`;

// Read in: the page in each language it is read in, the current one named on the button and ticked in the menu
// (read-menu.ts). A choice is kept (client-read.ts), so the first Home stays in it.
export function readMenu(t: Ui, choices: Choice[]): string {
  const here = choices.find((c) => c.on);
  const current = escapeHtml(here?.label ?? "");
  const named = here === undefined ? t.read : say("labelled", here.lang, { label: t.read, value: here.label });
  return `<details class="hm-read"><summary aria-label="${escapeHtml(named)}" aria-haspopup="menu">${LANGUAGES}<span>${current}</span></summary><div class="hm-menu hm-ticks" role="menu" aria-label="${escapeHtml(t.read)}">${readItems(t, choices)}</div></details>`;
}

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

// The theme: a button that opens its menu, Auto (the system's), Light or Dark (client-theme.ts keeps the choice).
export const themeButton = (t: Ui): string =>
  `<button type="button" class="ix-btn hm-theme" popovertarget="hm-themes" aria-haspopup="menu" aria-label="${escapeHtml(t.theme)}" title="${escapeHtml(t.theme)}">${THEME}</button>`;
const themeItems = (t: Ui): string =>
  [
    item('data-set-theme="auto"', t.themeAuto, true, t.themeSystem, `<span class="ix-end">${THEME}</span>`),
    item('data-set-theme="light"', t.themeLight, false, "", `<span class="ix-end">${SUN}</span>`),
    item('data-set-theme="dark"', t.themeDark, false, "", `<span class="ix-end">${MOON}</span>`),
  ].join("");
export const themeMenu = (t: Ui): string =>
  `<div class="ix-menu ix-menu-theme" id="hm-themes" popover role="menu" aria-label="${escapeHtml(t.theme)}">${themeItems(t)}</div>`;

// More, on a phone's Home in place of the theme and the credits, beside Read in (home-more.css): a button whose menu
// names the two, the theme in use under its name; the theme opens its list in its place, under a way back to More
// (client-more.ts).
export function moreButton(t: Ui): string {
  const more = escapeHtml(t.more);
  return `<button type="button" class="hm-more" popovertarget="hm-more" aria-haspopup="menu" aria-expanded="false" aria-label="${more}" title="${more}">${MORE}</button>`;
}
export function moreMenu(t: Ui, credits: { href: string; label: string }): string {
  const more = escapeHtml(t.more);
  const text = (title: string, sub: string): string =>
    `<span class="ix-tick" aria-hidden="true"></span><span class="ix-text"><span class="ix-title">${escapeHtml(title)}</span>${sub}</span>`;
  const sub = (s: string, attrs = ""): string => `<span class="ix-sub"${attrs}>${escapeHtml(s)}</span>`;
  const open = (panel: string, title: string, under: string, end: string): string =>
    `<button type="button" role="menuitem" class="ix-item" data-more="${panel}" aria-haspopup="menu">${text(title, under)}<span class="ix-end">${end}</span></button>`;
  const back = `<button type="button" class="ix-item hm-back" data-more="main"><span class="ix-tick" aria-hidden="true">${MENU_BACK}</span><span class="ix-text"><span class="ix-title">${more}</span></span></button>`;
  const main = [
    open("theme", t.theme, sub(t.themeAuto, " data-theme-now"), THEME),
    `<a href="${credits.href}" role="menuitem" class="ix-item">${text(credits.label, "")}<span class="ix-end">${INFO}</span></a>`,
  ].join("");
  return `<div class="ix-menu hm-more-menu" id="hm-more" popover role="menu" aria-label="${more}"><div data-panel="main">${main}</div><div data-panel="theme" hidden>${back}${themeItems(t)}</div></div>`;
}
