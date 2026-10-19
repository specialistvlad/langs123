// A count takes the form its language's plural rules pick for the number.
import { expect, test } from "bun:test";
import { count } from "./lib.ts";

test("a count picks the plural form of its language", () => {
  expect([1, 2, 46].map((n) => count("topics", "en", n))).toEqual(["1 topic", "2 topics", "46 topics"]);
  expect([1, 3, 46].map((n) => count("topics", "uk", n))).toEqual(["1 тема", "3 теми", "46 тем"]);
  expect(count("topics", "tr", 46)).toBe("46 konu");
  expect(() => count("pages", "en", 1)).toThrow('interface.yaml has no count "pages" in "en"');
});
