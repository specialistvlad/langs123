// The Home's toolbar in a browser. A phone has the brand row over the cards, More at its right end with its menu opening
// under it, and a bottom bar: Search at the left, which opens the field across the bar with Close, and Languages I know
// (文A) at the right. More's menu names the theme (whose list opens in its place under a way back, a theme chosen closing
// the menu, which opens again naming the theme chosen) and the credits. From 1024px 文A and More sit together at the top
// right and More's menu opens under them; the search field is in the header line, centred up to 520 wide. A query takes
// the brand off a phone; an empty search keeps it.
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
  "on a phone More ends the brand row, and the bottom bar has Search at the left and 文A at the right",
  async () => {
    await page.goto(new URL("/", base).href);
    expect(await Promise.all([".hm-more", ".ix-search-open", ".hm-langs-solo", "#hm-form", ".hm-tools .hm-langs"].map(visible))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    const [brand, more, search, langs] = [
      await box(page, ".hm-brand"),
      await box(page, ".hm-more"),
      await box(page, ".ix-search-open"),
      await box(page, ".hm-langs-solo"),
    ];
    expect([
      more.x + more.width > 402 - 24,
      Math.abs(more.y + more.height / 2 - (brand.y + brand.height / 2)) < 4,
      search.x < 24,
      langs.x + langs.width > 402 - 24,
      Math.abs(langs.y - search.y) < 4,
      search.y > 874 - 80,
    ]).toEqual([true, true, true, true, true, true]);
    expect(await page.locator(".hm-langs-solo").getAttribute("href")).toBe("/languages/");
  },
  SLOW,
);

test(
  "More's menu opens under it with the theme and the credits; the theme opens its list in the menu's place",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator(".hm-more").click();
    await page.waitForSelector('.hm-more[aria-expanded="true"]');
    expect(await page.locator('#hm-more [data-panel="main"] .ix-title').allTextContents()).toEqual(["Theme", "Credits"]);
    const [more, menu] = [await box(page, ".hm-more"), await box(page, "#hm-more")];
    expect([menu.y > more.y + more.height, Math.abs(menu.x + menu.width - (more.x + more.width)) < 4]).toEqual([true, true]);
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
    expect(await Promise.all(["#hm-form", "#hm-close", ".hm-more", ".ix-search-open", ".hm-langs-solo"].map(visible))).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
    expect(await visible(".hm-brand")).toBe(true);
    await page.locator("#hm-q").fill("past");
    await page.locator(".hm-row").first().waitFor();
    expect(await visible(".hm-brand")).toBe(false);
    await page.locator("#hm-q").fill("");
    expect(await visible(".hm-brand")).toBe(true);
    await page.locator("#hm-close").click();
    expect(await Promise.all(["#hm-form", ".hm-more", ".ix-search-open", ".hm-langs-solo"].map(visible))).toEqual([
      false,
      true,
      true,
      true,
    ]);
  },
  SLOW,
);

test(
  "from 1024px the header holds the brand, the field centred up to 520 and 文A then More at the top right, More's menu under them",
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
    const langs = await box(wide, ".hm-tools .hm-langs");
    expect([langs.x + langs.width <= more.x + 1, Math.abs(langs.y - more.y) < 2]).toEqual([true, true]);
    expect(await Promise.all([".hm-read", ".hm-langs-solo", ".ix-search-open"].map((s) => wide.locator(s).first().isVisible()))).toEqual([
      false,
      false,
      false,
    ]);
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
