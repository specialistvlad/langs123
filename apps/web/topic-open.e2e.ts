// A topic chosen in the course index's right pane: its parts and its tools (Level, Variety, Read in) fill the pane,
// and a part opens the topic page with that part in view.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

test(
  "a topic chosen in the index shows its parts and tools in the right pane, and a part opens the topic at that part",
  async () => {
    await page.goto(new URL("/en/english/", base).href);
    await page.click('.sp-left a[data-sp-item][href="/en/english/verbs/to-be/"]');
    await page.locator(".sp-body .tpp").waitFor();
    expect(await page.locator(".sp-tools .hm-group").isVisible()).toBe(true);
    expect(await page.locator(".sp-body .tpp-rows li").count()).toBeGreaterThan(1);
    const part = page.locator(".sp-body .tpp-rows li a").nth(1);
    const id = ((await part.getAttribute("href")) ?? "").split("#")[1] ?? "";
    await part.click();
    await page.waitForURL((url) => url.pathname.startsWith("/en/english/verbs/to-be/") && url.hash === `#${id}`);
    expect(await page.locator(".sp-topic .sp-right").count()).toBe(1);
    const top = await page.locator(`[id="${id}"]`).evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeLessThan(450);
    expect(top).toBeGreaterThanOrEqual(0);
  },
  SLOW,
);
