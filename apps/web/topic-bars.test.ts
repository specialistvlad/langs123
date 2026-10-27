// The topic page on the built page (pages/topic.ts, course-column.ts, lesson-chrome.ts): the course's topics column with
// this topic marked, the reading with its head, lead, parts and the outline of the parts at its top right; on a phone the
// two pages of one document (the contents with Back to the course, the reading with Back to the contents) and the bottom
// bar of Level, Variety and More with Search; the Level button opening the level popover headed by the course, whose
// entry sits in the page's level data beside the topic's; the search holding the course's filters and the results.
import { describe, expect, test } from "bun:test";
import { readPage, testSite } from "./test-site.ts";

await testSite();
const topic = await readPage("en/english/verbs/to-be/index.html");
const spanish = await readPage("uk/spanish/presente/presente-regular/index.html");
const tag = (el: Element): string => el.className.split(" ")[0] ?? el.tagName;

describe("the two columns", () => {
  test("the page is the course's column with the topic marked, and the reading", () => {
    const page = topic.querySelector(".cl");
    expect(page?.getAttribute("data-cl")).toBe("topic");
    expect([...(page?.children ?? [])].map(tag)).toEqual(["cl-side", "cl-main"]);
    expect(topic.documentElement.getAttribute("data-page")).toBe("topic");
    expect(page?.querySelector(":scope > .cl-main > .tp-wrap")).not.toBeNull();
    const marked = [...topic.querySelectorAll("li[data-current] a[aria-current='true']")];
    expect(marked.length).toBeGreaterThan(0);
    expect(marked.every((a) => a.getAttribute("href")?.startsWith("/en/english/verbs/to-be/") === true)).toBe(true);
    expect(topic.querySelectorAll("#hm-cards .ix-flow").length).toBe(2);
  });

  test("the column is the course index's: its head, the flag once, the search over the topics", () => {
    const side = topic.querySelector(".cl-side");
    expect([...(side?.children ?? [])].map((el) => el.id || tag(el))).toEqual(["cl-top", "hm-cards", "hm-results", "ix-fade"]);
    expect(side?.querySelector(".cl-head .cl-name")?.tagName).toBe("P");
    expect(topic.querySelectorAll(".ix-flag").length).toBe(1);
    expect(topic.querySelector(".page-icon")).toBeNull();
    expect(topic.querySelectorAll("h1").length).toBe(1);
    expect(topic.querySelector("h1")?.closest(".tp-head")).not.toBeNull();
    expect(side?.querySelector("#hm-filters")?.getAttribute("data-start")).toBe("en");
    expect(side?.querySelector(".cl-line .xl-line")?.getAttribute("data-course")).toBe("en");
  });

  test("while the field searches a topic page shows Back to the course with the topic's title in the head", () => {
    const head = topic.querySelector(".cl-head");
    expect(head?.querySelector("a.cl-back")?.getAttribute("href")).toBe("/en/english/");
    expect(head?.querySelector(".cl-back")?.getAttribute("aria-label")).toBe("English");
    expect(head?.querySelector(".cl-topic")?.textContent).toBe(topic.querySelector(".tp-head h1")?.textContent);
  });

  test("the bar holds Level, Variety and 文A, with Group in the head's toolbar line alone", () => {
    const kinds = (bar: Element | null): string[] =>
      [...(bar?.children ?? [])].map((el) => (el.matches(".hm-langs") ? "langs" : (el.className.split(" ")[1] ?? "")));
    expect(kinds(topic.querySelector(".cl-bar"))).toEqual(["ix-level", "ix-variety", "langs"]);
    expect(kinds(spanish.querySelector(".cl-bar"))).toEqual(["ix-level", "ix-variety", "langs"]);
    expect(topic.querySelectorAll(".hm-more, #hm-more").length).toBe(0);
    expect(topic.querySelectorAll(".ix-group").length).toBe(1);
    expect(topic.querySelector(".cl-tools .ix-group")).not.toBeNull();
    expect(topic.querySelector("#ix-groups")).not.toBeNull();
    expect(topic.querySelector(".hm-read, .tp-bar, .tp-sheet, .tp-btn, .sp")).toBeNull();
  });
});

