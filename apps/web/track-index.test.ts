// A course index's header and toolbar as built in the split view: the title row (Home, the list button, the course),
// the list as the fragment the Home's right pane takes, the topic rows as items, the placeholder and tools of the right
// pane, the topic count with its text per chosen level, the phone's Search button, the Level button opening the level
// popover for the course, and the variety button of a course with varieties.
import { expect, test } from "bun:test";
import { LEVELS } from "../../scripts/lib.ts";
import { readPage } from "./test-site.ts";
import { homeUrl } from "./urls.ts";

const english = await readPage("en/english/index.html");
const spanish = await readPage("en/spanish/index.html");
const ukrainian = await readPage("en/ukrainian/index.html");

test("the title row holds the Home button, the list button and the course, the count after it for a phone", () => {
  const row = english.querySelector(".sp-left > .sp-title");
  expect([...(row?.children ?? [])].map((el) => el.className.split(" ")[0])).toEqual(["ix-up", "sp-list", "ix-name-h", "ix-count"]);
  expect(row?.querySelector("a.ix-up")?.getAttribute("href")).toBe(homeUrl("en"));
  expect(row?.querySelector(".ix-name-h")?.textContent).toContain("English");
  expect(row?.querySelector(".ix-count")?.textContent).toMatch(/^\d+ topics$/);
  expect(english.querySelectorAll(".ix-up").length).toBe(1);
  expect(english.querySelector(".sp")?.className).toBe("sp sp-home sp-track");
});

test("the list is the fragment the Home's right pane takes: the course's heading, the switch and the count, then both orders", () => {
  const list = english.querySelector("#hm-cards");
  expect(list?.hasAttribute("data-sp-fragment")).toBe(true);
  expect(english.querySelectorAll("[data-sp-fragment]").length).toBe(1);
  expect([...(list?.children ?? [])].map((el) => el.className.split(" ")[0] ?? el.tagName)).toEqual([
    "ix-name-h",
    "ix-head",
    "ix-flow",
    "ix-flow",
  ]);
  expect(list?.querySelector(".ix-name-h")?.textContent).toContain("English");
  const head = list?.querySelector(".ix-head");
  expect(head?.firstElementChild?.matches(".ix-seg")).toBe(true);
  expect(head?.querySelector(".ix-count")?.textContent).toMatch(/^\d+ topics$/);
  expect(list?.closest(".sp-left")).not.toBeNull();
});

test("the search sits under the title row; a topic row is an item of the split view", () => {
  const left = [...(english.querySelector(".sp-left")?.children ?? [])].map((el) => el.className.split(" ")[0] ?? el.tagName);
  expect(left).toEqual(["sp-title", "hm-bar", "hm-main", "ix-fade"]);
  const rows = [...english.querySelectorAll(".ix-rows > li:not(.ix-more)")];
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(row.hasAttribute("data-sp-unit")).toBe(true);
    expect(row.querySelector("a.ix-cover")?.hasAttribute("data-sp-item")).toBe(true);
  }
});

test("the right pane opens on its placeholder, with the course's group as its tools and the variety menu as their extras", () => {
  const right = english.querySelector(".sp-right");
  expect(right?.querySelector(".sp-body .sp-choose-t")?.textContent).toBe("Choose a topic");
  expect(right?.querySelector(".sp-body .sp-choose-s")?.textContent).toBe("Its parts open here.");
  expect(right?.querySelector(".sp-body .sp-choose svg")).not.toBeNull();
  const tools = right?.querySelectorAll(".sp-tools > [data-sp-tools]");
  expect(tools?.length).toBe(1);
  expect(tools?.[0]?.matches(".hm-group")).toBe(true);
  expect(tools?.[0]?.querySelector(".ix-level")).not.toBeNull();
  expect(tools?.[0]?.querySelector(".hm-read")).not.toBeNull();
  expect(english.querySelectorAll("[data-sp-extras]").length).toBe(1);
  expect(english.querySelector("#ix-varieties")?.hasAttribute("data-sp-extras")).toBe(true);
  expect(ukrainian.querySelector("[data-sp-extras]")).toBeNull();
});

test("the bar holds the search field, the phone's group and round Search button, Close and the variety menu", () => {
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
  expect(bar?.querySelector(".hm-group")?.hasAttribute("data-sp-tools")).toBe(false);
});

test("the group is the same in the bar and in the tools: Level, Variety, Read in", () => {
  const groups = [...english.querySelectorAll(".hm-group")];
  expect(groups.length).toBe(2);
  const kinds = (g: Element | undefined): string[] =>
    [...(g?.querySelectorAll(".ix-level, .ix-variety, .hm-read") ?? [])].map((el) => el.className.split(" ")[1] ?? el.className);
  expect(kinds(groups[0])).toEqual(kinds(groups[1]));
  expect(kinds(groups[0]).length).toBe(3);
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
