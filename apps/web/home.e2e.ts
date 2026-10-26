// The Home's search in a browser: a query lists the topics of every course that match with the query in bold under
// "Topics · N", a word met only inside a lesson finds it, a query that matches nothing names it and offers four topics
// to try, a query keeps the logo in place on wide screens and hides the heading, Escape empties the search and
// brings the cards back; the filters narrow the topics to a course and the levels up to one, and a tap
// on a chosen filter clears it; a result's level mark opens the level popover on its topic.
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

test(
  "a query lists the matching topics, a miss says so, and Escape brings the cards back",
  async () => {
    await page.goto(new URL("/", base).href);
    expect(await page.locator("#hm-cards").isVisible()).toBe(true);
    await page.locator("#hm-q").fill("present");
    await page.locator(".hm-row").first().waitFor();
    expect(await page.locator("#hm-cards").isVisible()).toBe(false);
    expect([await page.locator(".hm-brand").isVisible(), await page.locator(".hm-title").isVisible()]).toEqual([true, false]);
    expect((await page.locator(".hm-row b").first().textContent())?.toLowerCase()).toBe("present");
    expect(await page.locator("#hm-results > .hm-heading").textContent()).toBe(`Topics · ${String(await page.locator(".hm-row").count())}`);
    await page.locator("#hm-q").fill("qxqxqz");
    await page.locator("#hm-none:not([hidden])").waitFor();
    expect(await page.locator(".hm-none-t").textContent()).toBe("No results for “qxqxqz”");
    // Four topics to try, each title in whole 22px lines beside its flag, with its level mark and range beside it.
    await page.locator("#hm-sugg-list .hm-row").first().waitFor();
    expect(await page.locator("#hm-sugg-list .hm-row").count()).toBe(4);
    const row = page.locator("#hm-sugg-list .hm-row").first();
    expect(await row.locator(".hm-row-a").evaluate((a) => Math.round(a.getBoundingClientRect().height) % 22)).toBe(0);
    expect(await row.locator(".lvm-t").isVisible()).toBe(true);
    await page.locator("#hm-q").press("Escape");
    expect(await page.locator("#hm-cards").isVisible()).toBe(true);
    expect(await page.locator("#hm-results").isVisible()).toBe(false);
  },
  SLOW,
);

test(
  "a word met only inside a lesson lists that lesson first",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator("#hm-q").fill("went");
    await page.locator(".hm-row").first().waitFor();
    expect(await page.locator(".hm-row .hm-row-a").first().textContent()).toContain("Irregular Verbs");
  },
  SLOW,
);

test(
  "the filters narrow the topics to a course and the levels up to one, and a tap on a chosen one clears it",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator("#hm-q").fill("present");
    await page.locator(".hm-row").first().waitFor();
    const all = await page.locator(".hm-row").count();
    await page.locator('[data-filter="course"]').click();
    await page.locator('#hm-f-course [data-course="es"]').click();
    await page.waitForFunction(() => document.querySelector('[data-filter="course"]')?.getAttribute("aria-pressed") === "true");
    const flags = await page.locator(".hm-row-flag").allTextContents();
    expect([flags.length < all, flags.every((f) => f === "🇪🇸")]).toEqual([true, true]);
    expect(await page.locator('[data-variety-course="es"]').isVisible()).toBe(true);
    await page.locator('[data-filter="level"]').click();
    await page.locator('#hm-f-level [data-set-level="A1"]').click();
    await page.waitForFunction(() => document.querySelector('[data-filter="level"]')?.textContent === "Up to A1");
    await page.locator('[data-filter="course"]').click();
    await page.locator('[data-filter="level"]').click();
    await page.waitForFunction(() => document.querySelector('[data-filter="level"]')?.getAttribute("aria-pressed") === "false");
    expect(await page.locator(".hm-row").count()).toBe(all);
    // Clearing a choice leaves its menu closed.
    expect(await page.locator(".hm-fmenu:popover-open").count()).toBe(0);
  },
  SLOW,
);

test(
  "a result's level mark opens the level popover on its topic",
  async () => {
    await page.goto(new URL("/", base).href);
    await page.locator("#hm-q").fill("went");
    await page.locator(".hm-row").first().waitFor();
    await page.locator(".hm-row .lvm-b").first().click();
    await page.locator("#lv-pop:popover-open").waitFor();
    expect(await page.locator(".lv-pop-t").textContent()).toContain("Irregular Verbs");
  },
  SLOW,
);

test(
  "a course index searches its own course first, and the reader can switch the course chip to all courses",
  async () => {
    await page.goto(new URL("/en/spanish/", base).href);
    await page.locator("#hm-q").fill("present");
    await page.locator(".hm-row").first().waitFor();
    const chip = page.locator('[data-filter="course"]');
    expect([await chip.textContent(), await chip.getAttribute("aria-pressed")]).toEqual(["Spanish", "false"]);
    expect(await page.locator('[data-variety-course="es"]').isVisible()).toBe(true);
    const own = await page.locator(".hm-row").count();
    expect(await page.locator(".hm-row-flag").allTextContents()).toEqual(Array<string>(own).fill("🇪🇸"));
    // The Home button stays on a wide screen while a query is typed.
    expect(await page.locator(".ix-up").isVisible()).toBe(true);
    await chip.click();
    await page.locator('#hm-f-course [data-course=""]').click();
    await page.waitForFunction(() => document.querySelector('[data-filter="course"]')?.textContent === "All courses");
    await page.waitForFunction((n) => document.querySelectorAll(".hm-row").length > n, own);
    expect(await chip.getAttribute("aria-pressed")).toBe("true");
    // A tap on the chip brings the course index's own course back.
    await chip.click();
    await page.waitForFunction(() => document.querySelector('[data-filter="course"]')?.textContent === "Spanish");
    expect(await page.locator(".hm-row").count()).toBe(own);
    // On a phone the Home button leaves while a query is typed.
    await page.setViewportSize({ width: 402, height: 874 });
    expect(await page.locator(".ix-up").isVisible()).toBe(false);
    await page.setViewportSize({ width: 1280, height: 800 });
  },
  SLOW,
);
