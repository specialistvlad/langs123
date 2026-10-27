// The topics column of a course and its toolbars (board v261), which the course index (pages/track.ts) and a topic page
// (pages/topic.ts) share, so both pages render the same list. From 1024px a course is two columns: this one on the left,
// the page's reading on the right. The column holds the head (a toolbar line of Home and, as icon buttons, Level and
// Group; the course's title on its own line with its flag; "66 topics · Explained in: English ›"), the search field,
// and the topics in both groupings, the shown topic marked. The glass bar of Level, Variety, Group and More sits at the
// top right, Level and Group in it only while the field searches. A phone shows the column on the course index alone:
// the title row with the topic count at its end, the line, the topics, and the bottom bar of the same buttons with
// Search at its right end; a topic page keeps the bar and the results. The Explained in line is the Languages page's
// client's (explained-line.ts). The page adds the level popover and its data beside menus().
import { count, localize, say, SITE, type TopicRef } from "../../scripts/lib.ts";
import { refRange } from "../../scripts/levels.ts";
import { varietyName } from "../../scripts/text.ts";
import { LIBRARY_BRAND } from "./brand.ts";
import type { Track } from "./context.ts";
import { explainedLine } from "./explained-line.ts";
import { escapeHtml } from "./html.ts";
import { glyph } from "./glyphs.ts";
import { courseEntry, type LevelEntry } from "./level-popover.ts";
import { searchFilters } from "./search-filters.ts";
import { closeButton, moreButton, moreMenu, results, searchButton, searchForm } from "./toolbar.ts";
import { countsByLevel } from "./track-more.ts";
import { BACK, byCategory, byLevel, GLOBE, groupButton, groupMenu, levelButton, varietyMenu } from "./track-parts.ts";
import { homeUrl, trackUrl } from "./urls.ts";

// The house of the Home button.
const HOME = glyph('<path d="M3.5 10.5L12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-6h4v6"/>', 22, 2);

// A topic page's own: the topic the column marks, and its title.
export interface Shown {
  ref: TopicRef;
  title: string;
}

// The course's entry in the level popover, and what the Level button names of it: its key and the levels it holds.
export function courseLevel(track: Track): { entry: LevelEntry; course: { key: string; levels: string[] } } {
  const { lang, explain, langRefs } = track;
  const entry = courseEntry(localize(lang.name, explain), langRefs, explain);
  return { entry, course: { key: lang.code, levels: Object.keys(entry.l) } };
}

const varietiesOf = (track: Track): { code: string; name: string }[] =>
  (track.lang.varieties ?? []).map((v) => ({ code: v, name: varietyName(v, track.explain) }));

const level = (track: Track, cls: string, extra = ""): string =>
  levelButton(
    track.explain,
    { level: track.t.level, all: track.t.allLevels },
    "lv-pop",
    `ix-btn ix-level ${cls}`,
    "ix-label",
    courseLevel(track).course,
    extra,
  );

// The glass bar: Level, Variety, Group (the index's), More. Above 1024px it sits at the top right.
function glassBar(track: Track, shown: Shown | undefined): string {
  const { explain, t } = track;
  const [first] = varietiesOf(track);
  const variety =
    first === undefined
      ? ""
      : `<button type="button" class="ix-btn ix-variety" popovertarget="ix-varieties" aria-haspopup="menu">${GLOBE}<span class="ix-label"><span class="sr-only">${escapeHtml(say("labelled", explain, { label: t.variety, value: "" }))}</span><span data-variety-label>${escapeHtml(first.name)}</span></span></button>`;
  const group = shown === undefined ? groupButton(t.groupBy, "ix-btn ix-group cl-gr") : "";
  return `<div class="hm-group glass cl-bar">${level(track, "cl-lv")}${variety}${group}${moreButton(t)}</div>`;
}

// The head: Home (and Back to the course with the topic's title while a topic page searches), the toolbar line's
// group, the title and the line under it.
function head(track: Track, shown: Shown | undefined): string {
  const { lang, explain, t, title, written } = track;
  const name = escapeHtml(localize(lang.name, explain));
  const counts = `data-counts="${escapeHtml(
    countsByLevel(
      written.map((r) => refRange(r, explain)?.from ?? null),
      explain,
    ),
  )}"`;
  const total = escapeHtml(count("topics", explain, written.length));
  const home = `<a class="ix-up glass cl-home" href="${homeUrl(explain)}" aria-label="${escapeHtml(SITE.name)}">${HOME}</a>`;
  const back =
    shown === undefined
      ? ""
      : `<a class="ix-up glass cl-back" href="${trackUrl(explain, lang)}" aria-label="${name}">${BACK}</a><p class="cl-topic">${escapeHtml(shown.title)}</p>`;
  const flag = `<span class="ix-flag" aria-hidden="true">${lang.flag}</span>`;
  const heading =
    shown === undefined
      ? `<h1 class="cl-name">${flag}<span class="cl-text" aria-hidden="true">${name}</span><span class="sr-only">${escapeHtml(title)}</span></h1>`
      : `<p class="cl-name">${flag}<span class="cl-text">${name}</span></p>`;
  return `<header class="cl-head">
${home}${back}
<div class="hm-group glass cl-tools">${level(track, "", " data-lv-start")}${groupButton(t.groupBy)}</div>
${heading}<span class="ix-count cl-count" ${counts}>${total}</span>
<p class="cl-line"><span class="cl-n" ${counts}>${total}</span><span class="cl-dot" aria-hidden="true"> · </span>${explainedLine(lang, explain)}</p>
</header>`;
}

// The column: its head, the search field with Close, the glass bar and the phone's Search button (the top, which stays in
// view above the scrolling list), then the topics in both groupings (data-order picks the one shown) and the search's results in their place while the field has a query.
export function courseSide(track: Track, shown?: Shown): string {
  const { ctx, lang, explain, t } = track;
  const marked = shown?.ref;
  return `<aside class="cl-side" data-cl-side>
<div class="cl-top">
${head(track, shown)}
<nav class="cl-nav" aria-label="${escapeHtml(t.search)}">
${searchForm(t)}
${closeButton(t)}
${glassBar(track, shown)}
${searchButton(t)}
</nav>
</div>
<div class="cl-list" id="hm-cards">
<div class="ix-flow" data-order="categories">${byCategory(track, marked)}</div>
<div class="ix-flow" data-order="path">${byLevel(track, marked)}</div>
</div>
${results(t, searchFilters(t, explain, ctx.languages, lang.code))}
<div class="ix-fade" aria-hidden="true"></div>
</aside>`;
}

// The menus the toolbars open: Group by, the variety's (a topic page's begins with what the choice hides) and More.
export function menus(track: Track, shown?: Shown): string {
  const { ctx, explain, t } = track;
  const varieties = varietiesOf(track);
  return `${groupMenu(t)}
${varieties.length === 0 ? "" : varietyMenu(t.variety, varieties, shown === undefined ? "" : t.varietyHidden)}
${moreMenu(t, explain, ctx.o.brand ?? LIBRARY_BRAND)}`;
}
