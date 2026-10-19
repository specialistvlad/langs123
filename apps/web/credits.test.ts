// The credits live on one page: every page's top bar links to it, no page has a footer, and the credits
// page names the content's authors, both licences, the credit line and the ways to contribute.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { ENABLED_EXPLAIN, type Explain, SITE, say } from "../../scripts/lib.ts";
import { readPage, SITE_DIR, testSite } from "./test-site.ts";
import { creditsUrl, homeUrl, notFoundUrl } from "./urls.ts";

const pages = await testSite();

// A page's language, its top bar alone, parsed, and whether it has a footer: every page is checked, so
// the test reads only what it checks.
async function topBar(path: string): Promise<{ lang: Explain; doc: Document; footer: boolean; frame: boolean }> {
  const html = await Bun.file(join(SITE_DIR, path)).text();
  const start = html.indexOf('<header class="topbar"');
  const bar = start < 0 ? "" : html.slice(start, html.indexOf("</header>", start) + "</header>".length);
  const lang = (/<html lang="([a-z]+)"/.exec(html)?.[1] ?? "") as Explain;
  const frame = /<html[^>]* data-frame/.test(html);
  return { lang, doc: parseHTML(`<html><body>${bar}</body></html>`).document, footer: /<footer[\s>]/.test(html), frame };
}

describe.each(pages)("%s", (path) => {
  test("the top bar holds the chips and the language a page is read in, then the credits beside the theme switch, and the page has no footer", async () => {
    const { lang, doc, footer, frame } = await topBar(path);
    expect(footer).toBe(false);
    // A page in the frame draws its own body, without the top bar.
    if (frame) return;
    const credits = creditsUrl(lang);
    const tools = [...doc.querySelectorAll(".topbar .tools > *")].map((el) =>
      el.matches(".chips")
        ? "chips"
        : el.matches("details.lang-menu")
          ? "language"
          : (el.getAttribute("href") ?? (el.hasAttribute("data-theme-toggle") ? "theme" : el.tagName)),
    );
    expect(tools.filter((t) => t !== "chips" && t !== "language")).toEqual([credits, "theme"]);
    expect(tools.join(" ")).toBe(
      [tools.includes("chips") ? "chips" : "", tools.includes("language") ? "language" : "", credits, "theme"].filter(Boolean).join(" "),
    );
    const link = doc.querySelector(`.topbar a[href="${credits}"]`);
    expect(link?.getAttribute("aria-label")).toBe(say("credits", lang));
    expect(link?.getAttribute("aria-current")).toBe(`/${path}` === `${credits}index.html` ? "page" : null);
    expect(doc.querySelector(".topbar .brand")?.getAttribute("href")).toBe(homeUrl(lang));
    expect(footer).toBe(false);
  });
});

test("the credits page names the authors, both licences, the credit line and the ways to contribute", async () => {
  const doc = await readPage("credits/index.html");
  const hrefs = [...doc.querySelectorAll("main a")].map((a) => a.getAttribute("href") ?? "");
  const { content, code } = SITE.licences;
  expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://127.0.0.1/credits/");
  expect(doc.querySelector(`main a[href="${SITE.repository}/graphs/contributors"]`)?.textContent).toBe(SITE.credit);
  expect(doc.querySelector('main a[rel="license"]')?.getAttribute("href")).toBe(content.url);
  expect(hrefs).toContain(code.url);
  expect(doc.querySelector(".credit-line")?.textContent).toBe(`${SITE.credit}, ${SITE.url} — ${content.name}`);
  expect(hrefs).toContain(SITE.repository);
  expect(hrefs).toContain(`${SITE.repository}/blob/main/CONTRIBUTING.md`);
  expect(hrefs.some((h) => h.startsWith(`${SITE.repository}/issues/new?template=report-a-mistake.yml`))).toBe(true);
});

describe.each(ENABLED_EXPLAIN)("the pages in %s", (e) => {
  const file = (url: string): string => `${url.slice(1)}${url.endsWith("/") ? "index.html" : ""}`;
  test("the home page and the credits page speak the language and name the same page in the others", async () => {
    for (const url of [homeUrl(e), creditsUrl(e)]) {
      const doc = await readPage(file(url));
      expect(doc.documentElement.getAttribute("lang")).toBe(e);
      const alternates = [...doc.querySelectorAll('link[rel="alternate"]')].map((l) => [
        l.getAttribute("hreflang"),
        l.getAttribute("href"),
      ]);
      const pathFor = url === homeUrl(e) ? homeUrl : creditsUrl;
      for (const other of ENABLED_EXPLAIN) expect(alternates).toContainEqual([other, `http://127.0.0.1${pathFor(other)}`]);
    }
    const home = await readPage(file(homeUrl(e)));
    expect(home.querySelector('link[hreflang="x-default"]')?.getAttribute("href")).toBe(
      `http://127.0.0.1${homeUrl(ENABLED_EXPLAIN[0] ?? e)}`,
    );
    // Every other page's x-default is its English version.
    const credits = await readPage(file(creditsUrl(e)));
    expect(credits.querySelector('link[hreflang="x-default"]')?.getAttribute("href")).toBe(`http://127.0.0.1${creditsUrl("en")}`);
    // A language's card lists the home page's own language first.
    expect(home.querySelector(".hm-card .hm-chip")?.getAttribute("hreflang")).toBe(e);
  });
  test("the missing page leads up and to every language's home page, its own first", async () => {
    const doc = await readPage(file(notFoundUrl(e)));
    expect(doc.documentElement.getAttribute("lang")).toBe(e);
    expect(doc.documentElement.hasAttribute("data-frame")).toBe(true);
    expect(doc.querySelector(".pg-up")?.getAttribute("href")).toBe(homeUrl(e));
    const chips = [...doc.querySelectorAll(".nf-chip")].map((a) => a.getAttribute("hreflang"));
    expect(chips).toEqual([e, ...ENABLED_EXPLAIN.filter((x) => x !== e)]);
    expect(doc.querySelector(".nf-chip.here")?.getAttribute("href")).toBe(homeUrl(e));
  });
});

test("on phones the up link leads a topic to its track's index, named by its language, the index to Home, and Home nowhere", async () => {
  const up = async (path: string): Promise<[string | null, string | null] | null> => {
    const link = (await readPage(path)).querySelector(".crumbs .up-link");
    return link === null ? null : [link.getAttribute("href"), link.querySelector("span")?.textContent ?? null];
  };
  expect(await up("en/english/verbs/to-be/index.html")).toEqual(["/en/english/", "English"]);
  // The track's index draws its own up button, to Home.
  const index = (await readPage("uk/spanish/index.html")).querySelector(".ix-up");
  expect([index?.getAttribute("href"), index?.getAttribute("aria-label")]).toEqual(["/uk/", SITE.name]);
  expect(await up("index.html")).toBeNull();
});
