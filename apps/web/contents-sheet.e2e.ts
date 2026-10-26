// The phone's contents sheet (pages/topic.ts, client-topic.ts) marks the part being read: Summary at the top, and
// the part the page has scrolled to however many scroll events follow.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { shared } from "./browser.ts";

const { base, browser } = await shared();
// Each test opens a page; a cold browser can take seconds to start.
const SLOW = 30_000;
let page: Page;
beforeAll(async () => {
  page = await browser.newPage();
}, SLOW);
afterAll(async () => {
  await page.close();
});

const TOPIC = "/en/english/verbs/to-be/?level=a1";

test(
  "on a small screen the contents sheet marks the part being read, at the top and while the page keeps scrolling",
  async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(new URL(TOPIC, base).href);
    const marked = (): Promise<string[]> =>
      page.evaluate(() => [...document.querySelectorAll("#tp-contents .toc a.on")].map((a) => a.getAttribute("href") ?? ""));
    const first = (await page.locator("#tp-contents .toc a").first().getAttribute("href")) ?? "";
    expect(await marked()).toEqual([first]);
    const second = (await page.locator("#tp-contents .toc a").nth(2).getAttribute("href")) ?? "";
    // Two scrolls to the same part: the second leaves the part marked in the left list as it was.
    for (const extra of [0, 3]) {
      await page.evaluate(
        ([id, by]) => {
          scrollTo(0, (document.getElementById(id ?? "")?.getBoundingClientRect().top ?? 0) + scrollY - 100 + Number(by));
        },
        [second.slice(1), String(extra)],
      );
      await page.waitForTimeout(150);
    }
    await page.waitForFunction((part) => document.querySelector("#tp-contents .toc a.on")?.getAttribute("href") === part, second);
    expect(await marked()).toEqual([second]);
    await page.evaluate(() => {
      document.getElementById("tp-contents")?.showPopover();
    });
    expect(await marked()).toEqual([second]);
  },
  SLOW,
);
