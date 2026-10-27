// The product's own pages (brand.ts BrandPage), each in every explanation language at /{slug}/ as the credits are:
// the Home button and the title in one row, the body below in the credits' column of at most 680px.
import { type Explain, SITE } from "../../../scripts/lib.ts";
import { type BrandPage } from "../brand.ts";
import { alternates, type Context, EXPLAINS } from "../context.ts";
import { escapeHtml } from "../html.ts";
import { ui } from "../ui.ts";
import { homeUrl, pageUrl } from "../urls.ts";
import { upButton } from "./notfound.ts";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The build refuses an address that is not a lowercase segment, is the credits' or repeats, before it builds a page.
export function checkBrandPages(pages: BrandPage[] = []): void {
  const taken = new Set(["credits", "languages"]);
  for (const { slug } of pages) {
    if (!SLUG.test(slug) || taken.has(slug)) throw new Error(`brand page "${slug}" is not a free address segment`);
    taken.add(slug);
  }
}

export function brandPages(ctx: Context): void {
  for (const page of ctx.o.brand?.pages ?? []) for (const e of EXPLAINS) brandPageIn(ctx, e, page);
}

function brandPageIn(ctx: Context, e: Explain, page: BrandPage): void {
  const heading = page.title(e);
  const path = (x: Explain): string => pageUrl(x, page.slug);
  const body = `<main class="cr-main">
<div class="cr-head">${upButton(homeUrl(e), ui(e).backHome)}<h1 class="cr-heading">${escapeHtml(heading)}</h1></div>
${page.body(e)}
</main>`;
  ctx.add({
    kind: "page",
    lang: e,
    title: `${heading} — ${SITE.name}`,
    description: page.description?.(e) ?? heading,
    path: path(e),
    alternates: alternates(path),
    body,
    about: { name: heading },
  });
}
