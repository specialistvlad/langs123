// The home pages, one per explanation language, in the frame (frame.css, home.css): the brand, the heading, a
// card per language to learn with its levels and a chip per explanation language it is written for, the home
// page's own first, and a glass toolbar at the top right, at the bottom on phones: search over every course, Read
// in, the theme and the credits. The search reads search/<language>.json (home-search.ts) and shows the topics
// that match. A course's levels open the level popover: what each level covers in the course.
import { type Explain, explainName, listOf, localize, say, SITE } from "../../../scripts/lib.ts";
import { join, refRange, topicLevels } from "../../../scripts/levels.ts";
import { LIBRARY_BRAND } from "../brand.ts";
import { alternates, type Context, EXPLAINS, explainsOf, homeLanguage, readChoices } from "../context.ts";
import { INFO } from "../glyphs.ts";
import { closeButton, moreButton, moreMenu, readMenu, results, searchForm, themeButton, themeMenu } from "../toolbar.ts";
import { escapeHtml } from "../html.ts";
import { courseEntry, type LevelEntry, levelData, levelPopover } from "../level-popover.ts";
import { levelsLabel, levelsOf, markButton } from "../level-mark.ts";
import type { Level } from "../../../scripts/lib.ts";
import { ui } from "../ui.ts";
import { searchFilters } from "../search-filters.ts";
import { creditsUrl, homeUrl, trackUrl } from "../urls.ts";
import { homeSearch } from "./home-search.ts";

// The course cards of a home page: each opens in the home page's language when the course is written for it,
// else in its first explanation language.
function cards(ctx: Context, home: Explain, entries: Record<string, LevelEntry>): string {
  return ctx.languages
    .map((lang) => {
      const explains = explainsOf(lang);
      const order = [...explains.filter((e) => e === home), ...explains.filter((e) => e !== home)];
      const chips = order
        .map((e) => {
          const label = escapeHtml(`${ui(e).track(localize(lang.name, e))}, ${ui(e).explained}`);
          const here = e === (order[0] ?? home) ? " here" : "";
          return `<a class="hm-chip${here}" href="${trackUrl(e, lang)}" hreflang="${e}" lang="${e}" title="${label}">${escapeHtml(explainName(e))}</a>`;
        })
        .join("");
      const refs = ctx.refs.filter((r) => r.lang === lang.code);
      const name = localize(lang.name, home);
      const levels = courseLevels(refs);
      entries[lang.code] = courseEntry(name, refs, home);
      const mark = markButton(levels, lang.code, levelsLabel(levels, home));
      return `<article class="hm-card">
<div class="hm-course"><a class="hm-course-a" href="${trackUrl(order[0] ?? home, lang)}"><span class="hm-flag" aria-hidden="true">${lang.flag}</span><h2 class="hm-name">${escapeHtml(name)}</h2></a>${mark}</div>
<p class="hm-label">${escapeHtml(say("matrixExplained", home))}</p>
<div class="hm-chips">${chips}</div>
</article>`;
    })
    .join("\n");
}

// The levels of a course: its written topics' by their data, its planned ones' by their entry.
function courseLevels(refs: Parameters<typeof refRange>[0][]): Level[] {
  const held = new Set<Level>();
  for (const ref of refs) {
    const range = refRange(ref);
    for (const l of ref.topic === null ? (range === null ? [] : levelsOf(range)) : topicLevels(ref.topic)) held.add(l);
  }
  return [...held];
}

// The toolbar: the search, the Read in menu, the theme and the credits, the last two folded into More on a phone,
// and Close while searching.
function toolbar(home: Explain): string {
  const t = ui(home);
  const words = say("credits", home);
  const credits = escapeHtml(words);
  return `<nav class="hm-bar">
${searchForm(t)}
<div class="hm-group hm-folds glass">
${readMenu(t, readChoices(home, homeUrl))}
${themeButton(t)}
<a class="hm-credits" href="${creditsUrl(home)}" aria-label="${credits}" title="${credits}">${INFO}</a>
${moreButton(t)}
</div>
${moreMenu(t, { href: creditsUrl(home), label: words })}
${closeButton(t)}
${themeMenu(t)}
</nav>
<noscript><style>.hm-search,.hm-close{display:none}</style></noscript>`;
}

// On a first visit to the first Home, the reader's own language: the first of the browser's languages the site is
// explained in leads to that Home, until the reader chooses a language in Read in (ln-read).
function firstVisit(home: Explain): string {
  const homes = Object.fromEntries(EXPLAINS.map((e) => [e, homeUrl(e)]));
  return `<script>try{if(!localStorage.getItem("ln-read")){var h=${JSON.stringify(homes)},w=navigator.languages||[navigator.language];for(var i=0;i<w.length;i++){var c=String(w[i]).slice(0,2).toLowerCase();if(h[c]){if(c!==${JSON.stringify(home)})location.replace(h[c]);break}}}}catch(e){}</script>`;
}

export function homePage(ctx: Context): void {
  const { refs } = ctx;
  const brand = ctx.o.brand ?? LIBRARY_BRAND;
  // The levels the curriculum covers: written topics by their data, planned ones by their entry.
  const range = join(refs.filter((r) => ctx.languages.some((l) => l.code === r.lang)).map((r) => refRange(r)));
  for (const home of EXPLAINS) {
    const t = ui(home);
    const values = {
      site: SITE.name,
      languages: listOf(
        ctx.languages.map((l) => localize(l.name, home)),
        home,
      ),
      from: range?.from ?? "",
      to: range?.to ?? "",
      explain: listOf(
        SITE.explain.filter((e) => e.enabled).map((e) => say("explainedIn", home, { name: localize(e.name, home) })),
        home,
      ),
    };
    const entries: Record<string, LevelEntry> = {};
    const grid = cards(ctx, home, entries);
    const body = `<main class="hm-main">
<a class="hm-brand" href="${homeUrl(home)}">${brand.mark(28)}<span>${escapeHtml(SITE.name)}</span></a>
<h1 class="hm-title">${escapeHtml(say("homeHeading", home))}</h1>
<div class="hm-grid" id="hm-cards">
${grid}
</div>
${results(t, searchFilters(t, home, ctx.languages, readChoices(home, homeUrl)))}
</main>
${toolbar(home)}
${levelPopover(home)}
${levelData(entries)}`;
    ctx.add({
      kind: "home",
      lang: home,
      title: say("homeTitle", home, values),
      description: say("homeDescription", home, values),
      path: homeUrl(home),
      alternates: [...alternates(homeUrl), { lang: "x-default", path: homeUrl(homeLanguage()) }],
      read: readChoices(home, homeUrl),
      body,
      ...(home === homeLanguage() ? { headTags: [firstVisit(home)] } : {}),
    });
    homeSearch(ctx, home);
  }
}
