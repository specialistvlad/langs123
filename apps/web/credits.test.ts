// The credits live on one page: every page's top bar links to it, no page has a footer, and the credits
// page names the content's authors, both licences, the credit line and the ways to contribute.
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { ENABLED_EXPLAIN, type Explain, SITE, say } from "../../scripts/lib.ts";
import { ui } from "./ui.ts";
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
  const hrefs = [...doc.querySelectorAll(".cr-main a")].map((a) => a.getAttribute("href") ?? "");
  const { content, code } = SITE.licences;
  expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("http://127.0.0.1/credits/");
  expect(doc.querySelector(`.cr-main a[href="${SITE.repository}/graphs/contributors"]`)?.textContent).toBe(SITE.credit);
  expect(doc.querySelector('.cr-main a[rel="license"]')?.getAttribute("href")).toBe(content.url);
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
    // A language's card lists the home page's own language first, when the course is written for it.
    const chips = [...(home.querySelector(".hm-card")?.querySelectorAll(".hm-chip") ?? [])].map((c) => c.getAttribute("hreflang"));
    expect(chips[0]).toBe(chips.includes(e) ? e : chips[0]);
  });
  test("the missing page leads up and to every language's home page, its own first", async () => {
    const doc = await readPage(file(notFoundUrl(e)));
    expect(doc.documentElement.getAttribute("lang")).toBe(e);
    expect(doc.querySelector(".nf-heading")?.textContent).toBe(say("notFound", e));
    expect(doc.documentElement.hasAttribute("data-frame")).toBe(true);
    expect(doc.querySelector(".pg-up")?.getAttribute("href")).toBe(homeUrl(e));
    const chips = [...doc.querySelectorAll(".nf-chip")].map((a) => a.getAttribute("hreflang"));
    expect(chips).toEqual([e, ...ENABLED_EXPLAIN.filter((x) => x !== e)]);
    expect(doc.querySelector(".nf-chip.here")?.getAttribute("href")).toBe(homeUrl(e));
  });
});

test("the up link leads a topic to the track's index, named by its language, the index to Home, and Home nowhere", async () => {
  // A topic draws its own up button, to its track's index named by its language.
  const topic = (await readPage("en/english/verbs/to-be/index.html")).querySelector(".tp-up");
  expect([topic?.getAttribute("href"), topic?.getAttribute("aria-label")]).toEqual(["/en/english/", "English"]);
  // The track's index draws its own up button, to Home.
  const index = (await readPage("uk/spanish/index.html")).querySelector(".ix-up");
  expect([index?.getAttribute("href"), index?.getAttribute("aria-label")]).toEqual(["/uk/", SITE.name]);
  // Home has no up link.
  expect((await readPage("index.html")).querySelector(".tp-up, .ix-up, .pg-up")).toBeNull();
});

describe.each(ENABLED_EXPLAIN)("the credits page in %s", (e) => {
  test("is a page of its own: one column, Home beside the heading, no split view and no Close", async () => {
    const doc = await readPage(`${creditsUrl(e).slice(1)}index.html`);
    const t = ui(e);
    expect(doc.querySelector(".sp, .sp-left, .sp-right, [data-sp-fragment], [data-sp-close], .sp-x")).toBeNull();
    const head = doc.querySelector("main.cr-main > .cr-head");
    expect([...(head?.children ?? [])].map((el) => el.tagName)).toEqual(["A", "H1"]);
    expect([head?.querySelector(".pg-up")?.getAttribute("href"), head?.querySelector(".pg-up")?.getAttribute("aria-label")]).toEqual([
      homeUrl(e),
      t.backHome,
    ]);
    expect(head?.querySelector("h1")?.textContent).toBe(say("credits", e));
  });
  test("opens with the app card, then the website row and the four groups", async () => {
    const doc = await readPage(`${creditsUrl(e).slice(1)}index.html`);
    const parts = [...doc.querySelectorAll("main.cr-main > *")].map((el) => el.className.split(" ").slice(0, 2).join(" "));
    expect(parts.slice(0, 2)).toEqual(["cr-head", "cr-card cr-app"]);
    expect(parts).toContain("cr-card cr-links");
    expect(doc.querySelector(".cr-app .cr-name")?.textContent).toBe(SITE.name);
    expect(doc.querySelector(".cr-links .cr-row")?.getAttribute("href")).toBe(SITE.url);
    expect(doc.querySelectorAll("main.cr-main > .cr-h2").length).toBe(4);
  });
});
