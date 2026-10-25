// The topics offered when a query finds nothing: up to four distinct ones the filters allow, drawn with the random
// source given, and each shown as a result row with no term in bold.
import { expect, test } from "bun:test";
import { resultOf, suggest, type Topic } from "./search-find.ts";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const topic = (order: number, code: string, lowest: string): Topic => ({
  title: `Topic ${String(order)}`,
  url: "",
  levels: [lowest, "C2"],
  summary: `Lead ${String(order)}`,
  flag: "",
  course: code,
  other: "",
  otherLang: "",
  code,
  entry: {},
  id: `t${String(order)}`,
  order,
  t: `topic ${String(order)}`,
});
const topics = [
  topic(0, "en", "A0"),
  topic(1, "es", "A1"),
  topic(2, "en", "B1"),
  topic(3, "uk", "A0"),
  topic(4, "en", "A2"),
  topic(5, "en", "C1"),
];
const all = { course: "", upTo: "" };
// A random source that returns the given numbers in turn.
const source = (...values: number[]) => {
  let at = 0;
  return () => values[at++] ?? 0;
};
const ids = (list: Topic[]): string[] => list.map((t) => t.id);

test("four distinct topics are drawn, each drawn number picking one of those left", () => {
  expect(ids(suggest(topics, all, LEVELS, source(0, 0, 0, 0)))).toEqual(["t0", "t1", "t2", "t3"]);
  expect(ids(suggest(topics, all, LEVELS, source(0.99, 0.99, 0.99, 0.99)))).toEqual(["t5", "t4", "t3", "t2"]);
  expect(ids(suggest(topics, all, LEVELS, source(0.5, 0.2, 0.7, 0.1)))).toEqual(["t3", "t1", "t4", "t0"]);
});

test("a fresh draw can differ: the real random source gives distinct topics each time", () => {
  for (let i = 0; i < 50; i++) {
    const drawn = ids(suggest(topics, all, LEVELS, Math.random));
    expect([drawn.length, new Set(drawn).size]).toEqual([4, 4]);
  }
});

test("only the topics the filters allow are drawn: the course, and those starting at or below the level", () => {
  expect(ids(suggest(topics, { course: "en", upTo: "" }, LEVELS, source(0, 0, 0, 0)))).toEqual(["t0", "t2", "t4", "t5"]);
  expect(ids(suggest(topics, { course: "", upTo: "A1" }, LEVELS, source(0, 0, 0, 0)))).toEqual(["t0", "t1", "t3"]);
  expect(ids(suggest(topics, { course: "en", upTo: "A2" }, LEVELS, source(0.99, 0)))).toEqual(["t4", "t0"]);
});

test("fewer than four allowed gives what there is, none allowed gives none, and the list given stays whole", () => {
  expect(ids(suggest(topics, { course: "uk", upTo: "" }, LEVELS, source(0)))).toEqual(["t3"]);
  expect(suggest(topics, { course: "fr", upTo: "" }, LEVELS, source(0))).toEqual([]);
  expect(suggest([], all, LEVELS, source(0))).toEqual([]);
  expect(topics.length).toBe(6);
});

test("a count other than four caps the draw", () => {
  expect(ids(suggest(topics, all, LEVELS, source(0, 0), 2))).toEqual(["t0", "t1"]);
});

test("a topic shows as a result: its caption, and its lead with the terms in bold, none when there are none", () => {
  const other = { ...topic(0, "en", "A0"), other: "English" };
  expect(resultOf(other, [], "Explained in {name}")).toEqual({ topic: other, caption: "Explained in English", lead: [["Lead 0", false]] });
  expect(resultOf(other, ["lead"], "").lead).toEqual([
    ["Lead", true],
    [" 0", false],
  ]);
});
