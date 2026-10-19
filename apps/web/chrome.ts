// The page chrome: the language menu, the view tabs, the level and variety chips, the breadcrumb, the
// panels the chips open and the bottom bar on phones.
import { type Explain, filled, LEVELS, SITE, say, type Variety } from "../../scripts/lib.ts";
import { varietyName } from "../../scripts/text.ts";
import { GITHUB_ICON, INFO_ICON, PRINT_ICON, SEARCH_ICON } from "./icons.ts";
import { escapeHtml } from "./html.ts";
import type { PageOptions } from "./layout.ts";
import { type Ui, ui } from "./ui.ts";
import { creditsUrl, homeUrl } from "./urls.ts";
import { upLink } from "./up-link.ts";

export interface Choice {
  label: string;
  href: string;
  on: boolean;
}

// The language a page is read in: the current one, opening into a list of every one (client-seg.ts closes
// it on a tap elsewhere or Escape).
export function languageMenu(label: string, choices: Choice[]): string {
  const current = choices.find((c) => c.on) ?? choices[0];
  return `<details class="seg lang-menu has-chevron"><summary><span class="lang-icon" aria-hidden="true">文</span><span class="sr-only">${escapeHtml(label)}: </span>${escapeHtml(current?.label ?? "")}</summary><div class="menu-list">${languageLinks(choices)}</div></details>`;
}
const languageLinks = (choices: Choice[]): string =>
  choices.map((c) => `<a href="${c.href}"${c.on ? ' class="on" aria-current="page"' : ""}>${escapeHtml(c.label)}</a>`).join("");

// The view of a topic as tabs: the cheatsheet alone, or the full lesson.
export function viewTabs(explain: Explain): string {
  const t = ui(explain);
  return `<div class="tabs" role="group" aria-label="${escapeHtml(t.view)}"><button type="button" data-set-view="cheatsheet">${escapeHtml(t.sheet)}</button><button type="button" data-set-view="extended">${escapeHtml(t.fullLesson)}</button></div>`;
}

export interface ChipsOptions {
  explain: Explain;
  // The varieties of the language being learned the reader chooses between, the default first.
  varieties?: Variety[] | undefined;
}

// Print, on a page worth printing: at the end of the lesson and in More on phones.
export const printButton = (t: Ui, cls: string): string =>
  `<button class="${cls}" type="button" data-print>${PRINT_ICON}<span>${escapeHtml(t.print)}</span></button>`;

// The end of a lesson: edit its file on GitHub, and print it.
export const pageTools = (t: Ui, edit: string | undefined): string =>
  `<div class="page-tools">${
    edit === undefined
      ? ""
      : `<a class="page-tool edit" href="${edit}" rel="noopener">${GITHUB_ICON}<span>${escapeHtml(t.editPage)}</span></a>`
  }${printButton(t, "page-tool")}</div>`;

// The variety a page shows, as a chip that opens its panel (page()): the chip names the choice.
export function chips(o: ChipsOptions): string {
  const t = ui(o.explain);
  const parts: string[] = [];
  if (o.varieties !== undefined) {
    const first = o.varieties[0];
    parts.push(
      `<button type="button" class="chip" popovertarget="variety-panel"><span class="sr-only">${escapeHtml(t.variety)}: </span><span data-variety-label>${escapeHtml(first === undefined ? "" : varietyName(first, o.explain))}</span><span class="caret" aria-hidden="true">▾</span></button>`,
    );
  }
  return parts.length === 0 ? "" : `<div class="chips">${parts.join("")}</div>`;
}

// The search of the topics, after the breadcrumb: a field on wide screens, a button on phones that opens
// it over the whole screen. Both stay hidden until client-search.ts runs; typing lists the matching
// topics and sections under the field (combobox and listbox). data-search names the search data to fetch.
export function searchBox(o: PageOptions, t: Ui): string {
  if (o.search === undefined || o.search.length === 0) return "";
  const data = [
    ` data-search="${o.search.join(" ")}"`,
    ` data-levels="${LEVELS.join(" ")}"`,
    ` data-topics="${escapeHtml(t.topics)}"`,
    ` data-in-topics="${escapeHtml(t.searchInTopics)}"`,
    ` data-empty="${escapeHtml(t.searchEmpty)}"`,
  ].join("");
  const field = `<label class="search-field">${SEARCH_ICON}<span class="sr-only">${escapeHtml(t.search)}</span><input type="search" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list" placeholder="${escapeHtml(t.search)}" autocomplete="off" spellcheck="false"><kbd aria-hidden="true">/</kbd></label>`;
  const results = `<div class="search-results" id="search-results" role="listbox" aria-label="${escapeHtml(t.search)}" hidden></div>`;
  return `<div class="top-search" hidden${data}>${field}${results}</div><button type="button" class="tool search-open" hidden title="${escapeHtml(t.search)}" aria-label="${escapeHtml(t.search)}">${SEARCH_ICON}</button>`;
}

// One step of the breadcrumb; the last is the page itself. A crumb with a menu opens into it.
export interface Crumb {
  label: string;
  href?: string;
  icon?: string;
  menu?: LearnChoice[];
}

