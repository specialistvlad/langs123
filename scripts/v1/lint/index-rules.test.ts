// The index: each rule passes the fixture and names its written case; the rules of the library's reach run with it.
import { expect, test } from "bun:test";
import type { CourseIndex } from "../../generated/library-v1.ts";
import { type Case, lintCase } from "./case.ts";

const entry = (c: Case): CourseIndex["sections"][number]["topics"][number] => c.index.sections[0]?.topics[0] as never;
const reach = { beside: { options: { reach: true } } };

test("the fixture holds every rule of the index", () => {
  for (const rule of ["IX-05", "IX-07", "IX-10", "IX-16", "IX-22", "IX-25", "ST-14"]) expect(lintCase(rule)).toEqual([]);
});

test("IX-05: a concept the registry lacks", () => {
  expect(lintCase("IX-05", (c) => (entry(c).concepts = ["alphabet"]))).toEqual(["letters: the concept alphabet is no key of the registry"]);
  const registry = (c: Case): void => {
    entry(c).concepts = ["alphabet"];
    c.files.concepts = { file: "library/concepts.yaml", data: { alphabet: { description: "The letters of a script." } } };
  };
  expect(lintCase("IX-05", registry)).toEqual([]);
});

test("IX-07: a replaces entry naming a topic today's library lacks", () => {
  const replaces = (c: Case): void => {
    entry(c).replaces = "en.foundations.alphabet-spelling";
  };
  expect(lintCase("IX-07", replaces)).toEqual(["letters: today's library has no topic en.foundations.alphabet-spelling"]);
  expect(lintCase("IX-07", replaces, { beside: { today: new Set(["en.foundations.alphabet-spelling"]) } })).toEqual([]);
});

test("IX-10: an index drawn from one source", () => {
  expect(lintCase("IX-10", (c) => c.index.sources.pop())).toEqual(["en: the index draws on two sources or more"]);
});

test("IX-16: a search need that doesn't exist, and a need answered by no topic", () => {
  const needs = [
    {
      language: "uk",
      file: "library/needs/uk.yaml",
      data: [{ id: "letters", queries: ["англійський алфавіт"], from: "search-console" as const, topic: "en.alphabet" }],
    },
  ];
  expect(lintCase("IX-16", (c) => (entry(c).needs = ["letters", "names"]), { needs })).toEqual([
    "letters: no search need is names",
    "letters: no topic of an index is en.alphabet",
  ]);
});

test("IX-22: a topic written before its index is approved, which the samples' root leaves aside", () => {
  const draft = (c: Case): void => {
    c.index.status = "draft";
    entry(c).status = "draft";
  };
  expect(lintCase("IX-22", draft)).toEqual(["en.letters: the topic receives its text once its course's index is approved"]);
  expect(lintCase("IX-22", draft, { beside: { options: { samples: true } } })).toEqual([]);
});

test("IX-25: a draft index with an entry past its draft", () => {
  expect(lintCase("IX-25", (c) => (c.index.status = "draft"))).toEqual(["letters: a draft index holds draft entries alone"]);
});

test("ST-14: a topic whose subtopics stand at levels its index doesn't plan", () => {
  expect(lintCase("ST-14", (c) => (entry(c).path = { A0: 1, B1: 3 }))).toEqual([
    "en.letters: the subtopics stand at A0, A1; the index plans A0, B1",
  ]);
});

test("IX-13, IX-18, IX-19 and IX-20: the library's reach, checked with --reach alone", () => {
  expect(lintCase("IX-13")).toEqual([]);
  expect(lintCase("IX-13", undefined, reach)).toHaveLength(13);
  expect(lintCase("IX-13", (c) => (entry(c).practical = "words-of-place"), reach)).toHaveLength(12);
  expect(lintCase("IX-18", undefined, reach)).toEqual([
    "A2: the course has no topic at this level",
    "B1: the course has no topic at this level",
    "B2: the course has no topic at this level",
    "C1: the course has no topic at this level",
    "C2: the course has no topic at this level",
  ]);
  expect(
    lintCase(
      "IX-19",
      (c) => {
        c.course("fr", "fr");
      },
      reach,
    ),
  ).toEqual(["A2: the course has no topic at this level"]);
  expect(lintCase("IX-19", (c) => (c.course("fr", "fr"), (entry(c).path = { A0: 1, A1: 1, A2: 1, B1: 1 })), reach)).toEqual([
    "B1: the course reaches no further than A2 at v1",
  ]);
  expect(lintCase("IX-20", undefined, reach)).toEqual([
    "es: the library holds this course",
    "uk: the library holds this course",
    "fr: the library holds this course",
    "ja: the library holds this course",
    "it: the library holds this course",
    "de: the library holds this course",
  ]);
});
