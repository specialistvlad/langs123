// The topic page's split view on the built page: the left pane holds Back to the course, the list button and the title
// in its title row, the search, and the contents; the right pane holds the glass group of Level, Variety and Read in
// and the lesson; on a phone the up link stands in the lesson's title row and the bottom bar holds Contents, then
// Level, Variety and Read in, then Search. The Level button opens the level popover headed by the course, whose entry
// sits in the page's level data beside the topic's; the search holds the course's filters and the results.
import { describe, expect, test } from "bun:test";
import { readPage, testSite } from "./test-site.ts";

await testSite();
const topic = await readPage("en/english/verbs/to-be/index.html");
const spanish = await readPage("uk/spanish/presente/presente-regular/index.html");

describe("the topic page's split view", () => {
  test("the page is a split holding its own lesson", () => {
    const split = topic.querySelector(".sp.sp-topic.sp-item");
    expect(split?.getAttribute("data-sp-open")).toBe("/en/english/verbs/to-be/");
    expect(split?.querySelector(":scope > .sp-right .sp-body .tp-wrap")).not.toBeNull();
    expect(split?.querySelector(":scope > .sp-left")).not.toBeNull();
  });

  test("the left title row holds Back to the course, the list button, then the title", () => {
    const row = topic.querySelector(".sp-left > .sp-title");
    const [back, list, name] = [...(row?.children ?? [])];
    expect(back?.matches("a.sp-back")).toBe(true);
    expect(back?.getAttribute("href")).toBe("/en/english/");
    expect(back?.getAttribute("aria-label")).toBe("English");
    expect(list?.matches("button.sp-list[data-sp-list]")).toBe(true);
    expect(name?.matches("span.tp-name")).toBe(true);
    expect(name?.textContent).toBe(topic.querySelector(".tp-head h1")?.textContent);
    expect(row?.children.length).toBe(3);
  });

  test("the search sits under the title row, over the contents, which a query hides for the results", () => {
    const left = topic.querySelector(".sp-left");
    expect([...(left?.children ?? [])].map((el) => el.className)).toEqual(["sp-title", "hm-bar tp-sbar", "hm-main tp-results"]);
    expect([...(left?.querySelectorAll(".tp-sbar > *") ?? [])].map((el) => el.id)).toEqual(["hm-form", "hm-close"]);
    expect(left?.querySelector(".tp-results > #hm-cards .tp-contents .toc")).not.toBeNull();
    expect(left?.querySelector(".tp-results #hm-results #hm-list")).not.toBeNull();
    expect(left?.querySelector("#hm-filters")?.getAttribute("data-start")).toBe("en");
  });

  test("the contents list each part with a chevron, the sheet's the same parts without", () => {
    const rows = [...topic.querySelectorAll("#hm-cards .toc a")];
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.every((a) => a.querySelector(".tp-n") !== null && a.querySelector(".lvm") !== null)).toBe(true);
    expect(rows.every((a) => a.querySelector(".tp-chev") !== null)).toBe(true);
    const sheet = [...topic.querySelectorAll("#tp-contents .toc a")];
    expect(sheet.map((a) => a.getAttribute("href"))).toEqual(rows.map((a) => a.getAttribute("href")));
    expect(sheet.some((a) => a.querySelector(".tp-chev") !== null)).toBe(false);
  });

  test("the right pane's tools hold the group of Level, Variety and Read in, the bar's the same group", () => {
    const tools = topic.querySelector(".sp-right > .sp-tools > .hm-group");
    expect(tools?.querySelector(".tp-level")).not.toBeNull();
    expect(tools?.querySelector(".hm-read")).not.toBeNull();
    expect(topic.querySelector(".sp-tools #ix-varieties")).toBeNull();
    const group = topic.querySelector("nav.tp-bar > .hm-group:not(.tp-bar-left)");
    expect(group?.innerHTML).toBe(tools?.innerHTML);
  });
});

describe("what the course index takes into its right pane", () => {
  test("the page declares the parts fragment outside its panes, the tools' group and the variety menu", () => {
    const fragment = topic.querySelector("[data-sp-fragment]");
    expect(fragment?.matches(".tpp")).toBe(true);
    expect(fragment?.closest(".sp")).toBeNull();
    expect(topic.querySelectorAll("[data-sp-tools]").length).toBe(1);
    expect(topic.querySelector("[data-sp-tools]")?.matches(".sp-tools > .tp-tools")).toBe(true);
    expect(spanish.querySelector("#ix-varieties")?.hasAttribute("data-sp-extras")).toBe(true);
  });
});

describe("the topic page's phone layout", () => {
  test("the up link stands in the lesson's title row, before the title", () => {
    const row = topic.querySelector(".tp-head .title-row");
    expect(row?.firstElementChild?.matches("a.tp-up")).toBe(true);
    expect(row?.querySelector("h1")).not.toBeNull();
    expect(topic.querySelectorAll(".tp-up").length).toBe(1);
  });

  test("the bottom bar holds Contents, then the group, then Search", () => {
    const bar = topic.querySelector("nav.tp-bar");
    const order = [...(bar?.children ?? [])].map((el) => el.id || el.className.replace(/ glass/, ""));
    expect(order).toEqual(["hm-group tp-bar-left", "hm-group", "ix-search"]);
    expect(bar?.querySelector(".tp-bar-left [popovertarget='tp-contents']")).not.toBeNull();
    expect(bar?.querySelector("#hm-form, #hm-close, [popovertarget='tp-index']")).toBeNull();
  });
});

describe("the topic page's menus", () => {
  test("the Level button opens the level popover for the course, whose entry the level data holds with the topic's", () => {
    const button = topic.querySelector(".tp-level");
    expect(button?.getAttribute("popovertarget")).toBe("lv-pop");
    expect(button?.getAttribute("data-lv")).toBe("en");
    const data = JSON.parse(topic.querySelector("#lv-data")?.textContent ?? "{}") as Record<string, { t: string; k: string }>;
    expect(data["en"]).toMatchObject({ t: "English", k: "course" });
    expect(data["topic"]?.k).toBe("topic");
    expect(topic.querySelector("#tp-levels, #tp-index")).toBeNull();
  });

  test("the variety menu of a course with varieties sits outside the panes and the bar, headed by what it hides", () => {
    const menu = spanish.querySelector("#ix-varieties");
    expect(menu?.closest(".sp, nav.tp-bar")).toBeNull();
    expect(menu?.firstElementChild?.matches("p.ix-hint")).toBe(true);
    expect(menu?.querySelectorAll("[data-set-variety]").length).toBeGreaterThan(1);
  });
});
