// The similar-topic check over the samples: the distinct sample entries stand apart, and a near-duplicate planted
// beside one is found above the threshold. Were the lexical pass to miss it, calibration would call for an
// embedding model (M6).
import { expect, test } from "bun:test";
import type { Entry } from "../generated/library-v1.ts";
import { checkRoot } from "../v1/check.ts";
import { SAMPLES_ROOT } from "../v1/load.ts";
import { SIMILAR_THRESHOLD, similarTopics, similarTopicsOf } from "./similar.ts";

test("the lexical pass finds a planted near-duplicate and leaves the distinct samples apart", async () => {
  const { library } = await checkRoot(SAMPLES_ROOT);
  const section = library.courses.find((c) => c.course === "en")?.index?.data.sections[0];
  const present = section?.topics.find((t) => t.id === "present-simple");
  if (section === undefined || present === undefined) throw new Error("the English samples no longer hold present-simple");

  // The samples hold no near-duplicate.
  expect(similarTopics(library)).toEqual([]);

  // A near-duplicate of present-simple, planted beside it in the same course.
  const twin: Entry = { ...present, id: "simple-present", subject: "The present simple", covers: [...present.covers] };
  section.topics.push(twin);

  const pairs = similarTopics(library);
  expect(pairs).toHaveLength(1);
  const planted = pairs[0];
  if (planted === undefined) throw new Error("the planted near-duplicate went unfound");
  expect(planted.course).toBe("en");
  expect([planted.a, planted.b].sort()).toEqual(["present-simple", "simple-present"]);
  expect(planted.score).toBeGreaterThanOrEqual(SIMILAR_THRESHOLD);
  expect(planted.score).toBeGreaterThan(0.8);
});

test("a course of fewer than two entries has no pairs", async () => {
  const { library } = await checkRoot(SAMPLES_ROOT);
  const es = library.courses.find((c) => c.course === "es");
  expect((es?.index?.data.sections ?? []).flatMap((s) => s.topics).length).toBeLessThan(2);
  expect(similarTopics(library).filter((p) => p.course === "es")).toEqual([]);
});

test("the pairs come strongest first", async () => {
  const { library } = await checkRoot(SAMPLES_ROOT);
  const section = library.courses.find((c) => c.course === "en")?.index?.data.sections[0];
  const present = section?.topics.find((t) => t.id === "present-simple");
  if (section === undefined || present === undefined) throw new Error("the English samples no longer hold present-simple");
  section.topics.push({ ...present, id: "simple-present", subject: "The present simple", covers: [...present.covers] });
  section.topics.push({ ...present, id: "present-tense", subject: "The present tense", covers: present.covers.slice(0, 3) });

  const scores = similarTopics(library, 0).map((p) => p.score);
  expect(scores.length).toBeGreaterThan(1);
  expect([...scores].sort((a, b) => b - a)).toEqual(scores);
});

test("the pass reads a library from its root, as the review does", async () => {
  expect(await similarTopicsOf(SAMPLES_ROOT)).toEqual([]);
});
