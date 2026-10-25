// The glass toolbar of the pages in the frame, the Home's and a track index's: the search field with its clear
// button (client-home.ts), the Read in menu, the theme menu, More on a phone's Home, and Close while searching.
import type { Choice } from "./context.ts";
import { CLEAR, CLOSE, INFO, LANGUAGES, MENU_BACK, MOON, MORE, SEARCH, SUN, THEME } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";
import { item, TICK } from "./track-parts.ts";
import type { Ui } from "./ui.ts";

export const searchForm = (t: Ui): string =>
  `<form class="hm-search glass" id="hm-form" role="search" action="#">${SEARCH}<input type="search" id="hm-q" placeholder="${escapeHtml(t.search)}" aria-label="${escapeHtml(t.search)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" class="hm-clear" id="hm-clear" aria-label="${escapeHtml(t.clear)}" hidden>${CLEAR}</button></form>`;

// Read in: the page in each language it is read in, the current one named on the button. A choice is kept
// (client-read.ts), so the first Home stays in it.
export function readMenu(t: Ui, choices: Choice[]): string {
  const current = escapeHtml(choices.find((c) => c.on)?.label ?? "");
  const links = choices
    .map(
      (c) =>
        `<a href="${c.href}" hreflang="${c.lang}" data-read="${c.lang}"${c.on ? ' aria-current="page"' : ""}>${escapeHtml(c.label)}</a>`,
    )
    .join("");
  return `<details class="hm-read"><summary aria-label="${escapeHtml(t.read)}: ${current}">${LANGUAGES}<span>${current}</span></summary><div class="hm-menu">${links}</div></details>`;
}

export const closeButton = (t: Ui): string =>
  `<button type="button" class="hm-close glass" id="hm-close" aria-label="${escapeHtml(t.close)}">${CLOSE}</button>`;

// Where the search's results go, in place of the page's content while the reader searches.
export const results = (t: Ui): string =>
  `<div class="hm-results" id="hm-results" data-empty="${escapeHtml(t.searchEmpty)}" hidden>
<h2 class="hm-heading">${escapeHtml(t.topics)}</h2>
<div class="hm-list" id="hm-list" aria-live="polite"></div>
</div>`;

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

// More, on a phone's Home in place of Read in, the theme and the credits (home-more.css): one button whose menu
// names the three, the language read in and the theme under theirs; Read in and the theme open their lists in its
// place, under a way back to More (client-more.ts).
export function moreMenu(t: Ui, choices: Choice[], credits: { href: string; label: string }): string {
  const more = escapeHtml(t.more);
  const text = (title: string, sub: string): string =>
    `<span class="ix-tick" aria-hidden="true"></span><span class="ix-text"><span class="ix-title">${escapeHtml(title)}</span>${sub}</span>`;
  const sub = (s: string, attrs = ""): string => `<span class="ix-sub"${attrs}>${escapeHtml(s)}</span>`;
  const open = (panel: string, title: string, under: string, end: string): string =>
    `<button type="button" role="menuitem" class="ix-item" data-more="${panel}" aria-haspopup="menu">${text(title, under)}<span class="ix-end">${end}</span></button>`;
  const back = `<button type="button" class="ix-item hm-back" data-more="main"><span class="ix-tick" aria-hidden="true">${MENU_BACK}</span><span class="ix-text"><span class="ix-title">${more}</span></span></button>`;
  const languages = choices
    .map(
      (c) =>
        `<a href="${c.href}" hreflang="${c.lang}" data-read="${c.lang}" role="menuitemradio" class="ix-item" aria-checked="${String(c.on)}"><span class="ix-tick" aria-hidden="true">${TICK}</span><span class="ix-text"><span class="ix-title">${escapeHtml(c.label)}</span></span></a>`,
    )
    .join("");
  const main = [
    open("read", t.read, sub(choices.find((c) => c.on)?.label ?? ""), LANGUAGES),
    open("theme", t.theme, sub(t.themeAuto, " data-theme-now"), THEME),
    `<a href="${credits.href}" role="menuitem" class="ix-item">${text(credits.label, "")}<span class="ix-end">${INFO}</span></a>`,
  ].join("");
  return `<button type="button" class="hm-more glass" popovertarget="hm-more" aria-haspopup="menu" aria-expanded="false" aria-label="${more}" title="${more}">${MORE}</button>
<div class="ix-menu hm-more-menu" id="hm-more" popover role="menu" aria-label="${more}"><div data-panel="main">${main}</div><div data-panel="read" hidden>${back}${languages}</div><div data-panel="theme" hidden>${back}${themeItems(t)}</div></div>`;
}
