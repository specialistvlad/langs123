// The new library's reading in a browser, over the samples built as a v1 preview builds them (drafts in): one, two and three
// languages in their forms by the width rule, the reader's choice kept across loads (gate 4a check 2 of M5); the errors of
// the reader's languages' speakers alone (3); a wide table split on a phone and opened whole and fitted in Full screen (4); the
// picture drawn from its data with its alt text in light and dark (5); every language in the same form (8).
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import { shared } from "./browser.ts";
import { build } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { served } from "./serve.ts";
import { SITE_DIR } from "./test-site.ts";
import { token } from "./tokens.ts";

const DIR = `${SITE_DIR}-reading`;
await build({ outDir: DIR, dev: true, siteUrl: "http://127.0.0.1", sample: SAMPLE, library: "v1", root: SAMPLES_ROOT });
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: async (req) => {
    const answer = await served(DIR, decodeURIComponent(new URL(req.url).pathname));
    if (answer.status === 301) return new Response(null, { status: 301, headers: { Location: answer.location } });
    return new Response(Bun.file(answer.file), { status: answer.status });
  },
});
const { browser } = await shared();
const SLOW = 30_000;
const contexts: BrowserContext[] = [];
afterAll(async () => {
  for (const c of contexts) await c.close();
  await server.stop(true);
});

// A page of a reader who knows these languages, at a width, in a theme.
async function reader(langs: string, width: number, dark = false): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: dark ? "dark" : "light",
    isMobile: width < 500,
  });
  contexts.push(context);
  await context.addInitScript((l) => {
    if (sessionStorage.getItem("set") === null) {
      localStorage.setItem("ln-langs", l);
      sessionStorage.setItem("set", "1");
    }
  }, langs);
  return context.newPage();
}
const open = async (page: Page, path: string): Promise<void> => {
  await page.goto(new URL(path, server.url).href);
  await page.locator("#rd .rd-form").waitFor();
};
const tabs = (page: Page): Promise<string[]> =>
  page.locator("#rd .rd-seg [role=tab]").evaluateAll((all) => all.map((b) => b.getAttribute("data-form") ?? ""));
const PRESENT = "/uk/english/v1/present-simple/";
const PLACE = "/uk/english/v1/words-of-place/";

test(
  "one language reads with no switch; two take side by side from a 640 column; three take it once the panes give way",
  async () => {
    const one = await reader("uk", 1440);
    await open(one, PRESENT);
    expect(await tabs(one)).toEqual([]);
    const two = await reader("uk ja", 1440);
    await open(two, PRESENT);
    expect(await tabs(two)).toEqual(["interleaved", "reveal", "side"]);
    expect(await two.locator('#rd .rd-lang[lang="ja"]').count()).toBeGreaterThan(0);
    const phone = await reader("uk ja en", 402);
    await open(phone, PRESENT);
    expect(await tabs(phone)).toEqual(["interleaved", "reveal"]);
    const three = await reader("uk ja en", 1440);
    await open(three, PRESENT);
    await three.locator('#rd [data-form="side"][role=tab]').click();
    await three.locator("#rd .rd-lgrid.rd-l3").waitFor();
    expect(await three.locator(".cl-side").isVisible()).toBe(false);
    expect(await three.locator("#rd").evaluate((el) => el.clientWidth)).toBeGreaterThan(1000);
  },
  SLOW,
);

test(
  "the reader's form stays across loads, and a layer's control opens its other languages under the block",
  async () => {
    const page = await reader("uk ja", 1440);
    await open(page, PRESENT);
    await page.locator('#rd [data-form="reveal"][role=tab]').click();
    await page.reload();
    await page.locator('#rd .rd-form[data-form="reveal"]').waitFor();
    const more = page.locator("#rd .rd-more").first();
    await more.click();
    expect(await more.getAttribute("aria-expanded")).toBe("true");
    expect(await page.locator("#rd .rd-rv-open").first().isVisible()).toBe(true);
    await page.locator('#rd [data-form="side"][role=tab]').click();
    await page.reload();
    await page.locator("#rd .rd-lgrid.rd-l2").waitFor();
  },
  SLOW,
);