describe("the reading", () => {
  test("the head holds Back to the course and Back to the contents, then the title, the tag and note slots, the props", () => {
    const head = topic.querySelector(".tp-head");
    const row = head?.querySelector(".title-row");
    expect([...(row?.children ?? [])].map((el) => el.tagName.toLowerCase())).toEqual(["a", "a", "h1", "span"]);
    expect(row?.querySelector(".tp-back-c")?.getAttribute("href")).toBe("/en/english/");
    expect(row?.querySelector(".tp-back-r")?.getAttribute("href")).toBe("/en/english/verbs/to-be/");
    expect(row?.querySelector(".tp-back-r")?.getAttribute("aria-label")).toBe(topic.querySelector(".tp-parts .tp-caps")?.textContent);
    expect(row?.querySelector("h1 + [data-xl-tag][hidden]")).not.toBeNull();
    expect(head?.querySelector(".title-row + [data-xl-note][hidden]")).not.toBeNull();
    expect(head?.getAttribute("data-course")).toBe("en");
    expect(head?.getAttribute("data-course-explains")?.split(" ")[0]).toBe("en");
    expect(head?.getAttribute("data-topic-explains")).not.toBe("");
    expect(head?.querySelector(".props .lvm-b")).not.toBeNull();
  });

  test("the lead, the parts' list and the body are one article's: the parts' list leaves the reading's article", () => {
    const main = topic.querySelector(".tp-main");
    expect([...(main?.children ?? [])].map(tag)).toEqual(["doc", "tp-parts"]);
    expect(
      [...(main?.querySelector(".doc")?.children ?? [])].map((el) => el.tagName.toLowerCase() + (el.className === "" ? "" : `.${tag(el)}`)),
    ).toEqual(["blockquote", "div.tp-body"]);
    expect(main?.querySelectorAll(".tp-body > .sections > section.part").length).toBeGreaterThan(1);
  });

  test("the parts' rows list each part with its number, title and chevron, and no level mark", () => {
    const rows = [...topic.querySelectorAll(".tp-parts .tp-list a")];
    const parts = [...topic.querySelectorAll(".tp-body .sections > section.part")];
    expect(rows.length).toBe(parts.length);
    expect(rows.map((a) => a.getAttribute("href"))).toEqual(parts.map((p) => `#${p.id}`));
    expect(rows[0]?.querySelector(".tp-n")?.textContent).toBe("00");
    expect(rows.every((a) => a.querySelector(".tp-chev") !== null && a.querySelector(".lvm") === null)).toBe(true);
    expect(rows.map((a) => a.classList.contains("on"))).toEqual(rows.map((_, i) => i === 0));
  });

  test("the outline lists the same parts, Contents over number and title, the first marked, no level mark or chevron", () => {
    const outline = topic.querySelector("nav.tp-outline");
    expect(outline?.querySelector(".tp-caps")?.textContent).toBe(topic.querySelector(".tp-parts .tp-caps")?.textContent);
    const links = [...(outline?.querySelectorAll("a") ?? [])];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      [...topic.querySelectorAll(".tp-parts .tp-list a")].map((a) => a.getAttribute("href")),
    );
    expect(links.map((a) => a.querySelector("b")?.textContent)).toEqual(links.map((_, i) => String(i).padStart(2, "0")));
    expect(links.map((a) => a.classList.contains("on"))).toEqual(links.map((_, i) => i === 0));
    expect(links[0]?.getAttribute("aria-current")).toBe("location");
    expect(outline?.querySelector(".lvm, .tp-chev, svg")).toBeNull();
    expect(topic.querySelector(".toc")).toBeNull();
  });
});

describe("the topic page's menus", () => {
  test("the Level button opens the level popover for the course, whose entry the level data holds with the topic's", () => {
    const button = topic.querySelector(".cl-bar .ix-level");
    expect(button?.getAttribute("popovertarget")).toBe("lv-pop");
    expect(button?.getAttribute("data-lv")).toBe("en");
    expect(button?.getAttribute("data-lv-under")).toBe(".cl-tools, .cl-bar");
    const data = JSON.parse(topic.querySelector("#lv-data")?.textContent ?? "{}") as Record<string, { t: string; k: string }>;
    expect(data["en"]).toMatchObject({ t: "English", k: "course" });
    expect(data["topic"]?.k).toBe("topic");
    expect(topic.querySelector("#tp-levels, #tp-index")).toBeNull();
  });

  test("the variety menu of a course with varieties is headed by what the choice hides", () => {
    const menu = spanish.querySelector("#ix-varieties");
    expect(menu?.closest(".cl, nav")).toBeNull();
    expect(menu?.firstElementChild?.matches("p.ix-hint")).toBe(true);
    expect(menu?.querySelectorAll("[data-set-variety]").length).toBeGreaterThan(1);
    expect(spanish.querySelector(".cl-bar .ix-variety")?.getAttribute("popovertarget")).toBe("ix-varieties");
  });
});
