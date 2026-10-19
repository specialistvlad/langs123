// The home pages, one per explanation language, in the frame (frame.css, home.css): the brand, the heading, a
// card per language to learn with a chip per explanation language it is written for, the home page's own
// first, and a glass toolbar at the top right, at the bottom on phones: search over every course, Read in and
// the credits. The search reads search/<language>.json (home-search.ts) and shows the topics that match.
import { type Explain, explainName, listOf, localize, say, SITE } from "../../../scripts/lib.ts";
import { join, refRange } from "../../../scripts/levels.ts";
import { LIBRARY_BRAND } from "../brand.ts";
import { alternates, type Context, EXPLAINS, explainsOf, homeLanguage, readChoices } from "../context.ts";
import { INFO } from "../glyphs.ts";
import { closeButton, readMenu, results, searchForm } from "../toolbar.ts";
import { escapeHtml } from "../html.ts";
import { badge } from "../parts.ts";
import { ui } from "../ui.ts";
import { creditsUrl, homeUrl, trackUrl } from "../urls.ts";
import { homeSearch } from "./home-search.ts";

// The course cards of a home page: each opens in the home page's language when the course is written for it,
// else in its first explanation language.
function cards(ctx: Context, home: Explain): string {
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
      const range = badge(join(ctx.refs.filter((r) => r.lang === lang.code).map((r) => refRange(r))));
      return `<article class="hm-card">
<a class="hm-course" href="${trackUrl(order[0] ?? home, lang)}"><span class="hm-flag" aria-hidden="true">${lang.flag}</span><h2 class="hm-name">${escapeHtml(localize(lang.name, home))}</h2>${range}</a>
<p class="hm-label">${escapeHtml(say("matrixExplained", home))}</p>
<div class="hm-chips">${chips}</div>
</article>`;
    })
    .join("\n");
}

// The toolbar: the search, the Read in menu and the credits, and Close while searching.
function toolbar(home: Explain): string {
  const t = ui(home);
  const credits = escapeHtml(say("credits", home));
  return `<nav class="hm-bar">
${searchForm(t)}
<div class="hm-group glass">
${readMenu(t, readChoices(home, homeUrl))}
<a class="hm-credits" href="${creditsUrl(home)}" aria-label="${credits}" title="${credits}">${INFO}</a>
</div>
${closeButton(t)}
</nav>
<noscript><style>.hm-search,.hm-close{display:none}</style></noscript>`;
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
    const body = `<main class="hm-main">
<a class="hm-brand" href="${homeUrl(home)}">${brand.mark(28)}<span>${escapeHtml(SITE.name)}</span></a>
<h1 class="hm-title">${escapeHtml(say("homeHeading", home))}</h1>
<div class="hm-grid" id="hm-cards">
${cards(ctx, home)}
</div>
${results(t)}
</main>
${toolbar(home)}`;
    ctx.add({
      kind: "home",
      lang: home,
      title: say("homeTitle", home, values),
      description: say("homeDescription", home, values),
      path: homeUrl(home),
      alternates: [...alternates(homeUrl), { lang: "x-default", path: homeUrl(homeLanguage()) }],
      read: readChoices(home, homeUrl),
      main: "",
      body,
    });
    homeSearch(ctx, home);
  }
}
