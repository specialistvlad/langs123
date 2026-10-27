// A course index as built (pages/track.ts, course-column.ts): the topics column (the head with Home, Level and Group, the
// course's title with its flag once, the topic count and the Explained in line, the search, both groupings), the
// placeholder of the reading, the glass bar of Level, Variety, Group and More, the menus, the count with its text per
// chosen level, the Level button opening the level popover for the course, and the variety button of a course with
// varieties.
import { expect, test } from "bun:test";
import { LEVELS } from "../../scripts/lib.ts";
import { readPage } from "./test-site.ts";
import { homeUrl } from "./urls.ts";

const english = await readPage("en/english/index.html");
const spanish = await readPage("en/spanish/index.html");
const ukrainian = await readPage("en/ukrainian/index.html");
const tag = (el: Element): string => el.className.split(" ")[0] ?? el.tagName;

test("the page is two columns: the course's topics, and the reading, which opens on its placeholder", () => {
  const page = english.querySelector(".cl");
  expect(page?.getAttribute("data-cl")).toBe("track");
  expect([...(page?.children ?? [])].map(tag)).toEqual(["cl-side", "cl-main"]);
  expect(english.documentElement.getAttribute("data-page")).toBe("track");
  const choose = page?.querySelector(".cl-main > .cl-choose");
  expect(choose?.querySelector(".cl-choose-t")?.textContent).toBe("Choose a topic");
  expect(choose?.querySelector(".cl-choose-s")?.textContent).toBe("Its parts open here.");
  expect(choose?.querySelector("svg")).not.toBeNull();
});

test("the head holds Home, the toolbar line's Level and Group, the title with the flag once, the count and the line", () => {
  const head = english.querySelector(".cl-side > .cl-top > .cl-head");
  expect([...(head?.children ?? [])].map(tag)).toEqual(["ix-up", "hm-group", "cl-name", "ix-count", "cl-line"]);
  expect(head?.querySelector("a.ix-up")?.getAttribute("href")).toBe(homeUrl("en"));
  const tools = head?.querySelector(".cl-tools");
  expect([...(tools?.children ?? [])].map((el) => el.className.split(" ")[1])).toEqual(["ix-level", "ix-group"]);
  expect(head?.querySelector("h1.cl-name")?.textContent).toContain("English");
  expect(english.querySelectorAll(".ix-flag").length).toBe(1);
  expect(head?.querySelector(".ix-count")?.textContent).toMatch(/^\d+ topics$/);
  expect(english.querySelectorAll(".ix-up").length).toBe(1);
});

test("the line is the count and the Explained in button, which holds the course's languages for the Languages client", () => {
  const line = english.querySelector(".cl-line");
  expect(line?.querySelector(".cl-n")?.textContent).toMatch(/^\d+ topics$/);
  const button = line?.querySelector("button.xl-line");
  expect(button?.getAttribute("type")).toBe("button");
  expect(button?.getAttribute("data-course")).toBe("en");
  expect(button?.getAttribute("data-explains")?.split(" ")[0]).toBe("en");
  expect(button?.textContent).toBe("Explained in: English");
  expect(button?.querySelector("b")?.textContent).toBe("English");
  expect(button?.querySelector("svg")).toBeNull();
  expect(ukrainian.querySelector(".cl-line .xl-line")?.textContent).toBe("Explained in: English");
});

test("the column holds the search under the head and the topics in both groupings, the results in their place", () => {
  const side = [...(english.querySelector(".cl-side")?.children ?? [])].map((el) => el.id || tag(el));
  expect(side).toEqual(["cl-top", "hm-cards", "hm-results", "ix-fade"]);
  const flows = [...english.querySelectorAll("#hm-cards > .ix-flow")];
  expect(flows.map((f) => f.getAttribute("data-order"))).toEqual(["categories", "path"]);
  for (const row of english.querySelectorAll(".ix-rows > li:not(.ix-more)")) expect(row.querySelector("a.ix-cover")).not.toBeNull();
  expect(english.querySelector(".cl-top > .cl-nav")).not.toBeNull();
  expect(english.querySelector("[data-current]")).toBeNull();
  expect(english.querySelectorAll("[data-sp-item], .sp, .ix-seg").length).toBe(0);
});

test("the nav holds the search field, Close, the glass bar and the phone's round Search button", () => {
  const nav = english.querySelector("nav.cl-nav");
  expect([...(nav?.children ?? [])].map((el) => el.id || tag(el))).toEqual(["hm-form", "hm-close", "hm-group", "ix-search"]);
  const button = english.querySelector("#ix-search");
  expect(button?.tagName).toBe("BUTTON");
  expect(button?.getAttribute("aria-label")).toBe(english.querySelector("#hm-q")?.getAttribute("aria-label"));
  expect(button?.querySelector("svg")).not.toBeNull();
});

