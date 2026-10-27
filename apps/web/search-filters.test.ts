// The filters of the Home's search: the course chip starts on all courses on the Home and on a course's own course on
// its index, which ticks that course in the menu; a chosen course shows its flag with its name; a course with
// varieties brings its variety chip, which names the variety in force, and its menu.
import { describe, expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { loadCurriculum } from "../../scripts/lib.ts";
import { searchFilters } from "./search-filters.ts";
import { ui } from "./ui.ts";

const { languages } = await loadCurriculum();
const build = (start?: string): Document => {
  const html = searchFilters(ui("en"), "en", languages, start);
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
  test("starts on the course a course index gives, ticked in its menu with its flag and name for the chip", () => {
    const spanish = languages.find((l) => l.code === "es");
    const code = spanish?.code ?? "";
    const d = build(code);
    expect(d.getElementById("hm-filters")?.getAttribute("data-start")).toBe(code);
    expect(course(d)?.textContent).toBe(`${spanish?.flag ?? ""} Spanish`);
    expect(ticked(d)).toEqual([code]);
    expect(d.querySelector(`#hm-f-course [data-course="${code}"]`)?.getAttribute("data-name")).toBe(`${spanish?.flag ?? ""} Spanish`);
  });
  test("starts on all courses when the course is unknown", () => {
    const d = build("zz");
    expect(d.getElementById("hm-filters")?.getAttribute("data-start")).toBe("");
    expect(ticked(d)).toEqual([""]);
  });
});

describe("the chips", () => {
  test("come in the Home's order: course, level, variety (hidden until its course is chosen), and no Read in", () => {
    const chips = [...build("es").querySelectorAll(".hm-fchip")];
    expect(chips.map((c) => c.getAttribute("data-filter") ?? c.getAttribute("data-variety-course") ?? "")).toEqual([
      "course",
      "level",
      ...languages.filter((l) => (l.varieties ?? []).length > 0).map((l) => l.code),
    ]);
    expect(chips.filter((c) => c.hasAttribute("hidden"))).toHaveLength(chips.length - 2);
    expect(build().getElementById("hm-f-read")).toBeNull();
  });
});

describe("the variety chip", () => {
  test("names the course's first variety, and its menu offers the course's varieties with the first ticked", () => {
    const d = build();
    const english = languages.find((l) => l.code === "en");
    const chip = d.querySelector('[data-variety-course="en"]');
    expect(chip?.textContent).toBe("Variety: UK");
    expect(chip?.querySelector("[data-variety-of]")?.textContent).toBe("UK");
    const items = [...d.querySelectorAll("#hm-f-variety-en [data-set-variety]")];
    expect(items.map((i) => i.getAttribute("data-set-variety"))).toEqual(english?.varieties ?? []);
    expect(items.map((i) => i.getAttribute("aria-checked"))).toEqual(items.map((_, at) => String(at === 0)));
  });
});
