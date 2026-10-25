// The filters of the Home's search: the course chip starts on all courses on the Home and on a course's own course on
// its index, which ticks that course in the menu; a course with varieties brings its variety chip and menu.
import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { loadCurriculum } from "../../scripts/lib.ts";
import { readChoices } from "./context.ts";
import { searchFilters } from "./search-filters.ts";
import { ui } from "./ui.ts";
import { homeUrl } from "./urls.ts";

const { languages } = await loadCurriculum();
const build = (start?: string): Document => {
  const html = searchFilters(ui("en"), "en", languages, readChoices("en", homeUrl), start);
  return parseHTML(`<main>${html}</main>`).document;
};
const course = (d: Document): Element | null => d.querySelector('[data-filter="course"]');
const ticked = (d: Document): (string | null | undefined)[] =>
  [...d.querySelectorAll('#hm-f-course [aria-checked="true"]')].map((i) => i.getAttribute("data-course"));

describe("the course chip", () => {
  test("starts on all courses on the Home", () => {
    const d = build();
    expect(d.getElementById("hm-filters")?.getAttribute("data-start")).toBe("");
    expect(course(d)?.textContent).toBe("All courses");
    expect(ticked(d)).toEqual([""]);
  });
  test("starts on the course a course index gives, ticked in its menu with its name for the chip", () => {
    const code = languages.find((l) => l.code === "es")?.code ?? "";
    const d = build(code);
    expect(d.getElementById("hm-filters")?.getAttribute("data-start")).toBe(code);
    expect(course(d)?.textContent).toBe("Spanish");
    expect(ticked(d)).toEqual([code]);
    expect(d.querySelector(`#hm-f-course [data-course="${code}"]`)?.getAttribute("data-name")).toBe("Spanish");
  });
  test("starts on all courses when the course is unknown", () => {
    const d = build("zz");
    expect(d.getElementById("hm-filters")?.getAttribute("data-start")).toBe("");
    expect(ticked(d)).toEqual([""]);
  });
});

describe("the chips", () => {
  test("come in the Home's order: course, level, variety (hidden until its course is chosen), Read in", () => {
    const chips = [...build("es").querySelectorAll(".hm-fchip")];
    expect(chips.map((c) => c.getAttribute("data-filter") ?? c.getAttribute("data-variety-course") ?? "read")).toEqual([
      "course",
      "level",
      ...languages.filter((l) => (l.varieties ?? []).length > 0).map((l) => l.code),
      "read",
    ]);
    expect(chips.filter((c) => c.hasAttribute("hidden"))).toHaveLength(chips.length - 3);
  });
});
