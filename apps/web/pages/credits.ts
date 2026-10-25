// The credits page, in each explanation language, the one place that names the content's authors, both
// licences and how to credit the content, laid out as an iOS About page in the frame (frame.css, credits.css):
// a glass up button to Home, the product's card with its mark and tagline, its version line, the website and
// the product's own rows, then grouped cards: the authors, the licences, how to credit (the credit line with a
// copy button, client-credits.ts), the ways to contribute and the name note, and the product's closing line.
// Two columns above 860px, one below. The product's own lines come from the build's brand option (brand.ts).
import { type Explain, say, SITE } from "../../../scripts/lib.ts";
import { type Brand, LIBRARY_BRAND } from "../brand.ts";
import { alternates, type Context, EXPLAINS } from "../context.ts";
import { CHECK, COPY, GLYPHS, row } from "../credits-parts.ts";
import { escapeHtml } from "../html.ts";
import { ui } from "../ui.ts";
import { creditsUrl, homeUrl } from "../urls.ts";
import { upButton } from "./notfound.ts";

const link = (href: string, text: string): string => `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;

export function creditsPage(ctx: Context): void {
  for (const e of EXPLAINS) creditsIn(ctx, e, ctx.o.brand ?? LIBRARY_BRAND);
}

function creditsIn(ctx: Context, e: Explain, brand: Brand): void {
  const t = ui(e);
  const site = SITE.name;
  const { content, code } = SITE.licences;
  const words = (key: string): string => escapeHtml(say(key, e, { site }));
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
  const body = `${upButton(homeUrl(e), t.backHome)}
<main class="cr-main">
<h1 class="cr-heading">${heading}</h1>
<div class="cr-cols">
<div class="cr-col">
<section class="cr-card cr-app"><span class="cr-mark">${brand.mark(64, site)}</span><div><p class="cr-name">${escapeHtml(site)}</p><p class="cr-tag">${escapeHtml(own?.tagline?.(e) ?? say("homeHeading", e))}</p></div></section>
${version === "" ? "" : `<p class="cr-version">${escapeHtml(version)}</p>`}
<div class="cr-card cr-links">${links.join("")}</div>
<h2 class="cr-h2">${heading}</h2>
<div class="cr-card cr-people"><span class="cr-tile">${GLYPHS.people}</span><p>${authors}</p></div>
<h2 class="cr-h2">${words("licences")}</h2>
<div class="cr-card">${licences.join("")}</div>
</div>
<div class="cr-col">
<h2 class="cr-h2">${words("howToCredit")}</h2>
<div class="cr-card cr-how"><p>${words("creditIntro")}</p>
<div class="cr-line"><span class="credit-line" id="cr-credit">${escapeHtml(`${SITE.credit}, ${SITE.url} — ${content.name}`)}</span><button type="button" class="cr-copy" id="cr-copy" aria-label="${escapeHtml(t.copy)}" title="${escapeHtml(t.copy)}" data-copy="${escapeHtml(t.copy)}" data-copied="${escapeHtml(t.copied)}">${COPY}${CHECK}</button></div>
<p class="cr-sub cr-changes">${words("creditChanges")}</p></div>
<h2 class="cr-h2">${words("contribute")}</h2>
<div class="cr-card">${contribute.join("")}</div>
<p class="cr-note">${words("nameNote")}</p>
</div>
</div>
${own?.footer === undefined ? "" : `<p class="cr-made">${own.footer(e)}</p>`}
<span class="sr-only" id="cr-live" aria-live="polite"></span>
</main>`;
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
