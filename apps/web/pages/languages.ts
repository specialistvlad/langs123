// The Languages I know page, in each explanation language at /{explain}/languages/ (the first at /languages/): the
// ranked list of up to three, each row with its number, its own name, its name in the page's language and a handle to
// drag, then Add a language with the others. It is laid out as the Credits page is, Home beside the title. The page
// holds the page's language alone on the list and every other language under Add; client-languages-page.ts moves
// each row to where the reader's list (ln-langs) puts it. The same page in its first-run form sits at
// /{explain}/languages/first/: the product's mark in place of Home, the intro line and a Continue button that leads
// back to the page the reader came from (?back=), so a first visit shows it whole, with no switch after load.
// languages.json beside each language's folder carries what the client writes into other pages (languages-data.ts).
import { type Explain, explainName, localize, say, SITE } from "../../../scripts/lib.ts";
import { type Brand, LIBRARY_BRAND } from "../brand.ts";
import { alternates, type Context, EXPLAINS } from "../context.ts";
import { glyph } from "../glyphs.ts";
import { escapeHtml } from "../html.ts";
import { type Ui, ui } from "../ui.ts";
import { homeUrl, languagesDataUrl, languagesFirstUrl, languagesUrl } from "../urls.ts";
import { languagesData } from "./languages-data.ts";
import { upButton } from "./notfound.ts";

// Each explanation language's name in every language.
const NAMES: Record<string, Partial<Record<Explain, string>>> = Object.fromEntries(SITE.explain.map((l) => [l.code, l.name]));
const GRIP = glyph('<path d="M5 9h14M5 15h14"/>', 20, 2);
const PLUS = glyph('<path d="M12 7v10M7 12h10"/>', 16, 2.6);
const MINUS = glyph('<path d="M7 12h10"/>', 16, 2.6);

// A language's row: it holds every control, and the list it sits in shows its own (languages.css).
function row(e: Explain, page: Explain, t: Ui, rank: number | null): string {
  const own = explainName(e);
  const named = localize(NAMES[e] ?? {}, page);
  const label = (verb: string): string => escapeHtml(say("labelled", page, { label: verb, value: own }));
  const button = (cls: string, verb: string, glyphs: string): string =>
    `<button type="button" class="ml-${cls}" aria-label="${label(verb)}" title="${label(verb)}">${glyphs}</button>`;
  return `<li class="ml-row" data-lang="${e}" data-order="${EXPLAINS.indexOf(e)}" data-home="${homeUrl(e)}"><span class="ml-rank${rank === 1 ? " ml-1" : ""}">${rank ?? ""}</span><span class="ml-name"><span lang="${e}">${escapeHtml(own)}</span><small>${escapeHtml(named)}</small></span>${button("remove", t.remove, MINUS)}${button("grip", t.reorder, GRIP)}${button("add", t.add, PLUS)}</li>`;
}

function languagesIn(ctx: Context, e: Explain, brand: Brand, first: boolean): void {
  const t = ui(e);
  const rows = (codes: Explain[], ranked: boolean): string => codes.map((c, i) => row(c, e, t, ranked ? i + 1 : null)).join("");
  const head = first ? `<span class="ml-mark">${brand.mark(32)}</span>` : upButton(homeUrl(e), t.backHome);
  const foot = first
    ? `<div class="ml-foot"><a class="ml-btn" href="${homeUrl(e)}" data-ml-continue>${escapeHtml(t.continue)}</a></div>`
    : "";
  const body = `<main class="cr-main ml-page"${first ? " data-first" : ""}>
<div class="cr-head">${head}<h1 class="cr-heading">${escapeHtml(t.languagesIKnow)}</h1></div>
<p class="ml-intro">${escapeHtml(first ? t.languagesIntro : t.languagesNote)}</p>
<ul class="cr-card ml-list ml-ranked" data-ml-ranked>${rows([e], true)}</ul>
<p class="ml-hint">${escapeHtml(t.languagesLimit)}</p>
<h2 class="ml-label">${escapeHtml(t.addLanguage)}</h2>
<ul class="cr-card ml-list ml-others" data-ml-others>${rows(
    EXPLAINS.filter((c) => c !== e),
    false,
  )}</ul>
${foot}
</main>`;
  const path = (x: Explain): string => (first ? languagesFirstUrl(x) : languagesUrl(x));
  ctx.add(
    {
      kind: "page",
      lang: e,
      title: `${t.languagesIKnow} — ${SITE.name}`,
      description: t.languagesNote,
      path: path(e),
      alternates: alternates(path),
      body,
      headTags: first ? ['<meta name="robots" content="noindex">'] : [],
      about: { name: t.languagesIKnow },
    },
    !first,
  );
}

export function languagesPage(ctx: Context): void {
  const brand = ctx.o.brand ?? LIBRARY_BRAND;
  for (const e of EXPLAINS) {
    languagesIn(ctx, e, brand, false);
    languagesIn(ctx, e, brand, true);
    ctx.file(languagesDataUrl(e), JSON.stringify(languagesData(ctx, e)));
  }
}
