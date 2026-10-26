// The credits page, in each explanation language, the one place that names the content's authors, both
// licences and how to credit the content, laid out as an iOS About page in the frame (frame.css, credits.css) in one
// column: the product's card with its mark and tagline, its version line, the website and the product's own rows,
// then grouped cards: the authors, the licences, how to credit (the credit line with a copy button,
// client-credits.ts), the ways to contribute and the name note, and the product's closing line. Above 860px it is
// the right pane of the split view (split.ts) beside the Home's left pane, with Close at its top right; the Home's
// right pane takes the same column (data-sp-fragment) when the credits open there. On a phone a glass button to Home
// shares the title row with the heading. The product's own lines come from the build's brand option (brand.ts).
import { type Explain, say, SITE, type TextKey } from "../../../scripts/lib.ts";
import { type Brand, LIBRARY_BRAND } from "../brand.ts";
import { alternates, type Context, EXPLAINS } from "../context.ts";
import { CHECK, COPY, GLYPHS, row } from "../credits-parts.ts";
import { CLOSE } from "../glyphs.ts";
import { escapeHtml } from "../html.ts";
import { split } from "../split.ts";
import { ui } from "../ui.ts";
import { creditsUrl, homeUrl } from "../urls.ts";
import { homePane } from "./home.ts";
import { upButton } from "./notfound.ts";

const link = (href: string, text: string): string => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;

export function creditsPage(ctx: Context): void {
  for (const e of EXPLAINS) creditsIn(ctx, e, ctx.o.brand ?? LIBRARY_BRAND);
}

function creditsIn(ctx: Context, e: Explain, brand: Brand): void {
  const t = ui(e);
  const site = SITE.name;
  const { content, code } = SITE.licences;
  const words = (key: TextKey): string => escapeHtml(say(key, e, { site }));
  const authors = words("creditsAuthors").replace("{credit}", link(`${SITE.repository}/graphs/contributors`, SITE.credit));
  const licences = [
    row({ glyph: "doc", title: content.name, sub: say("contentLicence", e, { site }), href: content.url, rel: "license" }),
    row({ glyph: "code", title: code.name, sub: say("codeLicence", e, { site }), href: code.url }),
  ];
  const contribute = [
    row({ glyph: "branch", title: say("sourceLink", e), href: SITE.repository }),
    row({
      glyph: "flag",

      title: say("reportMistake", e),
      href: `${SITE.repository}/issues/new?template=report-a-mistake.yml`,
    }),
    row({ glyph: "book", title: say("contributing", e), href: `${SITE.repository}/blob/main/CONTRIBUTING.md` }),
  ];
  const own = brand.credits;
  const version = own?.version?.(e) ?? "";
  const links = [
    row({ glyph: "globe", title: t.website, value: new URL(SITE.url).host, href: SITE.url }),
    ...(own?.rows?.(e) ?? []).map(row),
  ];
  const heading = words("credits");
  const fragment = `<div class="cr-main" data-sp-fragment>
<h1 class="cr-heading">${heading}</h1>
<section class="cr-card cr-app"><span class="cr-mark">${brand.mark(64, site)}</span><div><p class="cr-name">${escapeHtml(site)}</p><p class="cr-tag">${escapeHtml(own?.tagline?.(e) ?? say("homeHeading", e))}</p></div></section>
${version === "" ? "" : `<p class="cr-version">${escapeHtml(version)}</p>`}
<div class="cr-card cr-links">${links.join("")}</div>
<h2 class="cr-h2">${heading}</h2>
<div class="cr-card cr-people"><span class="cr-tile">${GLYPHS.people}</span><p>${authors}</p></div>
<h2 class="cr-h2">${words("licences")}</h2>
<div class="cr-card">${licences.join("")}</div>
<h2 class="cr-h2">${words("howToCredit")}</h2>
<div class="cr-card cr-how"><p>${words("creditIntro")}</p>
<div class="cr-line"><span class="credit-line" id="cr-credit">${escapeHtml(`${SITE.credit}, ${SITE.url} — ${content.name}`)}</span><button type="button" class="cr-copy" id="cr-copy" aria-label="${escapeHtml(t.copy)}" title="${escapeHtml(t.copy)}" data-copy="${escapeHtml(t.copy)}" data-copied="${escapeHtml(t.copied)}">${COPY}${CHECK}</button></div>
<p class="cr-sub cr-changes">${words("creditChanges")}</p></div>
<h2 class="cr-h2">${words("contribute")}</h2>
<div class="cr-card">${contribute.join("")}</div>
<p class="cr-note">${words("nameNote")}</p>
${own?.footer === undefined ? "" : `<p class="cr-made">${own.footer(e)}</p>`}
<span class="sr-only" id="cr-live" aria-live="polite"></span>
</div>`;
  // Wide: Home stays in the left pane, the credits fill the right one with Close at its top right; a phone shows the
  // credits alone, the Home button sharing the title row with the heading.
  const close = `<a class="sp-x glass" href="${homeUrl(e)}" data-sp-close data-sp-tools aria-label="${escapeHtml(t.closeCredits)}" title="${escapeHtml(t.closeCredits)}">${CLOSE}</a>`;
  const pane = homePane(ctx, e);
  const body = `${split({
    t,
    cls: "sp-home sp-credits sp-item",
    left: pane.left,
    tools: close,
    body: `${upButton(homeUrl(e), t.backHome)}\n${fragment}`,
    open: creditsUrl(e),
  })}
${pane.extras}`;
  ctx.add({
    kind: "credits",
    lang: e,
    title: `${say("credits", e)} — ${site}`,
    description: say("creditsDescription", e, { site }),
    path: creditsUrl(e),
    alternates: alternates(creditsUrl),
    body,
    about: { name: say("credits", e) },
  });
}
