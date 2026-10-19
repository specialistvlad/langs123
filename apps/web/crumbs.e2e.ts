// The breadcrumb's track crumb: it opens into every language to learn, each in the reader's language where
// it is explained in it, else in the first language it is explained in, named in a note; the current one
// is marked, and Escape closes the menu.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await page.close();
});

test(
  "the track's crumb opens into every language to learn, in the reader's language where it is explained in it, and Escape closes it",
  async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(new URL("/uk/english/verbs/to-be/", base).href);
    const menu = page.locator(".crumbs details.crumb-menu");
    expect(await menu.evaluate((d) => d.hasAttribute("open"))).toBe(false);
    await page.click(".crumbs .crumb-menu summary");
    expect(await menu.evaluate((d) => d.hasAttribute("open"))).toBe(true);
    const links = await page.$$eval(".learn-list a", (as) =>
      as.map((a) => ({
        href: a.getAttribute("href"),
        current: a.getAttribute("aria-current"),
        note: a.querySelector("small")?.textContent ?? null,
      })),
    );
    // Ukrainian readers have every language to learn in Ukrainian.
    expect(links.map((l) => l.href)).toEqual(["/uk/english/", "/uk/spanish/", "/uk/ukrainian/"]);
    expect(links.map((l) => l.current)).toEqual(["page", null, null]);
    expect(links.map((l) => l.note)).toEqual([null, null, null]);
    for (const l of links) expect((await fetch(new URL(l.href ?? "", base))).status).toBe(200);
    await page.keyboard.press("Escape");
    expect(await menu.evaluate((d) => d.hasAttribute("open"))).toBe(false);
  },
  SLOW,
);
