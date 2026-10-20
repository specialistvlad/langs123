// The study path in a browser: the order switch shows one order and keeps it from page to page, in the
// course's index a topic page opens as a sheet and in the track index; on the study path the level filter
// hides the levels above it, the index marks the step being read, and Up next leads to the step after it.
// Run: npm run e2e (Chromium from Playwright: bunx playwright install chromium)
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Page } from "playwright";
import { LEVELS, loadCurriculum } from "../../scripts/lib.ts";
import { shared } from "./browser.ts";
import { SAMPLE } from "./sample.ts";

const { base, browser } = await shared();
// Each test opens several pages; a cold browser can take seconds to start.
const SLOW = 30_000;
// The English path as the sample site holds it: the sample's steps at each level.
const path = Object.fromEntries(
  Object.entries((await loadCurriculum()).languages[0]?.path ?? {}).map(([level, ids]) => [
    level,
    ids.filter((id) => SAMPLE.topics.includes(id)),
  ]),
);
let page: Page;
beforeAll(async () => {
  page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
}, SLOW);
afterAll(async () => {
  await page.close();
});

const open = (address: string): Promise<unknown> => page.goto(new URL(address, base).href);
// A topic page opens the course's index as a sheet; the track page holds the index itself.
const TOPIC = "/en/english/foundations/alphabet-spelling/";
const SHEET = "#tp-index";
const shown = (selector: string): Promise<boolean> => page.locator(selector).first().isVisible();
async function openIndex(): Promise<void> {
  await page.click(".tp-top .tp-index-btn");
  await page.locator(`${SHEET}:popover-open`).waitFor();
}
// Chooses an order in the index sheet.
async function chooseOrder(order: string): Promise<void> {
  await openIndex();
  await page.click(`${SHEET} .tp-seg [data-set-order="${order}"]`);
}
// Chooses a level in the menu its button opens.
async function chooseLevel(code: string): Promise<void> {
  await page.click('.tp-top [popovertarget="tp-levels"]');
  await page.click(`#tp-levels [data-set-level="${code}"]:not([data-all])`);
}
// The index's visible study-path entries: each level's card, and each step's level.
const menu = (): Promise<string[]> =>
  page.$$eval(`${SHEET} .nav-list[data-order="path"] :is(.tp-ix-sec, a.tp-row)`, (els) =>
    els.filter((el) => el.checkVisibility()).map((el) => `${el.matches("section") ? "#" : ""}${el.getAttribute("data-level") ?? ""}`),
  );
// The address a link opens: its href, with ?step= from data-path-step as the reader's click adds it.
const opens = (a: Element): string => {
  const url = new URL(a.getAttribute("href") ?? "", location.href);
  const step = a.getAttribute("data-path-step");
  if (step !== null) url.searchParams.set("step", step);
  return url.pathname + url.search + url.hash;
};
const current = (): Promise<string> => page.locator(`${SHEET} .nav-list[data-order="path"] [aria-current="step"]`).evaluate(opens);
const next = (): Promise<string> => page.locator('.tp-rail .up-next[data-order="path"]:visible a.next').evaluate(opens);

test(
  "the switch shows one order and keeps it from page to page",
  async () => {
    await open(TOPIC);
    await openIndex();
    expect(await shown(`${SHEET} .nav-list[data-order="categories"]`)).toBe(true);
    expect(await shown(`${SHEET} .nav-list[data-order="path"]`)).toBe(false);
    await page.click(`${SHEET} .tp-seg [data-set-order="path"]`);
    expect(await shown(`${SHEET} .nav-list[data-order="categories"]`)).toBe(false);
    await open("/en/english/");
    expect(await shown('.ix-flow[data-order="path"]')).toBe(true);
    expect(await shown('.ix-flow[data-order="categories"]')).toBe(false);
    expect(await page.locator('.ix-seg [data-set-order="path"]').getAttribute("class")).toBe("on");
    await open("/en/english/verbs/to-be/");
    await openIndex();
    expect(await shown(`${SHEET} .nav-list[data-order="path"]`)).toBe(true);
    expect(await page.locator(`${SHEET} .tp-seg [data-set-order="path"]`).getAttribute("class")).toBe("on");
  },
  SLOW,
);

test(
  "at A0 the index lists the A0 steps alone",
  async () => {
    await open(`${TOPIC}?level=a0`);
    await chooseOrder("path");
    expect(await menu()).toEqual(["#A0", ...(path["A0"] ?? []).map(() => "A0")]);
  },
  SLOW,
);