test("the glass bar ends with More, after Level, Variety and Group; the Home's More menu opens from it", () => {
  const kinds = (g: Element | null): string[] =>
    [...(g?.children ?? [])].map((el) => (el.matches(".hm-more") ? "more" : (el.className.split(" ")[1] ?? el.className)));
  expect(kinds(english.querySelector(".cl-bar"))).toEqual(["ix-level", "ix-variety", "ix-group", "more"]);
  expect(kinds(ukrainian.querySelector(".cl-bar"))).toEqual(["ix-level", "ix-group", "more"]);
  expect(english.querySelector(".cl-bar .hm-more")?.getAttribute("popovertarget")).toBe("hm-more");
  expect(english.querySelectorAll("#hm-more").length).toBe(1);
  expect(english.querySelector(".hm-read, .hm-folds")).toBeNull();
});

test("Group opens Group by with Categories and By level", () => {
  const buttons = [...english.querySelectorAll(".ix-group")];
  expect(buttons.length).toBe(2);
  for (const button of buttons) {
    expect(button.getAttribute("popovertarget")).toBe("ix-groups");
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(button.getAttribute("aria-label")).toBe("Group by");
  }
  const menu = english.querySelector("#ix-groups");
  expect(menu?.getAttribute("aria-label")).toBe("Group by");
  expect(menu?.querySelector(".ix-menu-h")?.textContent).toBe("Group by");
  const items = [...(menu?.querySelectorAll(".ix-item") ?? [])];
  expect(items.map((el) => [el.getAttribute("data-set-order"), el.querySelector(".ix-title")?.textContent])).toEqual([
    ["categories", "Categories"],
    ["path", "By level"],
  ]);
  expect(items.every((el) => el.getAttribute("role") === "menuitemradio")).toBe(true);
});

test("the count has its text for every level, a topic counting from its lowest level up, the top level's text on the page", () => {
  const count = english.querySelector(".cl-head .ix-count");
  const texts = JSON.parse(count?.getAttribute("data-counts") ?? "{}") as Record<string, string>;
  expect(Object.keys(texts)).toEqual([...LEVELS]);
  const numbers = LEVELS.map((level) => Number.parseInt(texts[level] ?? "", 10));
  expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  expect(texts[LEVELS.at(-1) ?? ""]).toBe(count?.textContent ?? "");
  expect(numbers[0]).toBeLessThan(numbers.at(-1) ?? 0);
  expect(english.querySelector(".cl-n")?.getAttribute("data-counts")).toBe(count?.getAttribute("data-counts") ?? "");
});

test("the Level button names the chosen level alone and opens the level popover for the course under its group", () => {
  const buttons = [...english.querySelectorAll(".ix-level")];
  expect(buttons.length).toBe(2);
  for (const button of buttons) {
    expect(button.getAttribute("popovertarget")).toBe("lv-pop");
    expect(button.getAttribute("aria-haspopup")).toBe("dialog");
    expect(button.getAttribute("data-lv-under")).toBe(".cl-tools, .cl-bar");
    expect(button.querySelector(".lvm")).toBeNull();
    const names = JSON.parse(button.querySelector("[data-level-label]")?.getAttribute("data-names") ?? "{}") as Record<string, string>;
    expect(names["B1"]).toBe("Intermediate");
  }
  // The course's entry in the page's level data names the course and the levels the button holds; topics have none.
  const data = JSON.parse(english.querySelector("#lv-data")?.textContent ?? "{}") as Record<string, { t: string; k: string; l: object }>;
  const [button] = buttons;
  const entry = data[button?.getAttribute("data-lv") ?? ""];
  expect([entry?.t, entry?.k]).toEqual(["English", "course"]);
  expect(button?.getAttribute("data-lv-levels")).toBe(Object.keys(entry?.l ?? {}).join(" "));
  expect(Object.keys(data)).toEqual([button?.getAttribute("data-lv") ?? ""]);
});

test("a course with varieties has a Variety button with the globe, naming the variety, and its menu", () => {
  for (const doc of [english, spanish]) {
    const button = doc.querySelector(".cl-bar .ix-variety");
    expect(button?.getAttribute("popovertarget")).toBe("ix-varieties");
    expect(button?.querySelector("svg circle")).not.toBeNull();
    expect(button?.querySelector("[data-variety-label]")?.textContent).not.toBe("");
    expect(doc.querySelectorAll("#ix-varieties .ix-item[data-set-variety]").length).toBeGreaterThan(1);
  }
  expect(ukrainian.querySelector(".ix-variety, #ix-varieties")).toBeNull();
});
