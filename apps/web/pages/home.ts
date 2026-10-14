// The home pages, one per explanation language, where the language is chosen, and the missing pages.
import { type Explain, explainName, listOf, localize, say, SITE } from "../../../scripts/lib.ts";
import { join, refRange } from "../../../scripts/levels.ts";
import { alternates, type Context, EXPLAINS, explainsOf, homeLanguage, readChoices } from "../context.ts";
import { page } from "../layout.ts";
import { ui } from "../ui.ts";
import { escapeHtml } from "../html.ts";
import { badge } from "../parts.ts";
import { homeUrl, notFoundUrl, trackUrl } from "../urls.ts";

// Each home page leads to every track: a card per language to learn, named in the home page's language
// with its flag and levels, and a link to each explanation language it is written for, under that
// language's own name, the home page's language first. The first explanation language's home, at the
// root, is the default for other readers.
export function homePage(ctx: Context): void {
  const { o, refs } = ctx;
  // The levels the curriculum covers: written topics by their data, planned ones by their entry.
  const range = join(refs.filter((r) => ctx.languages.some((l) => l.code === r.lang)).map((r) => refRange(r)));
  for (const home of EXPLAINS) {
    const homeValues = {
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
    const title = say("homeTitle", home, homeValues);
    const description = say("homeDescription", home, homeValues);
    const cards = ctx.languages
      .map((lang) => {
        const own = refs.filter((r) => r.lang === lang.code);
        const explains = explainsOf(lang);
        const order = [...explains.filter((e) => e === home), ...explains.filter((e) => e !== home)];
        const links = order
          .map((e) => {
            const name = escapeHtml(`${ui(e).track(localize(lang.name, e))}, ${ui(e).explained}`);
            const here = e === home ? ' class="here"' : "";
            return `<li><a href="${trackUrl(e, lang)}" hreflang="${e}" lang="${e}" aria-label="${name}" title="${name}"${here}>${escapeHtml(explainName(e))}</a></li>`;
          })
          .join("");
        const head = `<header><span class="page-icon" aria-hidden="true">${lang.flag}</span><h2>${escapeHtml(localize(lang.name, home))}</h2>${badge(join(own.map((r) => refRange(r))))}</header>`;
        return `<section class="lang-card">${head}<p class="card-label">${escapeHtml(say("matrixExplained", home))}</p><ul class="explains">${links}</ul></section>`;
      })
      .join("");
    ctx.add(
      homeUrl(home),
      page({
        kind: "home",
        lang: home,
        title,
        description,
        path: homeUrl(home),
        alternates: [...alternates(homeUrl), { lang: "x-default", path: homeUrl(homeLanguage()) }],
        read: readChoices(home, homeUrl),
        main: `<article class="doc home"><header class="home-head"><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(description)}</p></header><div class="lang-cards">${cards}</div></article>`,
        dev: o.dev,
        siteUrl: o.siteUrl,
      }),
    );
  }
}

// The root's missing page speaks every explanation language; every other language's folder has its own.
export function notFoundPage(ctx: Context): void {
  const { o } = ctx;
  const home = homeLanguage();
  const add = (lang: Explain, languages: Explain[]): void => {
    const links = languages.map((e) => `<a href="${homeUrl(e)}" lang="${e}">${escapeHtml(ui(e).backHome)}</a>`);
    ctx.add(
      notFoundUrl(lang),
      page({
        kind: "404",
        lang,
        title: `${ui(lang).notFound} — ${SITE.name}`,
        description: ui(lang).notFound,
        path: notFoundUrl(lang),
        crumbs: [{ label: ui(lang).notFound }],
        main: `<article class="doc"><h1>${languages.map((e) => `<span lang="${e}">${escapeHtml(ui(e).notFound)}</span>`).join(" · ")}</h1><p>${links.join(" · ")}</p></article>`,
        dev: o.dev,
        siteUrl: o.siteUrl,
      }),
      false,
    );
  };
  add(home, EXPLAINS);
  for (const e of EXPLAINS.filter((x) => x !== home)) add(e, [e]);
}
