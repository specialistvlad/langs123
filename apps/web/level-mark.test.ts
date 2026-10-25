// The level mark: seven bars with the levels a part holds lit, the range in words from lowest to highest beside them
// on every mark, and the button that opens the level popover.
import { expect, test } from "bun:test";
import { parseHTML } from "linkedom";
import { bars, levelsLabel, levelsOf, markButton, rangeText } from "./level-mark.ts";

const lit = (html: string): string[] =>
  [...parseHTML(`<div>${html}</div>`).document.querySelectorAll("i.on")].map((i) => i.className.split(" ")[0] ?? "");

test("a range's levels run from its lowest to its highest", () => {
  expect(levelsOf({ from: "A2", to: "B2" })).toEqual(["A2", "B1", "B2"]);
});

test("the range in words names the lowest level and the highest, across a gap too", () => {
  expect(rangeText(["A0", "A1", "A2", "B1", "B2", "C1", "C2"])).toBe("A0–C2");
  expect(rangeText(["A1", "A2", "B2", "C1"])).toBe("A1–C1");
  expect(rangeText(["A0"])).toBe("A0");
  expect(rangeText([])).toBe("");
});

test("a mark draws all seven bars, lights the levels it is given, and reads them out", () => {
  const html = bars(["A1", "B2"], "en", { small: true });
  expect(lit(html)).toEqual(["lv-A1", "lv-B2"]);
  expect(html).toContain('class="lvm lvm-sm"');
  expect(html).toContain(`aria-label="${levelsLabel(["A1", "B2"], "en")}"`);
  expect(bars([], "en")).toBe("");
});

test("every mark, small or regular, a plain image or a button, carries its range in words", () => {
  expect(bars(["A0", "A1"], "en")).toContain('<span class="lvm-t">A0–A1</span>');
  expect(bars(["B2"], "en", { small: true })).toContain('<span class="lvm-t">B2</span>');
  expect(markButton(["A1", "B2", "C1"], "s3", "")).toContain('<span class="lvm-t">A1–C1</span>');
  expect(markButton(["B1"], "s3", "", { small: true })).toContain('<span class="lvm-t">B1</span>');
});

test("a mark as a button opens the level popover on its entry", () => {
  const html = markButton(["B1"], "s3", "Level B1", { small: true });
  expect(html).toContain('data-lv="s3"');
  expect(html).toContain('popovertarget="lv-pop"');
  expect(html).toContain("lvm-sm");
  expect(lit(html)).toEqual(["lv-B1"]);
  expect(markButton([], "s3", "")).toBe("");
});
