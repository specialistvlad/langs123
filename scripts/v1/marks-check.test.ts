// The marks and varieties of a topic's text: ST-06, NO-28 and NO-03 as the catalog scopes them.
import { expect, test } from "bun:test";
import type { TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { catalog, checkFiles } from "./check.ts";
import { files } from "./fixture.ts";
import type { LibraryFiles } from "./load.ts";
import { inCourse, scopeOf } from "./scope.ts";

const rules = await catalog();
const check = (change: (source: TopicSource, uk: TopicLanguageFile, f: LibraryFiles) => void): string[] => {
  const copy = files();
  const topic = copy.courses[0]?.topics[0];
  change(topic?.source?.data as TopicSource, topic?.languages[0]?.data as TopicLanguageFile, copy);
  return checkFiles(copy, rules)
    .problems.filter((p) => p.rule !== "LA-10")
    .map((p) => `${p.rule ?? ""} ${p.file.split("/").pop() ?? ""} ${p.id ?? ""}: ${p.message}`);
};

test("ST-06: each mark stands in the text it serves, and the grammar holds", () => {
  expect(check((s) => (s.title.text = "The {target letters}"))).toEqual([
    "ST-06 source.yaml title: {target} stands in the course's text, not in this explanation",
  ]);
  expect(
    check(
      (s) =>
        (((s.subtopics[0]?.blocks[1] as { items: { ex: { text: string } }[] }).items[0] as { ex: { text: string } }).ex.text =
          "{term apple}"),
    ),
  ).toEqual(["ST-06 source.yaml ex.apple: {term} stands in explanations, not in this course"]);
  expect(check((_, uk) => (uk.text["title"] = "Літери {"))).toEqual([
    "ST-06 uk.yaml title: a mark is never closed with }",
    "ST-06 uk.yaml title: {} is no mark of the vocabulary",
  ]);
  expect(check((s) => ((s.errors[0] as { wrong: string }).wrong = "A {l1 uk а}"))).toEqual([
    "ST-06 source.yaml err.a: {l1} stands in explanations, not in this form",
  ]);
});

test("NO-28: every variety is one its course lists", () => {
  expect(check((s) => Object.assign(s.essence[0] ?? {}, { variety: "en-AU" }))).toEqual([
    "NO-28 source.yaml ess.a: en-AU is no variety of the course",
  ]);
  expect(check((s) => (s.definition.text = "The {variant en-AU letters}."))).toEqual([
    "NO-28 source.yaml def: en-AU is no variety of the course",
  ]);
  expect(check((_, __, f) => Reflect.deleteProperty(f.courses[0]?.index?.data as object, "varieties"))).toContain(
    "NO-28 source.yaml ess.z: en-GB is no variety of the course",
  );
  expect(check((_, __, f) => Reflect.deleteProperty(f.courses[0] ?? {}, "index"))).toEqual(["IX-01 en : the course has no index.yaml"]);
});

test("NO-03: an en-US element stands as one half of a swap beside its en-GB form", () => {
  expect(check((s) => Object.assign(s.essence[0] ?? {}, { variety: "en-US" }))).toEqual([
    "NO-03 source.yaml ess.a: an element of en-US stands as one half of a swap, beside its en-GB form",
  ]);
  expect(check((s) => Object.assign(s.essence[1] ?? {}, { ipa: "{variant en-US ziː}" }))).toEqual([
    "NO-03 source.yaml ess.z: the en-US form stands beside its en-GB form",
  ]);
});

test("a rule's scope comes from the catalog's Courses and Languages lines", () => {
  expect(scopeOf(rules, "NO-03")).toEqual({ courses: ["en"], languages: ["en-US"] });
  expect(scopeOf(rules, "SH-01")).toEqual({});
  expect(inCourse(scopeOf(rules, "NO-03"), "es")).toBe(false);
  expect(inCourse(scopeOf(rules, "SH-01"), "es")).toBe(true);
});
