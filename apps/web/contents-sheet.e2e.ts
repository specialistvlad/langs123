// A topic on a phone (pages/topic.ts, client-topic.ts) is two pages of one document: the contents (Back to the course;
// the parts as rows with chevrons, the part last read marked), and the reading, which the address #part opens at that
// part (Back to the contents). The Contents button of the bars is gone.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
// Each test opens a page; a cold browser can take seconds to start.
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 390, height: 800 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const TOPIC = "/en/english/verbs/to-be/?level=a1";
const shown = (selector: string): Promise<boolean> =>
  page
    .locator(selector)
    .filter({ visible: true })
    .count()
    .then((n) => n > 0);

test(
  "the topic opens on its contents: Back to the course, the lead and the parts, no sections; no bar holds a Contents button",
  async () => {
    await page.goto(new URL(TOPIC, base).href);
    expect(await shown(".tp-back-c")).toBe(true);
    expect(await shown(".tp-back-r")).toBe(false);
    expect(await shown(".tp-head h1")).toBe(true);
    expect(await shown(".tp-parts .tp-list a")).toBe(true);
    expect(await shown(".tp-body")).toBe(false);
    expect(await shown(".tp-outline")).toBe(false);
    expect(await page.locator('[popovertarget="tp-contents"]').count()).toBe(0);
    expect(await page.locator(".tp-parts .lvm").count()).toBe(0);
    expect(await page.locator(".tp-back-c").getAttribute("href")).toBe("/en/english/");
  },
  SLOW,
);

test(
  "a part opens the reading at that part, Back leads to the contents, and the contents mark the part last read",
  async () => {
    await page.goto(new URL(TOPIC, base).href);
    const rows = page.locator(".tp-parts .tp-list a");
    const target = (await rows.nth(1).getAttribute("href")) ?? "";
    await rows.nth(1).click();
    await page.waitForFunction((hash) => location.hash === hash, target);
    expect(await shown(".tp-body")).toBe(true);
    expect(await shown(".tp-parts")).toBe(false);
    expect(await shown(".tp-back-c")).toBe(false);
    expect(await shown(".tp-back-r")).toBe(true);
    // The part is in view under the title row, which stays at the top.
    await page.waitForFunction((id) => {
      const top = document.getElementById(id)?.getBoundingClientRect().top ?? -1;
      return top >= 0 && top < 160;
    }, target.slice(1));
    const title = await page.locator(".tp-head .title-row").boundingBox();
    expect(title?.y).toBe(0);
    // Scrolling on keeps the title row; the contents mark the part the page has scrolled to.
    const next = await page.evaluate((id) => {
      const open = [...document.querySelectorAll<HTMLElement>(".tp-body .sections > section.part")].filter((el) => el.offsetHeight > 0);
      return open[open.findIndex((el) => el.id === id) + 1]?.id ?? "";
    }, target.slice(1));
    expect(next).not.toBe("");
    const later = `#${next}`;
    await page.evaluate((id) => {
      scrollTo(0, (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + scrollY - 100);
    }, later.slice(1));
    await page.waitForFunction((part) => document.querySelector(".tp-list a.on")?.getAttribute("href") === part, later);
    expect((await page.locator(".tp-head .title-row").boundingBox())?.y).toBe(0);
    await page.locator(".tp-back-r").click();
    await page.waitForFunction(() => location.hash === "");
    expect(await shown(".tp-parts .tp-list a")).toBe(true);
    expect(await shown(".tp-body")).toBe(false);
    expect(await page.locator(".tp-list a.on").getAttribute("href")).toBe(later);
  },
  SLOW,
);

test(
  "the summary opens at the top of the page, its head in view",
  async () => {
    await page.goto(new URL(`${TOPIC}#summary`, base).href);
    expect(await shown(".tp-body")).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  },
  SLOW,
);
