// The Home's toolbar in a browser. A phone has the brand over the cards and a bottom bar: More at the left, Search at
// the right, which opens the field across the bar with Close; More's menu names Languages I know, the theme (whose
// list opens in its place under a way back, a theme chosen closing the menu, which opens again naming the theme
// chosen) and the credits. From 1024px one More sits at the top right and its menu opens under it; the search field is
// in the header line, centred up to 520 wide. A query takes the brand off a phone; an empty search keeps it.
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
const box = async (target: Page, selector: string): Promise<{ x: number; y: number; width: number; height: number }> => {
  const found = await target.locator(selector).first().boundingBox();
  if (found === null) throw new Error(`${selector} has no box`);
  return found;
};

test(
  "on a phone More is at the left of the bottom bar and Search at the right, with no Read in, theme or credits button",
  async () => {
    await page.goto(new URL("/", base).href);
    expect(await Promise.all([".hm-more", ".ix-search-open", "#hm-form", ".hm-read", ".hm-theme", ".hm-credits"].map(visible))).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    const [more, search] = [await box(page, ".hm-more"), await box(page, ".ix-search-open")];
    expect([more.x < 40, search.x + search.width > 402 - 40, Math.abs(more.y - search.y) < 4]).toEqual([true, true, true]);
    expect(await page.locator(".hm-more").count()).toBe(1);
  },
  SLOW,
);

test(
  "More's menu holds Languages I know, the theme and the credits; the theme opens its list in the menu's place",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".hm-more").click();
    await page.waitForSelector('.hm-more[aria-expanded="true"]');
    expect(await page.locator('#hm-more [data-panel="main"] .ix-title').allTextContents()).toEqual([
      "Languages I know",
      "Theme",
      "Credits",
    ]);
    expect(await page.locator('#hm-more [data-panel="main"] a.ix-item').first().getAttribute("href")).toBe("/languages/");
    expect(await page.locator("#hm-more [data-langs-list]").count()).toBe(1);
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
  "Search opens the field across the bar with Close; a query takes the brand off the page, an empty search keeps it",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".ix-search-open").click();
    expect(await Promise.all(["#hm-form", "#hm-close", ".hm-more", ".ix-search-open"].map(visible))).toEqual([true, true, false, false]);
    expect(await visible(".hm-brand")).toBe(true);
    await page.locator("#hm-q").fill("past");
    await page.locator(".hm-row").first().waitFor();
    expect(await visible(".hm-brand")).toBe(false);
    await page.locator("#hm-q").fill("");
    expect(await visible(".hm-brand")).toBe(true);
    await page.locator("#hm-close").click();
    expect(await Promise.all(["#hm-form", ".hm-more", ".ix-search-open"].map(visible))).toEqual([false, true, true]);
  },
  SLOW,
);

test(
  "from 1024px the header holds the brand, the field centred up to 520 and the one More at the top right, its menu under it",
  async () => {
    const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await wide.goto(new URL("/", base).href);
    const [brand, field, more] = [await box(wide, ".hm-brand"), await box(wide, "#hm-form"), await box(wide, ".hm-more")];
    expect([brand.x < field.x, Math.round(field.width), more.x > 1440 - 90, more.y < 40, await wide.locator(".hm-more").count()]).toEqual([
      true,
      520,
      true,
      true,
      1,
    ]);
    expect(
      await Promise.all([".hm-read", ".hm-theme", ".hm-credits", ".ix-search-open"].map((s) => wide.locator(s).first().isVisible())),
    ).toEqual([false, false, false, false]);
    await wide.locator(".hm-more").click();
    const menu = await box(wide, "#hm-more");
    expect([menu.y > more.y + more.height, Math.abs(menu.x + menu.width - (more.x + more.width)) < 12]).toEqual([true, true]);
    await wide.close();
  },
  SLOW,
);

test(
  "the cards stand in two columns from 1024px and three from 1280px, and a card opens its course",
  async () => {
    const wide = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    await wide.goto(new URL("/", base).href);
    const columns = (): Promise<number> =>
      wide.evaluate(() => getComputedStyle(document.querySelector("#hm-cards") ?? document.body).gridTemplateColumns.split(" ").length);
    expect(await columns()).toBe(2);
    await wide.setViewportSize({ width: 1440, height: 900 });
    expect(await columns()).toBe(3);
    const href = await wide.locator(".hm-course-a").first().getAttribute("href");
    await wide.locator(".hm-card").first().locator(".hm-name").click();
    await wide.waitForURL((url) => url.pathname === href);
    await wide.close();
  },
  SLOW,
);
