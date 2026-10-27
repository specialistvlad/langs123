// The credits page in a browser: the More menu's Credits leads to it, one centred column of at most 680px with Home
// beside the heading, on a wide screen and on a phone.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const box = (target: Page, selector: string): Promise<{ left: number; right: number; mid: number; width: number }> =>
  target.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, mid: r.top + r.height / 2, width: r.width };
  });

test(
  "More's Credits leads to the credits page: one centred column of at most 680px with Home beside the heading",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".hm-more").click();
    await page.locator('#hm-more [data-panel="main"] a[href="/credits/"]').click();
    await page.waitForURL(new URL("/credits/", base).href);
    expect(await page.locator("#cr-credit").textContent()).toContain("CC BY");
    const main = await box(page, ".cr-main");
    expect([main.width, Math.abs(main.left + main.right - 1280) < 2]).toEqual([680, true]);
    const [up, heading] = [await box(page, ".cr-head .pg-up"), await box(page, ".cr-heading")];
    expect([up.width, up.right < heading.left, Math.abs(up.mid - heading.mid) < 4]).toEqual([44, true, true]);
    expect(await page.locator(".hm-more").count()).toBe(0);
    await page.locator(".cr-head .pg-up").click();
    await page.waitForURL(new URL("/", base).href);
  },
  SLOW,
);

test(
  "on a phone the credits page keeps Home beside the heading",
  async () => {
    const phone = await browser.newPage({ viewport: { width: 402, height: 800 } });
    await phone.goto(new URL("/credits/", base).href);
    expect([await phone.locator(".cr-head .pg-up").isVisible(), await phone.locator(".cr-heading").isVisible()]).toEqual([true, true]);
    const [up, heading] = [await box(phone, ".cr-head .pg-up"), await box(phone, ".cr-heading")];
    expect([up.right < heading.left, Math.abs(up.mid - heading.mid) < 4]).toEqual([true, true]);
    await phone.close();
  },
  SLOW,
);
