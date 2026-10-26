// The study path in a browser: the course index's order switch shows one order and keeps it on the topic pages; on
// the study path the level filter hides the levels above it, the study path marks the step being read, and Up next
// leads to the step after it.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { LEVELS } from "../../scripts/lib.ts";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
// Each test opens several pages; a cold browser can take seconds to start.
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const open = (address: string): Promise<unknown> => page.goto(new URL(address, base).href);
const shown = (selector: string): Promise<boolean> => page.locator(selector).first().isVisible();
// Chooses an order in the course's index.
async function chooseOrder(order: string): Promise<void> {
  await open("/en/english/");
  await page.click(`.ix-seg [data-set-order="${order}"]`);
}
// Chooses a level in the popover the tools' Level button opens.
async function chooseLevel(code: string): Promise<void> {
  await page.click('.sp-tools [popovertarget="lv-pop"]');
  await page.click(`#lv-pop [data-set-level="${code}"]`);
}
// The study path's visible rows, by level.
const rows = (): Promise<string[]> =>
  page.$$eval(".tp-path-row", (els) => els.filter((el) => el.checkVisibility()).map((el) => el.getAttribute("data-level") ?? ""));
// The address a link opens: its href, with ?step= from data-path-step as the reader's click adds it.
const opens = (a: Element): string => {
  const url = new URL(a.getAttribute("href") ?? "", location.href);
  const step = a.getAttribute("data-path-step");
  if (step !== null) url.searchParams.set("step", step);
  return url.pathname + url.search + url.hash;
};
const current = (): Promise<string> =>
  page.locator('.tp-path-row[aria-current="step"]').evaluate((row) => row.getAttribute("data-level") ?? "");
// Where the visible Up next leads, and what its caption says.
const next = (): Promise<string> => page.locator(".tp-end .up-next:visible a.next").evaluate(opens);
const caption = (): Promise<string> =>
  page
    .locator(".tp-end .up-next:visible .tp-caps")
    .textContent()
    .then((text) => text ?? "");

test(
  "the order the index shows is the order Up next follows on a topic page",
  async () => {
    await chooseOrder("categories");
    await open("/en/english/verbs/to-be/?level=a1");
    expect(await next()).toBe("/en/english/verbs/irregular-verbs-table/");
    await chooseOrder("path");
    expect(await shown('.ix-flow[data-order="path"]')).toBe(true);
    await open("/en/english/verbs/to-be/?level=a1");
    expect(await next()).toBe("/en/english/tenses/simple-tenses/?step=a1");
    expect(await page.locator('.tp-end .up-next[data-order="categories"]:visible').count()).toBe(0);
  },
  SLOW,
);

test(
  "at A0 the study path lists the A0 row alone",
  async () => {
    await open("/en/english/verbs/to-be/?level=a0");
    expect(await rows()).toEqual(["A0"]);
    await open("/en/english/verbs/to-be/?level=a1");
    expect(await rows()).toEqual(["A0", "A1"]);
  },
  SLOW,
);

test(
  "without a step in the address, the step being read is the highest the level filter shows",
  async () => {
    await open("/en/english/verbs/to-be/?level=a0");
    await chooseOrder("path");
    await open("/en/english/verbs/to-be/?level=a0");
    expect(await current()).toBe("A0");
    expect(await next()).toBe("/en/english/sentence-building/word-order/?step=a0");
    await chooseLevel("A1");
    expect(await current()).toBe("A1");
    expect(await next()).toBe("/en/english/tenses/simple-tenses/?step=a1");
  },
  SLOW,
);

test(
  "a step opened from the index stays the step being read at any level above it",
  async () => {
    await chooseOrder("path");
    await open("/en/english/?level=b2");
    // The first step of a topic, below its later steps; on a phone's width a link leads to the page, where a wide screen
    // opens the topic in the split view's right pane.
    await page.setViewportSize({ width: 800, height: 1000 });
    await page.click('.ix-flow[data-order="path"] li[data-level="A0"] a[href^="/en/english/verbs/to-be/"]');
    await page.waitForURL(/step=a0/);
    await page.setViewportSize({ width: 1600, height: 1000 });
    expect(await current()).toBe("A0");
    expect(await next()).toBe("/en/english/sentence-building/word-order/?step=a0");
    // Two steps that open the same section; a filter below the step shows the highest step it leaves.
    await open("/en/english/?level=b2");
    await page.setViewportSize({ width: 800, height: 1000 });
    await page.click('.ix-flow[data-order="path"] li[data-level="B1"] a[href^="/en/english/verbs/irregular-verbs-table/"]');
    await page.waitForURL(/step=b1/);
    await page.setViewportSize({ width: 1600, height: 1000 });
    expect(await current()).toBe("B1");
    await chooseLevel("A1");
    expect(await current()).toBe("A1");
  },
  SLOW,
);

test(
  "a study-path link opens its topic at its step",
  async () => {
    await chooseOrder("path");
    await open("/en/english/verbs/to-be/?level=a1");
    await page.click('.tp-path-row[data-level="A0"] .tp-nx');
    await page.waitForURL(/word-order\/\?step=a0/);
    expect(await current()).toBe("A0");
  },
  SLOW,
);

test(
  "with the level filter on, Up next moves through the pages it shows and starts over after the last",
  async () => {
    await chooseOrder("categories");
    await open("/en/english/sentence-building/word-order/?level=a0");
    expect(await caption()).toBe("Start over");
    expect(await next()).toBe("/en/english/foundations/alphabet-spelling/");
    await open("/en/english/foundations/alphabet-spelling/?level=a0");
    expect(await caption()).toBe("Up next");
    expect(await next()).toBe("/en/english/foundations/pronunciation-ipa/");
    await chooseOrder("path");
    await open("/en/english/foundations/telling-time/?step=a0&level=a0");
    expect(await caption()).toBe("Start over");
    expect(await next()).toBe("/en/english/foundations/alphabet-spelling/?step=a0");
    // A higher level lets the path go on.
    await chooseLevel("A1");
    expect(await next()).toBe("/en/english/foundations/pronunciation-ipa/?step=a1#consonant-sounds");
  },
  SLOW,
);

test(
  "at every level, the top level included, a page shows one Up next",
  async () => {
    for (const order of ["categories", "path"]) {
      await chooseOrder(order);
      for (const level of LEVELS) {
        await open(`/en/english/tenses/tense-map/?level=${level.toLowerCase()}`);
        const count = await page.$$eval(".tp-end .up-next", (els) => els.filter((el) => el.checkVisibility()).length);
        expect({ order, level, count }).toEqual({ order, level, count: 1 });
      }
    }
  },
  SLOW,
);
