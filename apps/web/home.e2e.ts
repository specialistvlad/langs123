// The Home's search in a browser: a query lists the topics of every course that match with the query in bold,
// a word met only inside a lesson finds it, a query that matches nothing says so, and Escape empties the search
// and brings the cards back.
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
    expect((await page.locator(".hm-row b").first().textContent())?.toLowerCase()).toBe("present");
    await page.locator("#hm-q").fill("zzzz");
    await page.locator(".hm-empty").waitFor();
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
    expect(await page.locator(".hm-row .hm-row-title").first().textContent()).toContain("Irregular Verbs");
  },
  SLOW,
);
