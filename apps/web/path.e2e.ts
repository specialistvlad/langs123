// The study path in a browser: the order switch shows one order and keeps it from page to page, in the
// menu of a topic page and in the track index; on the study path the level filter hides the levels
// above it, the menu marks the step being read, and Up next leads to the step after it.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "playwright";
import { LEVELS, loadCurriculum } from "../../scripts/lib.ts";
import { SITE_DIR, testSite } from "./test-site.ts";

await testSite();
// Each test opens several pages; a cold browser can take seconds to start.
const SLOW = 30_000;
const path = (await loadCurriculum()).languages[0]?.path ?? {};
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: (req) => {
    const file = decodeURIComponent(new URL(req.url).pathname);
    return new Response(Bun.file(join(SITE_DIR, file.endsWith("/") ? `${file}index.html` : file)));
  },
});
let browser: Browser;
let page: Page;
beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
}, SLOW);
afterAll(async () => {
  await browser.close();
  await server.stop();
});

const open = (address: string): Promise<unknown> => page.goto(new URL(address, server.url).href);
// The menu sits on the topic pages; the track page holds the index alone.
const TOPIC = "/en/english/foundations/alphabet-spelling/";
const shown = (selector: string): Promise<boolean> => page.locator(selector).first().isVisible();
// Chooses a level in the panel its chip opens.
async function chooseLevel(code: string): Promise<void> {
  await page.click('.topbar [popovertarget="level-panel"]');
  await page.click(`#level-panel [data-set-level="${code}"]`);
}
// The menu's visible study-path entries: each heading's level, and each step's level and link.
const menu = (): Promise<string[]> =>
  page.$$eval('.nav-list[data-order="path"] :is(h4, a)', (els) =>
    els.filter((el) => el.checkVisibility()).map((el) => `${el.tagName === "H4" ? "#" : ""}${el.getAttribute("data-level") ?? ""}`),
  );
// The address a link opens: its href, with ?step= from data-path-step as the reader's click adds it.
const opens = (a: Element): string => {
  const url = new URL(a.getAttribute("href") ?? "", location.href);
  const step = a.getAttribute("data-path-step");
  if (step !== null) url.searchParams.set("step", step);
  return url.pathname + url.search + url.hash;
};
const current = (): Promise<string> => page.$eval('.nav-list[data-order="path"] [aria-current="step"]', opens);
const next = (): Promise<string> => page.locator('.up-next[data-order="path"]:visible a.next').evaluate(opens);

test(
  "the switch shows one order and keeps it from page to page",
  async () => {
    await open(TOPIC);
    expect(await shown('.nav-list[data-order="categories"]')).toBe(true);
    expect(await shown('.nav-list[data-order="path"]')).toBe(false);
    await page.click('.nav-order [data-set-order="path"]');
    expect(await shown('.nav-list[data-order="categories"]')).toBe(false);
    await open("/en/english/");
    expect(await shown('.index-grid[data-order="path"]')).toBe(true);
    expect(await shown('.index-grid[data-order="categories"]')).toBe(false);
    expect(await page.locator('.index-order [data-set-order="path"]').getAttribute("class")).toBe("on");
    await open("/en/english/verbs/to-be/");
    expect(await shown('.nav-list[data-order="path"]')).toBe(true);
    expect(await page.locator('.nav-order [data-set-order="path"]').getAttribute("class")).toBe("on");
  },
  SLOW,
);

test(
  "at A0 the menu lists the A0 steps alone",
  async () => {
    await open(`${TOPIC}?level=a0`);
    await page.click('.nav-order [data-set-order="path"]');
    expect(await menu()).toEqual(["#A0", ...(path["A0"] ?? []).map(() => "A0")]);
  },
  SLOW,
);

test(
  "without a step in the address, the step being read is the highest the level filter shows",
  async () => {
    await open("/en/english/verbs/to-be/?level=a0");
    await page.click('.nav-order [data-set-order="path"]');
    expect(await current()).toBe("/en/english/verbs/to-be/?step=a0");
    expect(await next()).toBe("/en/english/sentence-building/word-order/?step=a0");
    await chooseLevel("A1");
    expect(await current()).toBe("/en/english/verbs/to-be/?step=a1#past-was-and-were");
    expect(await next()).toBe("/en/english/tenses/simple-tenses/?step=a1");
  },
  SLOW,
);