// A language to learn in the track crumb's menu: its track in the reader's language, or, where the
// language is not explained in it, in the first language it is explained in, which the note names.
export interface LearnChoice {
  flag: string;
  label: string;
  href: string;
  on: boolean;
  note?: string;
}
const learnLinks = (choices: LearnChoice[]): string =>
  choices
    .map(
      (c) =>
        `<a href="${c.href}"${c.on ? ' class="on" aria-current="page"' : ""}><span aria-hidden="true">${c.flag}</span><span>${escapeHtml(c.label)}</span>${c.note === undefined ? "" : `<small>· ${escapeHtml(c.note)}</small>`}</a>`,
    )
    .join("");

// The link to the credits page, marked current on that page; in More it carries its name.
export function credits(o: PageOptions, named: boolean): string {
  const label = escapeHtml(say("credits", o.lang));
  const current = o.kind === "credits" ? ' aria-current="page"' : "";
  const name = named ? `<span>${label}</span>` : "";
  return `<a class="tool" href="${creditsUrl(o.lang)}" title="${label}" aria-label="${label}"${current}>${INFO_ICON}${name}</a>`;
}
export const themeButton = (t: Ui, named: boolean): string =>
  `<button class="tool" type="button" data-theme-toggle title="${escapeHtml(t.theme)}" aria-label="${escapeHtml(t.theme)}"><span aria-hidden="true">◐</span>${named ? `<span>${escapeHtml(t.theme)}</span>` : ""}</button>`;

// The site, then the page's crumbs; the last one is the page.
export function breadcrumb(o: PageOptions, t: Ui): string {
  const crumbs: Crumb[] = [{ label: SITE.name, href: homeUrl(o.lang) }, ...(o.crumbs ?? [])];
  // The site's crumb stays a link on its own home page, where it is also the page.
  const items = crumbs.map((c, i) => {
    const last = i === crumbs.length - 1;
    const icon = filled(c.icon) ? `<span class="crumb-icon" aria-hidden="true">${c.icon}</span>` : "";
    const label = `${icon}<span class="crumb-text">${escapeHtml(c.label)}</span>`;
    const cls = i === 0 ? "crumb brand" : "crumb";
    const current = last ? ' aria-current="page"' : "";
    if (c.menu !== undefined) {
      return `<li><details class="crumb-menu has-chevron"><summary class="${cls}"${current}>${label}</summary><div class="menu-list learn-list">${learnLinks(c.menu)}</div></details></li>`;
    }
    return c.href !== undefined && (!last || i === 0)
      ? `<li><a class="${cls}" href="${c.href}"${current}>${label}</a></li>`
      : `<li><span class="${cls}"${current}>${label}</span></li>`;
  });
  const up = upLink(o.kind, o.crumbs ?? [], homeUrl(o.lang));
  return `<nav class="crumbs" aria-label="${escapeHtml(t.breadcrumb)}">${up}<ol>${items.join("")}</ol></nav>`;
}

// The panels the chips and the bottom bar open (popovers): under their chip on wide screens, a sheet
// on phones (client-panel.ts, panels.css).
// The level panel: a button per level, the chosen one marked, and what the filter does.
export function levelPanel(t: Ui): string {
  const buttons = LEVELS.map((l) => `<button type="button" class="lvl-${l}" data-set-level="${l}">${l}</button>`).join("");
  return `<div class="panel" id="level-panel" popover><p class="panel-title">${escapeHtml(t.level)}</p><div class="seg">${buttons}</div><p class="panel-note">${escapeHtml(t.levelHidden)}</p></div>`;
}

export function panels(o: PageOptions, t: Ui, more: boolean): string {
  const out: string[] = [];
  if (o.level === true) out.push(levelPanel(t));
  if (o.varieties !== undefined) {
    const buttons = o.varieties
      .map((v) => `<button type="button" data-set-variety="${v}">${escapeHtml(varietyName(v, o.lang))}</button>`)
      .join("");
    out.push(
      `<div class="panel" id="variety-panel" popover><p class="panel-title">${escapeHtml(t.variety)}</p><div class="seg">${buttons}</div></div>`,
    );
  }
  if (more) {
    const read =
      (o.read ?? []).length > 1
        ? `<p class="panel-title">${escapeHtml(t.read)}</p><div class="menu-list">${languageLinks(o.read ?? [])}</div>`
        : "";
    out.push(
      `<div class="panel" id="more-panel" popover>${read}<div class="panel-tools">${o.kind === "topic" || o.kind === "sheet" ? printButton(t, "tool") : ""}${credits(o, true)}${themeButton(t, true)}</div></div>`,
    );
  }
  return out.join("\n  ");
}

// The bottom bar on phones: the menu where the page has one, the level and variety panels, More and the next page.
export function bottomBar(o: PageOptions, t: Ui, menu: boolean): string {
  const item = (icon: string, label: string, attrs: string): string =>
    `<button type="button" class="bar-item" ${attrs}><span class="bar-icon" aria-hidden="true">${icon}</span><span>${escapeHtml(label)}</span></button>`;
  const parts = menu
    ? [
        `<button class="bar-item menu" id="menu" type="button"><span class="bar-icon" aria-hidden="true">☰</span><span>${escapeHtml(t.index)}</span></button>`,
      ]
    : [];
  if (o.level === true) parts.push(item('<span class="level-dot"></span>', t.level, 'popovertarget="level-panel"'));
  if (o.varieties !== undefined) parts.push(item("🌎", t.variety, 'popovertarget="variety-panel"'));
  parts.push(item("⋯", t.more, 'popovertarget="more-panel"'));
  if (filled(o.next)) parts.push(o.next);
  return `<nav class="bottom-bar" aria-label="${escapeHtml(t.more)}">${parts.join("")}</nav>`;
}
