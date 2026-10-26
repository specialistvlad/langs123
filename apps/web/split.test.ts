// The split view's markup (split.ts) and the pages built on it: the Home's panes with its placeholder and item links,
// the credits page showing the credits in the right pane beside the Home's left pane.
import { describe, expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { parseHTML } from "linkedom";
import { ENABLED_EXPLAIN } from "../../scripts/lib.ts";
import { choose, CHOOSE_COURSE, listButton, split } from "./split.ts";
import { readPage } from "./test-site.ts";
import { ui } from "./ui.ts";
import { creditsUrl, homeUrl, trackUrl } from "./urls.ts";

const parse = (html: string): Document => parseHTML(`<html><body>${html}</body></html>`).document;

describe("split()", () => {
  const html = split({ t: ui("en"), left: "<p id=l>a</p>", tools: "<b id=t></b>", body: "<i id=b></i>" });
  const doc = parse(html);
  test("puts the page, the divider, the tools and the body in their places", () => {
    expect([...(doc.querySelector(".sp")?.children ?? [])].map((el) => (el.className === "" ? el.tagName : el.className))).toEqual([
      "SCRIPT",
      "sp-left",
      "sp-div",
      "sp-right",
    ]);
    expect(doc.querySelector(".sp-left #l")).not.toBeNull();
    expect(doc.querySelector(".sp-right > .sp-tools #t")).not.toBeNull();
    expect(doc.querySelector(".sp-right > .sp-body #b")).not.toBeNull();
    const divider = doc.querySelector(".sp-div");
    expect([divider?.getAttribute("role"), divider?.getAttribute("aria-label"), divider?.getAttribute("title")]).toEqual([
      "separator",
      ui("en").resizeList,
      ui("en").resizeList,
    ]);
  });
  test("names the open item and the modifier classes when the page gives them", () => {
    expect(doc.querySelector(".sp")?.className).toBe("sp");
    expect(doc.querySelector(".sp")?.hasAttribute("data-sp-open")).toBe(false);
    const open = parse(split({ t: ui("en"), cls: "sp-home sp-item", left: "", tools: "", body: "", open: "/credits/" })).querySelector(
      ".sp",
    );
    expect([open?.className, open?.getAttribute("data-sp-open")]).toEqual(["sp sp-home sp-item", "/credits/"]);
  });
  test("sets the reader's state before the panes paint", () => {
    const script = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>"));
    const run = (stored: Record<string, string>, search: string): Record<string, unknown> => {
      const el = {
        dataset: {} as Record<string, string>,
        style: {
          props: {} as Record<string, string>,
          setProperty(k: string, v: string) {
            this.props[k] = v;
          },
        },
      };
      runInNewContext(script, {
        document: { currentScript: { parentElement: el } },
        localStorage: { getItem: (k: string) => stored[k] ?? null },
        location: { search },
      });
      return { ...el.dataset, ...el.style.props };
    };
    expect(run({}, "")).toEqual({ split: "equal" });
    expect(run({ "ln-split": "slim", "ln-split-w": "0.4" }, "?open=/en/english/")).toEqual({
      split: "slim",
      spPending: "",
      "--sp-w": "40%",
    });
    expect(run({ "ln-split": "other", "ln-split-w": "0.9" }, "")).toEqual({ split: "equal" });
  });
});

test("the list button names its first step in the page's language and carries the other two", () => {
  for (const e of ENABLED_EXPLAIN) {
    const t = ui(e);
    const button = parse(listButton(t)).querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe(t.narrowList);
    expect(JSON.parse(button?.getAttribute("data-sp-labels") ?? "{}")).toEqual({
      equal: t.narrowList,
      slim: t.hideList,
      hidden: t.showList,
    });
  }
});

test("the placeholder names what to choose and what opens", () => {
  const el = parse(choose({ title: "Choose <x>", hint: "Opens here.", icon: CHOOSE_COURSE })).querySelector("[data-sp-choose]");
  expect([
    el?.querySelector("svg") === null,
    el?.querySelector(".sp-choose-t")?.textContent,
    el?.querySelector(".sp-choose-s")?.textContent,
  ]).toEqual([false, "Choose <x>", "Opens here."]);
});

describe.each(ENABLED_EXPLAIN)("the Home and the credits page in %s", (e) => {
  const file = (url: string): string => `${url.slice(1)}index.html`;
  const t = ui(e);
  test("the Home's left pane holds the title row, the search and the courses; its right pane asks for a course", async () => {
    const doc = await readPage(file(homeUrl(e)));
    expect([...doc.querySelectorAll(".sp-left > :not(noscript)")].map((el) => el.className.split(" ")[0] ?? "")).toEqual([
      "sp-title",
      "hm-bar",
      "hm-main",
    ]);
    expect([...doc.querySelectorAll(".sp-title > *")].map((el) => el.className.split(" ")[0] ?? "")).toEqual([
      "hm-brand",
      "sp-group",
      "sp-list",
    ]);
    expect(doc.querySelector(".sp-div")?.getAttribute("aria-label")).toBe(t.resizeList);
    expect(doc.querySelector(".sp-body .sp-choose-t")?.textContent).toBe(t.chooseCourse);
    expect(doc.querySelector(".sp-body .sp-choose-s")?.textContent).toBe(t.chooseCourseHint);
    expect(doc.querySelector(".sp")?.hasAttribute("data-sp-open")).toBe(false);
    expect(doc.querySelector(".sp-tools .hm-read")).not.toBeNull();
  });
  test("a course card is an item: its name and its chips lead to the course and the card is its unit", async () => {
    const doc = await readPage(file(homeUrl(e)));
    for (const card of doc.querySelectorAll(".hm-card")) {
      expect(card.hasAttribute("data-sp-unit")).toBe(true);
      const links = [...card.querySelectorAll("a[data-sp-item]")];
      expect(links.length).toBe(card.querySelectorAll("a").length);
      expect(links.every((a) => /^\/[a-z]{2}\/[a-z-]+\/$/.test(a.getAttribute("href") ?? ""))).toBe(true);
    }
    // The course a card opens declares what the Home's pane shows of it: its list, its tools and their menus.
    const course = await readPage(file(trackUrl("en", { slug: "english" })));
    expect(course.querySelectorAll("[data-sp-fragment]").length).toBe(1);
    expect(course.querySelectorAll("[data-sp-tools]").length).toBeGreaterThan(0);
    expect(doc.querySelector(".sp-title a[data-sp-item]")?.getAttribute("href")).toBe(creditsUrl(e));
    expect(doc.querySelector(`a[href="${trackUrl("en", { slug: "english" })}"]`)).not.toBeNull();
  });
  test("the credits page shows the credits in the right pane with Close, and the Home's panes on the left", async () => {
    const doc = await readPage(file(creditsUrl(e)));
    expect(doc.querySelector(".sp")?.getAttribute("data-sp-open")).toBe(creditsUrl(e));
    expect(doc.querySelector(".sp")?.className).toBe("sp sp-home sp-credits sp-item");
    expect(doc.querySelector(".sp-left .hm-card")).not.toBeNull();
    const close = doc.querySelector(".sp-tools a[data-sp-close][data-sp-tools]");
    expect([close?.getAttribute("href"), close?.getAttribute("aria-label")]).toEqual([homeUrl(e), t.closeCredits]);
    expect(doc.querySelectorAll("[data-sp-fragment]").length).toBe(1);
    expect(doc.querySelector(".sp-body > .pg-up")?.getAttribute("href")).toBe(homeUrl(e));
    expect(doc.querySelector("[data-sp-fragment] > .cr-heading")).not.toBeNull();
    expect(doc.querySelectorAll(".cr-col, .cr-cols").length).toBe(0);
  });
});
