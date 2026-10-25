// The Home's menus in a browser. On a phone Read in stays and More takes the theme's and the credits' place: More's
// menu names the two, the theme opens its list in its place under a way back, and a theme chosen closes it, which
// opens again naming the theme chosen. Read in ticks the language read in. Wide screens keep the theme and the
// credits. A query hides the page's header; an empty search keeps it.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 402, height: 874 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const visible = (selector: string): Promise<boolean> => page.locator(selector).first().isVisible();

test(
  "on a phone Read in stays beside More, whose menu holds the theme and the credits",
  async () => {
    await page.goto(new URL("/", base).href);
    expect(await Promise.all([".hm-read summary", ".hm-more", ".hm-folds .hm-theme", ".hm-folds .hm-credits"].map(visible))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    await page.locator(".hm-more").click();
    await page.waitForSelector('.hm-more[aria-expanded="true"]');
    expect(await page.locator('#hm-more [data-panel="main"] .ix-title').allTextContents()).toEqual(["Theme", "Credits"]);
    await page.locator('#hm-more [data-more="theme"]').click();
    expect([await visible('#hm-more [data-panel="main"]'), await visible('#hm-more [data-panel="theme"]')]).toEqual([false, true]);
    await page.locator('#hm-more [data-panel="theme"] .hm-back').click();
    await page.locator('#hm-more [data-more="theme"]').click();
    await page.locator('#hm-more [data-panel="theme"] [data-set-theme="dark"]').click();
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    await page.waitForSelector('.hm-more[aria-expanded="false"]');
    await page.locator(".hm-more").click();
    expect([await visible('#hm-more [data-panel="main"]'), await page.locator("[data-theme-now]").textContent()]).toEqual([true, "Dark"]);
    await page.evaluate(() => {
      localStorage.removeItem("ln-theme");
    });
  },
  SLOW,
);

test(
  "Read in ticks the language read in, alone",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".hm-read summary").click();
    const ticked = page.locator('.hm-ticks [aria-checked="true"]');
    expect([await ticked.count(), await ticked.getAttribute("hreflang"), await ticked.locator(".ix-tick").isVisible()]).toEqual([
      1,
      "en",
      true,
    ]);
  },
  SLOW,
);

test(
  "a query hides the page's header, an empty search keeps it",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator("#hm-q").focus();
    expect(await visible(".hm-title")).toBe(true);
    await page.locator("#hm-q").fill("past");
    await page.locator(".hm-row").first().waitFor();
    expect([await visible(".hm-brand"), await visible(".hm-title")]).toEqual([false, false]);
    await page.locator("#hm-q").fill("");
    expect(await visible(".hm-title")).toBe(true);
  },
  SLOW,
);

test(
  "a wide screen keeps the theme and the credits",
  async () => {
    const wide = await browser.newPage({ viewport: { width: 1032, height: 900 } });
    await wide.goto(new URL("/", base).href);
    expect([await wide.locator(".hm-folds .hm-theme").isVisible(), await wide.locator(".hm-more").isVisible()]).toEqual([true, false]);
    await wide.close();
  },
  SLOW,
);
