// The Home search's index: words weigh by where they stand and how few topics hold them, each word keeps its best
// topics, the index comes in parts by first letter, and a query reads a word still being typed or one letter off.
import { expect, test } from "bun:test";
import { BEST, fold, type Index, indexOf, oneEdit, partOf, partsOf, readings, scores, tokens, type TopicWords } from "./search-index.ts";

const topic = (title: string, lead = "", strong = "", body = ""): TopicWords => ({
  title: tokens(title),
  lead: tokens(lead),
  strong: tokens(strong),
  body: tokens(body),
});
const TOPICS = [
  topic(
    "Questions and negatives",
    "Yes/no questions and wh-questions",
    "what who where",
    "What is it? Who is there? Where is it? what what",
  ),
  topic("Telling the time", "Hours and minutes", "o'clock", "What time is it?"),
  topic("Irregular verbs", "Past forms", "went gone", "go went gone"),
  topic("Passive voice", "Be and the past participle", "is made", "It is made in Spain."),
];
const index = indexOf(TOPICS);
const words = Object.keys(index);
const ranked = (terms: string[]): number[] => [...scores(index, words, terms)].sort((a, b) => b[1] - a[1]).map(([t]) => t);

test("words compare without case, accents and marks, and split at anything not a letter or digit", () => {
  expect(fold("Pretérito")).toBe("preterito");
  expect(tokens("Wh-questions, 2 forms")).toEqual(["wh", "questions", "2", "forms"]);
});

test("each word holds how many topics have it, then each topic with its weight, the best first", () => {
  expect(index["what"]?.[0]).toBe(2);
  expect(index["what"]?.[1]).toBe(0);
  expect(index["went"]).toEqual([1, 2, index["went"]?.[2] ?? 0]);
  expect((index["what"]?.[2] ?? 0) > (index["what"]?.[4] ?? 0)).toBe(true);
});

test("a word keeps the topics it weighs most in, at most BEST", () => {
  // Topic i says "shared" i + 1 times in a body of the same length; as many topics again never say it.
  const body = (i: number): string => `${"shared ".repeat(i + 1)}${"filler ".repeat(BEST + 4 - i)}`;
  const holding = Array.from({ length: BEST + 4 }, (_, i) => topic(`Topic ${String(i)}`, "", "", body(i)));
  const other = Array.from({ length: BEST + 4 }, (_, i) => topic(`Other ${String(i)}`, "", "", "filler ".repeat(BEST + 5)));
  const many = indexOf([...holding, ...other]);
  expect(many["shared"]?.[0]).toBe(BEST + 4);
  expect(((many["shared"] ?? []).length - 1) / 2).toBe(BEST);
  expect(many["shared"]?.[1]).toBe(BEST + 3);
});

test("the index comes in parts by first letter, each named by its code point in hexadecimal", () => {
  expect(partOf("what")).toBe("77");
  expect(partOf("щоб")).toBe("449");
  const parts = partsOf(index);
  expect(Object.keys(parts["77"] ?? {}).sort()).toEqual(["what", "wh", "where", "who", "went"].sort());
  expect(Object.values(parts).reduce((n, p) => n + Object.keys(p).length, 0)).toBe(words.length);
});

test("one letter added, dropped or changed is one edit away; two are not", () => {
  expect([oneEdit("pasive", "passive"), oneEdit("passive", "pasive"), oneEdit("pasive", "pazive"), oneEdit("pasive", "pasive")]).toEqual([
    true,
    true,
    true,
    true,
  ]);
  expect([oneEdit("pasve", "passive"), oneEdit("abc", "xyz"), oneEdit("ab", "abcd")]).toEqual([false, false, false]);
});

test("a word of the index reads as itself; the last term also as the words it starts; a term the index lacks as the words one letter away in its part", () => {
  expect(readings(index, words, "went", false)).toEqual([["went", 1]]);
  expect(readings(index, words, "irreg", true)).toEqual([["irregular", 0.9]]);
  expect(readings(index, words, "irreg", false)).toEqual([]);
  // "past" stands in two topics, "passive" in one: the commoner first.
  expect(readings(index, words, "pas", true)).toEqual([
    ["past", 0.9],
    ["passive", 0.9],
  ]);
  expect(readings(index, words, "pasive", false)).toEqual([["passive", 0.8]]);
  expect(readings(index, words, "qasive", false)).toEqual([]);
  expect(readings(index, words, "wh", true)).toEqual([["wh", 1]]);
  expect(readings(index, words, "zz", true)).toEqual([]);
});

test("a query ranks the topic its words weigh most in first, and counts each term once", () => {
  expect(ranked(["what"])[0]).toBe(0);
  expect(ranked(["went"])).toEqual([2]);
  expect(ranked(["what", "time"])[0]).toBe(1);
  expect(ranked(["pasive"])).toEqual([3]);
  expect(ranked(["nothing"])).toEqual([]);
  const empty: Index = {};
  expect(scores(empty, [], ["what"]).size).toBe(0);
});
