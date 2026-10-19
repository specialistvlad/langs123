// The glass toolbar of the pages in the frame, the Home's and a track index's: the search field with its clear
// button (client-home.ts), the Read in menu, and Close while searching.
import type { Choice } from "./chrome.ts";
import { CLEAR, CLOSE, LANGUAGES, SEARCH } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";
import type { Ui } from "./ui.ts";

export const searchForm = (t: Ui): string =>
  `<form class="hm-search glass" id="hm-form" role="search" action="#">${SEARCH}<input type="search" id="hm-q" placeholder="${escapeHtml(t.search)}" aria-label="${escapeHtml(t.search)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" class="hm-clear" id="hm-clear" aria-label="${escapeHtml(t.clear)}" hidden>${CLEAR}</button></form>`;

// Read in: the page in each language it is read in, the current one named on the button.
export function readMenu(t: Ui, choices: Choice[]): string {
  const current = escapeHtml(choices.find((c) => c.on)?.label ?? "");
  const links = choices.map((c) => `<a href="${c.href}"${c.on ? ' aria-current="page"' : ""}>${escapeHtml(c.label)}</a>`).join("");
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
