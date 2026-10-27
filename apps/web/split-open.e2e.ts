// A topic tapped in the Home's course pane leads to the course index with that topic chosen, in each language the
// Home is read in: the pane's own links go to their pages, and the left pane's items open in the pane.
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

test.each(["/", "/uk/"])(
  "on the Home at %s a topic tapped in the course's pane opens the course index with the topic chosen",
  async (home) => {
    const course = `${home === "/" ? "/en/" : home}english/`;
    await page.goto(new URL(`${home}?open=${course}`, base).href);
    const row = page.locator(".sp-body a[href*='?open=']").first();
    await row.waitFor();
    const topic = new URL((await row.getAttribute("href")) ?? "", base).searchParams.get("open") ?? "";
    await row.click();
    await page.waitForURL((url) => url.pathname === course);
    expect(new URL(page.url()).searchParams.get("open")).toBe(topic);
    // The topic's parts fill the pane, and its row is marked in the list, in both orders.
    await page.locator(".sp-body .tpp").waitFor();
    expect(
      await page.locator(`.sp-left [data-sp-chosen] a[href="${topic}"], .sp-left a[data-sp-chosen][href="${topic}"]`).count(),
    ).toBeGreaterThan(0);
  },
  SLOW,
);
