// The breadcrumb's track crumb: it opens into every language to learn, each in the reader's language where
// it is explained in it, else in the first language it is explained in, named in a note; the current one
// is marked, and Escape closes the menu.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "playwright";
import { SITE_DIR, testSite } from "./test-site.ts";

await testSite();
const SLOW = 30_000;
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: (req) => {
    const file = decodeURIComponent(new URL(req.url).pathname);
    return new Response(Bun.file(join(SITE_DIR, file.endsWith("/") ? `${file}index.html` : file)));
  },
});
let browser: Browser;
let page: Page;
beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await browser.close();
  await server.stop();
});

test(
  "the track's crumb opens into every language to learn, in the reader's language where it is explained in it, and Escape closes it",
  async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(new URL("/uk/english/verbs/to-be/", server.url).href);
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
    expect(links.map((l) => l.href)).toEqual(["/uk/english/", "/en/spanish/"]);
    expect(links.map((l) => l.current)).toEqual(["page", null]);
    expect(links[0]?.note).toBeNull();
    expect(links[1]?.note).not.toBeNull();
    for (const l of links) expect((await fetch(new URL(l.href ?? "", server.url))).status).toBe(200);
    await page.keyboard.press("Escape");
    expect(await menu.evaluate((d) => d.hasAttribute("open"))).toBe(false);
  },
  SLOW,
);
