// The Home's controls: the theme chosen in the More menu keeps its choice for the next page.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1600, height: 800 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const choose = async (theme: string): Promise<void> => {
  await page.click(".hm-more");
  await page.click('#hm-more [data-more="theme"]');
  await page.click(`#hm-more [data-set-theme="${theme}"]`);
};

test(
  "the theme in the More menu sets the theme, ticks it, and the next page keeps it",
  async () => {
    await page.goto(new URL("/", base).href);
    await choose("dark");
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    expect(await page.locator('#hm-more [data-set-theme="dark"]').getAttribute("aria-checked")).toBe("true");
    await page.goto(new URL("/en/english/", base).href);
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    await page.goto(new URL("/", base).href);
    await choose("auto");
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBeUndefined();
  },
  SLOW,
);
