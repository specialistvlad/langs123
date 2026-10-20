// The missing pages: one at the root and one in each other explanation language's folder, each the same page
// led by its own language: a 404 whose 0 is the languages glyph, "Page not found" as the heading, the same
// words in the other languages as a soft line, and a chip per language leading to its home page, the page's
// own filled. notfound.css lays it out in the frame (frame.css).
import { type Explain, SITE } from "../../../scripts/lib.ts";
import { type Context, EXPLAINS } from "../context.ts";
import { HOME } from "../glyphs.ts";
import { escapeHtml } from "../html.ts";
import { ui } from "../ui.ts";
import { homeUrl, notFoundUrl } from "../urls.ts";

// The languages glyph of the Read in button, cropped to its drawing so it sits in the middle of the 0.
const GLYPH =
  '<svg viewBox="2 1 22 22" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h9"/><path d="M8.5 3v2"/><path d="M11 5c-1 4-3.5 7-7 9"/><path d="M6 9c1 2.5 3 4.5 5.5 5.5"/><path d="M13 21l4.5-10 4.5 10"/><path d="M14.5 17.5h6"/></svg>';
// The frame's up button to Home: a house, named for screen readers.
export const upButton = (href: string, label: string): string =>
  `<a class="pg-up glass" href="${href}" aria-label="${escapeHtml(label)}">${HOME}</a>`;

export function notFoundPage(ctx: Context): void {
  for (const lang of EXPLAINS) {
    const t = ui(lang);
    const order: Explain[] = [lang, ...EXPLAINS.filter((e) => e !== lang)];
    const others = order.slice(1).map((e) => `<span lang="${e}">${escapeHtml(ui(e).notFound)}</span>`);
    const chips = order
      .map(
        (e) =>
          `<a class="nf-chip${e === lang ? " here" : ""}" href="${homeUrl(e)}" hreflang="${e}" lang="${e}"><b aria-hidden="true">${e.toUpperCase()}</b>${escapeHtml(ui(e).backHome)}</a>`,
      )
      .join("");
    const body = `${upButton(homeUrl(lang), t.backHome)}
<main class="nf-main">
<div class="nf-num" role="img" aria-label="404"><span class="nf-four" aria-hidden="true">4</span><span class="nf-zero" aria-hidden="true">${GLYPH}</span><span class="nf-four" aria-hidden="true">4</span></div>
<h1 class="nf-heading" lang="${lang}">${escapeHtml(t.notFound)}</h1>
<p class="nf-others">${others.join(" · ")}</p>
<div class="nf-chips">${chips}</div>
</main>`;
    ctx.add({ kind: "404", lang, title: `${t.notFound} — ${SITE.name}`, description: t.notFound, path: notFoundUrl(lang), body }, false);
  }
}
