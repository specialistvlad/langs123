// The Home's controls: the theme menu in the right pane's tools keeps its choice for the next page, and a first visit
// opens in the browser's language until the reader chooses one in Read in.
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

test(
  "the theme menu sets the theme, ticks it, and the next page keeps it",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.click(".sp-tools .hm-theme");
    await page.click('#hm-themes [data-set-theme="dark"]');
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    expect(await page.locator('#hm-themes [data-set-theme="dark"]').getAttribute("aria-checked")).toBe("true");
    await page.goto(new URL("/en/english/", base).href);
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    await page.goto(new URL("/", base).href);
    await page.click(".sp-tools .hm-theme");
    await page.click('#hm-themes [data-set-theme="auto"]');
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBeUndefined();
  },
  SLOW,
);

test(
  "a first visit opens Home in the browser's language, until the reader chooses one in Read in",
  async () => {
    const context = await browser.newContext({ locale: "uk-UA", viewport: { width: 1600, height: 800 } });
    const visit = await context.newPage();
    await visit.goto(new URL("/", base).href);
    await visit.waitForURL((url) => url.pathname === "/uk/");
    expect(await visit.evaluate(() => document.documentElement.lang)).toBe("uk");
    await visit.click(".sp-tools .hm-read summary");
    await visit.click('.sp-tools .hm-read [data-read="en"]');
    await visit.waitForURL((url) => url.pathname === "/");
    await visit.goto(new URL("/", base).href);
    expect(new URL(visit.url()).pathname).toBe("/");
    await context.close();
  },
  SLOW,
);
