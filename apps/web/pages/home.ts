// The home pages, one per explanation language, where the language is chosen, and the missing pages.
import { type Explain, explainName, listOf, localize, say, SITE } from "../../../scripts/lib.ts";
import { join, refRange } from "../../../scripts/levels.ts";
import { alternates, type Context, EXPLAINS, homeLanguage, readChoices } from "../context.ts";
import { controls, page, ui } from "../layout.ts";
import { escapeHtml } from "../html.ts";
import { badge } from "../parts.ts";
import { homeUrl, notFoundUrl, trackUrl } from "../urls.ts";

// Each home page leads to every track through a matrix: a row per language to learn, named in the home
// page's language with its levels and topics, and a column per explanation language, under its own name,
// the home page's language first; each cell is an arrow into that track. The first explanation language's home, at the
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
    const order = [home, ...EXPLAINS.filter((e) => e !== home)];
    const corner = `<th class="corner" scope="col"><span class="axis-x">${escapeHtml(say("matrixExplained", home))}</span><span class="axis-y">${escapeHtml(say("matrixLearn", home))}</span></th>`;
    const head = `<thead><tr>${corner}${order.map((e) => `<th scope="col" lang="${e}">${escapeHtml(explainName(e))}</th>`).join("")}</tr></thead>`;
    const body = ctx.languages
      .map((lang) => {
        const own = refs.filter((r) => r.lang === lang.code);
        const written = own.filter((r) => r.topic !== null).length;
        // A cell is an arrow into its track; the row names the language once, with its levels and topics.
        const cells = order.map((e) => {
          const name = escapeHtml(`${ui(e).track(localize(lang.name, e))}, ${ui(e).explained}`);
          return `<td><a href="${trackUrl(e, lang)}" hreflang="${e}" lang="${e}" aria-label="${name}" title="${name}"><span class="go" aria-hidden="true">→</span></a></td>`;
        });
        const about = `${badge(join(own.map((r) => refRange(r))))} <span>${escapeHtml(say("written", home, { n: written, total: own.length }))}</span>`;
        return `<tr><th scope="row"><span class="name">${escapeHtml(localize(lang.name, home))}</span><span class="about">${about}</span></th>${cells.join("")}</tr>`;
      })
      .join("");
    ctx.add(
      homeUrl(home),
      page({
        kind: "home",
        lang: home,
        title: say("homeTitle", home, homeValues),
        description: say("homeDescription", home, homeValues),
        path: homeUrl(home),
        alternates: [...alternates(homeUrl), { lang: "x-default", path: homeUrl(homeLanguage()) }],
        controls: controls({ explain: home, read: readChoices(home, homeUrl) }),
        main: `<article class="doc home"><div class="matrix-wrap"><table class="matrix">${head}<tbody>${body}</tbody></table></div></article>`,
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
