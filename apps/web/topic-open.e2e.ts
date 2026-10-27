// A topic chosen in the course index: the topic's page keeps the course's topics column, the topic marked in it and its
// row in view, the reading at the right; another topic of the column opens its own page.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1440, height: 700 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

test(
  "a topic chosen in the index opens its page with the column kept, the topic marked and in view, and the reading at the right",
  async () => {
    await page.goto(new URL("/en/english/", base).href);
    expect(await page.locator(".cl-choose").isVisible()).toBe(true);
    await page.locator('.cl-side a.ix-cover[href="/en/english/verbs/to-be/"]').first().click();
    await page.waitForURL((url) => url.pathname === "/en/english/verbs/to-be/");
    expect(await page.locator(".cl-main .tp-wrap").isVisible()).toBe(true);
    const row = page.locator('.ix-flow[data-order="categories"] li[data-current]');
    expect(await row.count()).toBe(1);
    expect(await row.locator("a[aria-current='true']").count()).toBe(1);
    const at = await row.boundingBox();
    const column = await page.locator(".cl-side").boundingBox();
    expect(at?.y ?? 0).toBeGreaterThanOrEqual(column?.y ?? 0);
    expect((at?.y ?? 0) + (at?.height ?? 0)).toBeLessThanOrEqual((column?.y ?? 0) + (column?.height ?? 0) + 1);
    // The head and the field stay in view above the topics.
    expect(await page.locator(".cl-home").isVisible()).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    // Another topic of the column opens its own page.
    await page.locator('.cl-side a.ix-cover[href="/en/english/verbs/irregular-verbs-table/"]').first().click();
    await page.waitForURL((url) => url.pathname === "/en/english/verbs/irregular-verbs-table/");
    expect(await page.locator("li[data-current] a").first().getAttribute("href")).toBe("/en/english/verbs/irregular-verbs-table/");
  },
  SLOW,
);

test(
  "the grouping chosen in the index is the one the topic page's column shows, the topic marked in it",
  async () => {
    await page.goto(new URL("/en/english/", base).href);
    await page.click(".cl-tools .ix-group");
    await page.click('#ix-groups [data-set-order="path"]');
    await page.locator('.ix-flow[data-order="path"] a.ix-cover').first().click();
    await page.waitForURL((url) => url.pathname.startsWith("/en/english/"));
    expect(await page.evaluate(() => document.documentElement.dataset["order"])).toBe("path");
    expect(await page.locator('.ix-flow[data-order="path"] li[data-current]').first().isVisible()).toBe(true);
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
  SLOW,
);
