// More on a phone's Home in a browser: one button in place of Read in, the theme and the credits; its menu names the
// three, Read in and the theme open their lists in its place under a way back, a choice of theme closes it, and it
// opens again on the three, naming the theme chosen. Wide screens keep the three buttons.
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

const shown = (panel: string): Promise<boolean> => page.locator(`#hm-more [data-panel="${panel}"]`).isVisible();

test(
  "More opens the three, a list in their place and back, and a theme chosen closes it",
  async () => {
    await page.goto(new URL("/", base).href);
    expect([await page.locator(".hm-folds").isVisible(), await page.locator(".hm-more").isVisible()]).toEqual([false, true]);
    await page.locator(".hm-more").click();
    await page.waitForSelector('.hm-more[aria-expanded="true"]');
    expect(await shown("main")).toBe(true);
    await page.locator('#hm-more [data-more="read"]').click();
    expect([await shown("main"), await shown("read")]).toEqual([false, true]);
    expect(await page.locator('#hm-more [data-panel="read"] a[aria-checked="true"]').count()).toBe(1);
    await page.locator('#hm-more [data-panel="read"] .hm-back').click();
    await page.locator('#hm-more [data-more="theme"]').click();
    await page.locator('#hm-more [data-panel="theme"] [data-set-theme="dark"]').click();
    expect(await page.evaluate(() => document.documentElement.dataset["theme"])).toBe("dark");
    await page.waitForSelector('.hm-more[aria-expanded="false"]');
    expect(await page.locator("#hm-more").evaluate((m) => m.matches(":popover-open"))).toBe(false);
    await page.locator(".hm-more").click();
    expect([await shown("main"), await page.locator("[data-theme-now]").textContent()]).toEqual([true, "Dark"]);
    await page.evaluate(() => {
      localStorage.removeItem("ln-theme");
    });
  },
  SLOW,
);

test(
  "a wide screen keeps Read in, the theme and the credits",
  async () => {
    const wide = await browser.newPage({ viewport: { width: 1032, height: 900 } });
    await wide.goto(new URL("/", base).href);
    expect([await wide.locator(".hm-folds").isVisible(), await wide.locator(".hm-more").isVisible()]).toEqual([true, false]);
    await wide.close();
  },
  SLOW,
);