test(
  "a step opened from the menu stays the step being read at any level above it",
  async () => {
    await open(`${TOPIC}?level=b2`);
    await page.click('.nav-order [data-set-order="path"]');
    // The first step of a topic, below its later steps.
    await page.click('.nav-list[data-order="path"] a[data-level="A0"][href^="/en/english/verbs/to-be/"]');
    expect(await current()).toBe("/en/english/verbs/to-be/?step=a0");
    expect(await next()).toBe("/en/english/sentence-building/word-order/?step=a0");
    // Two steps that open the same section.
    await page.click('.nav-list[data-order="path"] a[data-level="B1"][href^="/en/english/verbs/irregular-verbs-table/"]');
    expect(await current()).toMatch(/^\/en\/english\/verbs\/irregular-verbs-table\/\?step=b1/);
    await page.click('.nav-list[data-order="path"] a[data-level="A2"][href^="/en/english/verbs/irregular-verbs-table/"]');
    expect(await current()).toMatch(/^\/en\/english\/verbs\/irregular-verbs-table\/\?step=a2/);
    // A filter below the step shows the highest step it leaves.
    await chooseLevel("A1");
    expect(await current()).toBe("/en/english/verbs/irregular-verbs-table/?step=a1");
  },
  SLOW,
);

test(
  "with the level filter on, previous and next move through the pages it shows and start over after the last",
  async () => {
    // The visible row below the guide: its previous and next, as label and link.
    const row = async (): Promise<string[]> =>
      page.$$eval(".pagers.bottom .pager-prev, .pagers.bottom .pager-next", (els) =>
        els
          .filter((el) => el.checkVisibility())
          .map((el) => {
            const href = el.getAttribute("href");
            const url = new URL(href ?? "", location.href);
            const step = el.getAttribute("data-path-step");
            if (step !== null) url.searchParams.set("step", step);
            return `${el.querySelector(".dir")?.textContent ?? ""} ${href === null ? "off" : url.pathname + url.search + url.hash}`;
          }),
      );
    await open("/en/english/sentence-building/word-order/?level=a0");
    await page.click('.nav-order [data-set-order="categories"]');
    expect(await row()).toEqual(["← Previous /en/english/verbs/to-be/", "Start over ↺ /en/english/foundations/alphabet-spelling/"]);
    await open("/en/english/foundations/alphabet-spelling/?level=a0");
    expect(await row()).toEqual(["← Previous off", "Next → /en/english/foundations/pronunciation-ipa/"]);
    await page.click('.nav-order [data-set-order="path"]');
    await open("/en/english/foundations/telling-time/?step=a0&level=a0");
    expect(await row()).toEqual([
      "← Previous /en/english/foundations/days-months-dates/?step=a0",
      "Start over ↺ /en/english/foundations/alphabet-spelling/?step=a0",
    ]);
    // A higher level lets the path go on.
    await chooseLevel("A1");
    expect((await row())[1]).toBe("Next → /en/english/foundations/pronunciation-ipa/?step=a1#consonant-sounds");
  },
  SLOW,
);

test(
  "at every level, the top level included, a page shows one row of previous and next below the guide and one Up next",
  async () => {
    // How many of each show: the row below the guide, and Up next in the rail.
    const counts = (): Promise<number[]> =>
      page.$$eval(".pagers.bottom .pager, .up-next", (els) =>
        [".pagers.bottom .pager", ".up-next"].map((s) => els.filter((el) => el.matches(s) && el.checkVisibility()).length),
      );
    for (const order of ["categories", "path"]) {
      await open(TOPIC);
      await page.click(`.nav-order [data-set-order="${order}"]`);
      for (const level of LEVELS) {
        await open(`/en/english/tenses/tense-map/?level=${level.toLowerCase()}`);
        expect({ order, level, counts: await counts() }).toEqual({ order, level, counts: [1, 1] });
      }
    }
  },
  SLOW,
);