test(
  "without a step in the address, the step being read is the highest the level filter shows",
  async () => {
    await open("/en/english/verbs/to-be/?level=a0");
    await chooseOrder("path");
    expect(await current()).toBe("/en/english/verbs/to-be/?step=a0");
    expect(await next()).toBe("/en/english/sentence-building/word-order/?step=a0");
    await chooseLevel("A1");
    expect(await current()).toBe("/en/english/verbs/to-be/?step=a1#past-was-and-were");
    expect(await next()).toBe("/en/english/tenses/simple-tenses/?step=a1");
  },
  SLOW,
);

test(
  "a step opened from the index stays the step being read at any level above it",
  async () => {
    await open(`${TOPIC}?level=b2`);
    await chooseOrder("path");
    // The first step of a topic, below its later steps.
    await page.click(`${SHEET} .nav-list[data-order="path"] a.tp-row[data-level="A0"][href^="/en/english/verbs/to-be/"]`);
    expect(await current()).toBe("/en/english/verbs/to-be/?step=a0");
    expect(await next()).toBe("/en/english/sentence-building/word-order/?step=a0");
    // Two steps that open the same section.
    await openIndex();
    await page.click(`${SHEET} .nav-list[data-order="path"] a.tp-row[data-level="B1"][href^="/en/english/verbs/irregular-verbs-table/"]`);
    expect(await current()).toMatch(/^\/en\/english\/verbs\/irregular-verbs-table\/\?step=b1/);
    await openIndex();
    await page.click(`${SHEET} .nav-list[data-order="path"] a.tp-row[data-level="A2"][href^="/en/english/verbs/irregular-verbs-table/"]`);
    expect(await current()).toMatch(/^\/en\/english\/verbs\/irregular-verbs-table\/\?step=a2/);
    // A filter below the step shows the highest step it leaves.
    await chooseLevel("A1");
    expect(await current()).toBe("/en/english/verbs/irregular-verbs-table/?step=a1");
  },
  SLOW,
);

test(
  "with the level filter on, previous and next move through the pages it shows and start over after the last",
  async () => {
    // The visible capsule in the bottom bar: each side as what it does and where it leads.
    const row = async (): Promise<string[]> =>
      page.$$eval(".tp-bar .tp-pager .tp-side", (els) =>
        els
          .filter((el) => el.checkVisibility())
          .map((el) => {
            const kind = el.classList.contains("tp-off")
              ? "off"
              : el.classList.contains("tp-restart")
                ? "restart"
                : el.classList.contains("tp-prev")
                  ? "prev"
                  : "next";
            const href = el.getAttribute("href");
            if (href === null) return kind;
            const url = new URL(href, location.href);
            const step = el.getAttribute("data-path-step");
            if (step !== null) url.searchParams.set("step", step);
            return `${kind} ${url.pathname + url.search + url.hash}`;
          }),
      );
    await open("/en/english/sentence-building/word-order/?level=a0");
    await chooseOrder("categories");
    await page.keyboard.press("Escape");
    expect(await row()).toEqual(["prev /en/english/verbs/to-be/", "restart /en/english/foundations/alphabet-spelling/"]);
    await open("/en/english/foundations/alphabet-spelling/?level=a0");
    expect(await row()).toEqual(["off", "next /en/english/foundations/pronunciation-ipa/"]);
    await chooseOrder("path");
    await open("/en/english/foundations/telling-time/?step=a0&level=a0");
    expect(await row()).toEqual([
      "prev /en/english/foundations/days-months-dates/?step=a0",
      "restart /en/english/foundations/alphabet-spelling/?step=a0",
    ]);
    // A higher level lets the path go on.
    await chooseLevel("A1");
    expect((await row())[1]).toBe("next /en/english/foundations/pronunciation-ipa/?step=a1#consonant-sounds");
  },
  SLOW,
);

test(
  "at every level, the top level included, a page shows one capsule of previous and next and one Up next",
  async () => {
    // How many of each show: the capsule in the bottom bar, and Up next in the contents column.
    const counts = (): Promise<number[]> =>
      page.$$eval(".tp-bar .tp-pager, .tp-rail .up-next", (els) =>
        [".tp-pager", ".up-next"].map((s) => els.filter((el) => el.matches(s) && el.checkVisibility()).length),
      );
    for (const order of ["categories", "path"]) {
      await open(TOPIC);
      await chooseOrder(order);
      for (const level of LEVELS) {
        await open(`/en/english/tenses/tense-map/?level=${level.toLowerCase()}`);
        expect({ order, level, counts: await counts() }).toEqual({ order, level, counts: [1, 1] });
      }
    }
  },
  SLOW,
);
