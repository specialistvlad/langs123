// A course index's header and toolbar as built: the Home button sharing the title row, the topic count with its text
// per chosen level, the phone's Search button, the Level button opening the level popover for the course, and the
// variety button of a course with varieties.
import { expect, test } from "bun:test";
import { LEVELS } from "../../scripts/lib.ts";
import { readPage } from "./test-site.ts";
import { homeUrl } from "./urls.ts";

const english = await readPage("en/english/index.html");
const spanish = await readPage("en/spanish/index.html");
const ukrainian = await readPage("en/ukrainian/index.html");

test("a Home button leads the page and the header names the course with its topic count", () => {
  const up = english.querySelector("a.ix-up");
  expect(up?.getAttribute("href")).toBe(homeUrl("en"));
  expect(english.querySelector(".ix-name-h")?.textContent).toContain("English");
  expect(english.querySelector(".ix-count")?.textContent).toMatch(/^\d+ topics$/);
});

test("the Home button opens the page's content and shares the title row, with no row of its own above it", () => {
  const main = english.querySelector("main.ix-main");
  expect(main?.firstElementChild?.matches("a.ix-up")).toBe(true);
  expect(main?.children[1]?.matches("#hm-cards")).toBe(true);
  const header = english.querySelector("#hm-cards > .ix-head");
  expect(header?.firstElementChild?.matches(".ix-line")).toBe(true);
  expect(header?.querySelector(".ix-line > .ix-name-h")?.textContent).toContain("English");
  expect(header?.querySelector(".ix-line > .ix-count")).not.toBeNull();
  expect(header?.lastElementChild?.matches(".ix-seg")).toBe(true);
  expect(english.querySelectorAll(".ix-up").length).toBe(1);
});

test("the bar holds the search field, the phone's round Search button, the group and Close", () => {
  const bar = english.querySelector("nav.ix-bar");
  expect([...(bar?.children ?? [])].map((el) => el.id || el.className.split(" ")[0])).toEqual([
    "hm-form",
    "hm-group",
    "ix-search",
    "hm-close",
    "ix-varieties",
  ]);
  const button = english.querySelector("#ix-search");
  expect(button?.tagName).toBe("BUTTON");
  expect(button?.getAttribute("aria-label")).toBe(english.querySelector("#hm-q")?.getAttribute("aria-label"));
  expect(button?.querySelector("svg")).not.toBeNull();
  expect(english.querySelector(".hm-group + #ix-search")).not.toBeNull();
});

test("the count has its text for every level, a topic counting from its lowest level up, the top level's text on the page", () => {
  const count = english.querySelector(".ix-count");
  const texts = JSON.parse(count?.getAttribute("data-counts") ?? "{}") as Record<string, string>;
  expect(Object.keys(texts)).toEqual([...LEVELS]);
  const numbers = LEVELS.map((level) => Number.parseInt(texts[level] ?? "", 10));
  expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  expect(texts[LEVELS.at(-1) ?? ""]).toBe(count?.textContent ?? "");
  expect(numbers[0]).toBeLessThan(numbers.at(-1) ?? 0);
});

test("the Level button names the chosen level alone and opens the level popover for the course under the group", () => {
  const button = english.querySelector(".ix-level");
  expect(button?.getAttribute("popovertarget")).toBe("lv-pop");
  expect(button?.getAttribute("aria-haspopup")).toBe("dialog");
  expect(button?.getAttribute("data-lv-under")).toBe(".hm-group");
  expect(button?.querySelector(".lvm")).toBeNull();
  const names = JSON.parse(button?.querySelector("[data-level-label]")?.getAttribute("data-names") ?? "{}") as Record<string, string>;
  expect(names["B1"]).toBe("Intermediate");
  expect(english.querySelector("#ix-levels")).toBeNull();
  // The course's entry in the page's level data names the course and the levels the button holds.
  const data = JSON.parse(english.querySelector("#lv-data")?.textContent ?? "{}") as Record<string, { t: string; k: string; l: object }>;
  const entry = data[button?.getAttribute("data-lv") ?? ""];
  expect([entry?.t, entry?.k]).toEqual(["English", "course"]);
  expect(button?.getAttribute("data-lv-levels")).toBe(Object.keys(entry?.l ?? {}).join(" "));
});

test("a course with varieties has a Variety button with the globe, naming the variety, in the group", () => {
  for (const doc of [english, spanish]) {
    const button = doc.querySelector(".hm-group .ix-variety");
    expect(button?.getAttribute("popovertarget")).toBe("ix-varieties");
    expect(button?.querySelector("svg circle")).not.toBeNull();
    expect(button?.querySelector("[data-variety-label]")?.textContent).not.toBe("");
  }
  expect(ukrainian.querySelector(".ix-variety")).toBeNull();
});
