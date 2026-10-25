// The level popover's markup: the element's name, bars and range filled in by the client, the line on hiding and seven
// rows from A0 to C2, the top one reading "Proficiency (All levels)". A course's level line joins the topics covering
// a level and those starting there as each language joins them: French with a no-break space before its semicolon,
// Japanese with the second part in brackets.
import { expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { LEVELS, levelName, loadCurriculum, loadTopics, say } from "../../scripts/lib.ts";
import { courseEntry, levelPopover } from "./level-popover.ts";

const curriculum = await loadCurriculum();
const english = (await loadTopics(curriculum)).filter((r) => r.lang === "en");

test("a course's line joins what covers a level and what starts there in the words of its language", () => {
  const a0 = (explain: "en" | "fr" | "ja"): string => courseEntry("", english, explain).l.A0 ?? "";
  expect(a0("en")).toMatch(/^\d+ topics? covers? A0; \d+ starts? here$/);
  expect(a0("fr")).toMatch(/\S\u00a0; \d/);
  expect(a0("ja")).toMatch(/^[^（]+（うち\d+トピックはここから始まる）$/);
});

const popover = (explain: "en" | "fr" | "ja"): Document => parseHTML(`<body>${levelPopover(explain)}</body>`).document;
const texts = (doc: Document, selector: string): string[] => [...doc.querySelectorAll(selector)].map((e) => e.textContent);

test("the popover has a head with the name, the seven bars and the range, then one line on hiding", () => {
  const doc = popover("en");
  const pop = doc.querySelector("#lv-pop");
  expect(pop?.hasAttribute("popover")).toBe(true);
  expect(pop?.getAttribute("aria-labelledby")).toBe("lv-pop-t");
  expect(doc.querySelector(".lv-pop-h #lv-pop-t")?.textContent).toBe("");
  expect([...doc.querySelectorAll(".lv-pop-h .lv-pop-m > i")].map((i) => i.className)).toEqual(LEVELS.map((l) => `lv-${l}`));
  expect(doc.querySelectorAll(".lv-pop-h .lv-pop-r").length).toBe(1);
  expect(texts(doc, ".lv-pop-note")).toEqual([say("levelHidden", "en")]);
  expect(doc.querySelector(".lv-pop-note")?.textContent).toBe("Content above the chosen level is hidden.");
});

test("the close button hides the popover and reads the interface's word for close", () => {
  for (const explain of ["en", "fr", "ja"] as const) {
    const close = popover(explain).querySelector("button.lv-pop-x");
    expect(close?.getAttribute("popovertarget")).toBe("lv-pop");
    expect(close?.getAttribute("popovertargetaction")).toBe("hide");
    expect(close?.getAttribute("aria-label")).toBe(say("close", explain));
  }
});

test("seven rows run from A0 to C2, each with its name, its one line and its pill, and no All levels row", () => {
  const doc = popover("en");
  const rows = [...doc.querySelectorAll(".lv-rows > .lv-row")];
  expect(rows.map((r) => r.getAttribute("data-row"))).toEqual([...LEVELS]);
  expect(rows.map((r) => r.getAttribute("data-set-level"))).toEqual([...LEVELS]);
  expect(rows.every((r) => r.getAttribute("role") === "menuitemradio" && r.getAttribute("aria-checked") === "false")).toBe(true);
  expect(texts(doc, ".lv-name")).toEqual([
    "Starter",
    "Beginner",
    "Elementary",
    "Intermediate",
    "Upper intermediate",
    "Advanced",
    "Proficiency (All levels)",
  ]);
  expect(rows.every((r) => (r.querySelector(".lv-sub")?.textContent ?? "") !== "")).toBe(true);
  expect(rows.map((r) => r.querySelector(".badge .half")?.textContent)).toEqual([...LEVELS]);
  expect(doc.querySelectorAll("[data-all], .lv-here").length).toBe(0);
  expect(doc.querySelectorAll(".lv-rows .badge .half").length).toBe(7);
});

test("the top row reads the All levels words with the top level's name, in each language, and the others read their names", () => {
  for (const explain of ["en", "fr", "ja"] as const) {
    const names = texts(popover(explain), ".lv-name");
    expect(names.slice(0, 6)).toEqual(LEVELS.slice(0, 6).map((l) => levelName(l, explain)));
    expect(names[6]).toBe(say("levelAllLevels", explain, { level: levelName("C2", explain) }));
    expect(names[6]).toContain(levelName("C2", explain));
  }
});
