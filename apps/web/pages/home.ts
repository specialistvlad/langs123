// The home pages, one per explanation language, in the frame (frame.css, home.css): one page whatever the width. A
// header line holds the brand, the search over every course centred (up to 520 wide) and More, which ends it (on a
// phone the brand heads the page and More and a Search button make the bottom bar); under it a card per language to
// learn, in a grid of three columns on a wide screen and two on a tablet: its flag and name, "Up to" and the
// course's top level, and the "Explained in" line (explained-line.ts). A card opens the course's page. The search
// reads search/<language>.json (home-search.ts) and shows the topics that match under the same header, centred
// under the field.
import { type Explain, LEVELS, listOf, localize, say, SITE } from "../../../scripts/lib.ts";
import { join, refRange, topicLevels } from "../../../scripts/levels.ts";
import { LIBRARY_BRAND } from "../brand.ts";
import { alternates, type Context, EXPLAINS, homeLanguage } from "../context.ts";
import { closeButton, moreButton, moreMenu, results, searchButton, searchForm } from "../toolbar.ts";
import { escapeHtml } from "../html.ts";
import { defaultExplain, explainedLine } from "../explained-line.ts";
import { levelData, levelPopover } from "../level-popover.ts";
import { levelsOf } from "../level-mark.ts";
import type { Level } from "../../../scripts/lib.ts";
import { ui } from "../ui.ts";
import { searchFilters } from "../search-filters.ts";
import { homeUrl, trackUrl } from "../urls.ts";
import { homeSearch } from "./home-search.ts";

// A level as a pill, the colours of its tint.
const pill = (level: Level): string =>
  `<span class="badge lvl hm-pill" aria-hidden="true"><span class="half lvl-${level}">${level}</span></span>`;

// "Up to C2": the words muted, the course's top level a pill; the page's language puts the level where it reads.
function upTo(levels: Level[], home: Explain): string {
  const top = LEVELS.filter((l) => levels.includes(l)).at(-1);
  if (top === undefined) return "";
  const [before = "", after = ""] = say("searchUpTo", home, { level: "\u0000" }).split("\u0000");
  const words = escapeHtml(say("searchUpTo", home, { level: top }));
  return `<span class="hm-upto" role="img" aria-label="${words}">${escapeHtml(before)}${pill(top)}${escapeHtml(after)}</span>`;
}

// The course cards of a home page: each opens in the home page's language when the course is written for it,
// else in its first explanation language.
function cards(ctx: Context, home: Explain): string {
  return ctx.languages
    .map((lang) => {
      const opens = defaultExplain(lang, home);
      const name = escapeHtml(localize(lang.name, home));
      const levels = courseLevels(ctx.refs.filter((r) => r.lang === lang.code));
      return `<article class="hm-card" data-xl-card>
<div class="hm-course"><a class="hm-course-a" href="${trackUrl(opens, lang)}" data-course="${lang.code}"><span class="hm-flag" aria-hidden="true">${lang.flag}</span><h2 class="hm-name">${name}</h2></a>${upTo(levels, home)}</div>
${explainedLine(lang, home, "hm-explained")}
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

// The header line: the brand, the search and Close (centred), and More, which ends the toolbar.
function header(ctx: Context, home: Explain): string {
  const t = ui(home);
  const brand = ctx.o.brand ?? LIBRARY_BRAND;
  return `<header class="hm-head">
<a class="hm-brand" href="${homeUrl(home)}">${brand.mark(28)}<span>${escapeHtml(SITE.name)}</span></a>
<nav class="hm-bar">
<div class="hm-mid">${searchForm(t)}${closeButton(t)}</div>
<div class="hm-group glass">${moreButton(t)}</div>
${searchButton(t)}
</nav>
</header>
${moreMenu(t, home, brand)}
<noscript><style>.hm-search,.hm-close,.ix-search-open{display:none}</style></noscript>`;
}

export function homePage(ctx: Context): void {
  const { refs } = ctx;
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
    const body = `<div class="hm-home">
${header(ctx, home)}
<main class="hm-main">
<h1 class="sr-only">${escapeHtml(SITE.name)}</h1>
<div class="hm-grid" id="hm-cards">
${cards(ctx, home)}
</div>
<section class="xl-other" data-xl-other hidden><h2>${escapeHtml(t.otherExplanationLanguages)}</h2><p>${escapeHtml(t.otherExplanationNote)}</p><div class="hm-grid" data-xl-other-cards></div></section>
${results(t, searchFilters(t, home, ctx.languages))}
</main>
</div>
${levelPopover(home)}
${levelData({})}`;
    ctx.add({
      kind: "home",
      lang: home,
      title: say("homeTitle", home, values),
      description: say("homeDescription", home, values),
      path: homeUrl(home),
      alternates: [...alternates(homeUrl), { lang: "x-default", path: homeUrl(homeLanguage()) }],
      body,
    });
    homeSearch(ctx, home);
  }
}