test(
  "a reader sees only the errors of their languages' speakers",
  async () => {
    const uk = await reader("uk", 1440);
    await open(uk, PLACE);
    expect(await uk.locator("#rd .rd-err").count()).toBe(1);
    const both = await reader("uk es", 1440);
    await open(both, PLACE);
    expect(await both.locator("#rd .rd-err").count()).toBe(5);
    const heads = await both.locator("#rd .rd-err-why li").evaluateAll((all) => all.map((li) => li.getAttribute("data-speakers")));
    expect(new Set(heads)).toEqual(new Set(["uk", "es"]));
  },
  SLOW,
);

test(
  "a wide table splits on a phone, Full screen opens it whole and Close returns, and it stands whole on a desktop",
  async () => {
    const phone = await reader("uk", 402);
    await open(phone, PRESENT);
    const button = phone.locator("#rd [data-full]").first();
    const id = await button.getAttribute("data-full");
    const groups = await phone.locator(`#rd .rd-card-s:has([data-full="${id ?? ""}"]) > .lx-tcard`).count();
    expect(groups).toBeGreaterThan(1);
    await button.click();
    const dialog = phone.locator(`[id="full-${id ?? ""}"]`);
    expect(await dialog.evaluate((d) => (d as HTMLDialogElement).open)).toBe(true);
    const columns = await dialog.locator("thead th").count();
    expect(columns).toBeGreaterThan(
      await phone
        .locator(`#rd .rd-card-s:has([data-full="${id ?? ""}"]) > .lx-tcard`)
        .first()
        .locator("thead th")
        .count(),
    );
    expect(await dialog.locator(".rd-fs-t").textContent()).not.toBe("");
    // Fitted: the whole table stands within the sheet's body; a tap shows it at its own size, wider than the body.
    const body = dialog.locator(".rd-fs-body");
    const room = await body.evaluate((b) => b.clientWidth);
    expect(await dialog.locator(".rd-fit").evaluate((f) => f.getBoundingClientRect().width)).toBeLessThanOrEqual(room);
    await dialog.locator(".rd-fit").click();
    expect(await body.evaluate((b) => b.scrollWidth > b.clientWidth)).toBe(true);
    await dialog.locator(".rd-fs-bar button").click();
    expect(await dialog.evaluate((d) => (d as HTMLDialogElement).open)).toBe(false);
    const wide = await reader("uk", 2560);
    await open(wide, PRESENT);
    expect(await wide.locator("#rd [data-full]").count()).toBe(0);
  },
  SLOW,
);

test(
  "the picture draws its 15 cells from the data, each with its alt text, the figure in the accent in light and dark",
  async () => {
    for (const dark of [false, true]) {
      const page = await reader("uk", 1440, dark);
      await open(page, PLACE);
      expect(await page.locator("#rd .rd-cell svg[role=img]").count()).toBe(15);
      expect(await page.locator("#rd .rd-cell svg").first().getAttribute("aria-label")).toMatch(/^The ball is in the box\. · /);
      const fill = await page
        .locator("#rd .rd-cell svg circle")
        .first()
        .evaluate((c) => getComputedStyle(c).fill);
      const hex = token("accent", dark ? "dark" : "light");
      const rgb = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)).join(", ");
      expect(fill).toBe(`rgb(${rgb})`);
    }
  },
  SLOW,
);

test(
  "every language reads in the same form, the reviewed and the unreviewed alike, with no note on either",
  async () => {
    const page = await reader("uk ja", 1440);
    await open(page, PRESENT);
    const forms = await page.locator("#rd .rd-lang[lang]").evaluateAll((all) => [...new Set(all.map((el) => el.getAttribute("lang")))]);
    expect(forms).toEqual(["ja"]);
    expect(await page.locator("#rd [class*=review], #rd [data-review]").count()).toBe(0);
    const head = page.locator("#rd .rd-head .lx-lead");
    expect(await head.getAttribute("class")).toBe("lx-lead");
  },
  SLOW,
);
