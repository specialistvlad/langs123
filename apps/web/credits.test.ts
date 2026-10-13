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
async function topBar(path: string): Promise<{ lang: Explain; doc: Document; footer: boolean }> {
  const html = await Bun.file(join(SITE_DIR, path)).text();
  const start = html.indexOf('<header class="topbar"');
  const bar = start < 0 ? "" : html.slice(start, html.indexOf("</header>", start) + "</header>".length);
  const lang = (/<html lang="([a-z]+)"/.exec(html)?.[1] ?? "") as Explain;
  return { lang, doc: parseHTML(`<html><body>${bar}</body></html>`).document, footer: /<footer[\s>]/.test(html) };
}

describe.each(pages)("%s", (path) => {
  test("the top bar links to the credits page beside the theme switch, and the page has no footer", async () => {
    const { lang, doc, footer } = await topBar(path);
    const credits = creditsUrl(lang);
    const tools = [...doc.querySelectorAll(".topbar .tools > *")].map((el) => el.getAttribute("href") ?? el.id);
    expect(tools).toEqual([credits, "theme"]);
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
    // The matrix's first column is the home page's own language.
    expect(home.querySelector("table.matrix tbody td a")?.getAttribute("hreflang")).toBe(e);
  });
  test("the missing page leads back to the home page in the language", async () => {
    const doc = await readPage(file(notFoundUrl(e)));
    expect(doc.documentElement.getAttribute("lang")).toBe(e);
    expect([...doc.querySelectorAll("main a")].map((a) => a.getAttribute("href"))).toContain(homeUrl(e));
  });
});
