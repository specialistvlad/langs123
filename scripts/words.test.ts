// Words as reading times and word limits count them: the runs between spaces, and Japanese words inside a run.
import { expect, test } from "bun:test";
import { words } from "./words.ts";

test("words are the runs between spaces", () => {
  expect(words("  I went home — then left. ")).toEqual(["I", "went", "home", "—", "then", "left."]);
});

test("a run of Japanese is its words, its punctuation left out", () => {
  expect(words("こんにちは、世界！")).toEqual(["こんにちは", "世界"]);
  expect(words("。")).toEqual([]);
  expect(words("私は学生です。").length).toBeGreaterThanOrEqual(3);
  expect(words("is 学生 here")).toEqual(["is", "学生", "here"]);
});
