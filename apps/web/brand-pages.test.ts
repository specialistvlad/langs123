// A brand's pages (brand.ts): each appears in every explanation language at /{slug}/ in the credits' layout, with
// its title row, its body, its alternates and a sitemap entry; an address the site already uses is refused.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { ENABLED_EXPLAIN, ROOT } from "../../scripts/lib.ts";
import { build } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { creditsUrl, pageUrl } from "./urls.ts";

const out = join(ROOT, "build", "test", "brand-pages");
const options = (pages: { slug: string }[]): Parameters<typeof build>[0] => ({
  outDir: out,
  dev: false,
  siteUrl: "http://127.0.0.1",
  sample: { topics: SAMPLE.topics.slice(0, 1), explain: ["en"] },
  brand: {
    mark: () => "",
    pages: pages.map((p, i) => ({
      slug: p.slug,
      title: (e) => `Title ${String(i)} ${e}`,
      ...(i === 0 ? { description: (e: string) => `About ${e}`, menu: { glyph: "hand" as const } } : {}),
      body: (e) => `<p class="cr-lead">Body ${String(i)} ${e}</p>`,
    })),
  },
});
const facts = await build(options([{ slug: "terms" }, { slug: "data-use" }]));
const read = async (path: string): Promise<Document> => parseHTML(await Bun.file(join(out, path, "index.html")).text()).document;

test("a page appears in every explanation language at the credits' kind of address, with its title row and body", async () => {
  expect(ENABLED_EXPLAIN.length).toBeGreaterThan(1);
  for (const [i, e] of ENABLED_EXPLAIN.entries()) {
    const url = pageUrl(e, "terms");
    expect(url).toBe(i === 0 ? "/terms/" : `/${e}/terms/`);
    const doc = await read(url);
    expect(doc.documentElement.getAttribute("lang")).toBe(e);
    expect(doc.querySelector(".cr-main .cr-head .pg-up")?.getAttribute("href")).toBe(i === 0 ? "/" : `/${e}/`);
    expect(doc.querySelector(".cr-main .cr-head h1.cr-heading")?.textContent).toBe(`Title 0 ${e}`);
    expect(doc.querySelector(".cr-main .cr-lead")?.textContent).toBe(`Body 0 ${e}`);
    expect(doc.querySelector("title")?.textContent).toMatch(new RegExp(`^Title 0 ${e} — `));
    expect(doc.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(`About ${e}`);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`http://127.0.0.1${url}`);
    const alternates = [...doc.querySelectorAll('link[rel="alternate"]')].map((a) => a.getAttribute("hreflang"));
    expect(alternates).toEqual([...ENABLED_EXPLAIN, "x-default"]);
  }
});

test("a page without a description uses its title, and every page is in the facts and the sitemap", async () => {
  const doc = await read("data-use");
  expect(doc.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Title 1 en");
  const own = facts.filter((f) => f.kind === "page" && !f.path.includes("/languages/"));
  expect(own.map((f) => f.path)).toEqual(["terms", "data-use"].flatMap((slug) => ENABLED_EXPLAIN.map((e) => pageUrl(e, slug))));
  expect(own.every((f) => f.sitemap && f.alternates.length === ENABLED_EXPLAIN.length + 1)).toBe(true);
});

test("a page with a menu entry follows the credits in the Home's More menu, and a page without one is left out; the pages themselves carry no toolbar", async () => {
  for (const [i, e] of ENABLED_EXPLAIN.entries()) {
    const home = await read(i === 0 ? "" : e);
    const url = pageUrl(e, "terms");
    const more = [...home.querySelectorAll("#hm-more [data-panel=main] a.ix-item")];
    expect(more.map((a) => a.getAttribute("href"))).toEqual([pageUrl(e, "languages"), creditsUrl(e), url]);
    expect(more[2]?.querySelector(".ix-title")?.textContent).toBe(`Title 0 ${e}`);
    expect(more[2]?.querySelector(".ix-end svg path")).not.toBeNull();
    expect(home.querySelectorAll("a.hm-page, .hm-credits")).toHaveLength(0);
  }
  expect((await read("data-use")).getElementById("hm-more")).toBeNull();
});

const refusal = (pages: { slug: string }[]): Promise<string> =>
  build(options(pages)).then(
    () => "built",
    (error: unknown) => (error instanceof Error ? error.message : ""),
  );

test("an address that is not a lowercase segment, is the credits' or repeats is refused", async () => {
  for (const slug of ["Terms", "a/b", "credits", "languages"]) expect(await refusal([{ slug }])).toContain(`"${slug}"`);
  expect(await refusal([{ slug: "terms" }, { slug: "terms" }])).toContain('"terms"');
});
