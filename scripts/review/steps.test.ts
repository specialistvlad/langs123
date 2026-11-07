// The index's inputs to a topic's request: the steps before the topic in the study path for FT-08 and its subject
// for IX-14, each pending where the index does not place the topic.
import { expect, test } from "bun:test";
import { INDEX } from "../v1/fixture.ts";
import { stepsBefore, topicInputs } from "./steps.ts";

const index = (): typeof INDEX => {
  const copy = structuredClone(INDEX);
  const entry = copy.sections[0]?.topics[0];
  if (entry !== undefined) entry.path = { A0: 2, A1: 3 };
  return copy;
};

test("the steps before a topic: the entries at a lower level, and those before it at its first level", () => {
  const i = index();
  expect(stepsBefore(i, "letters")).toEqual([]);
  expect(stepsBefore(i, "nowhere")).toBeUndefined();
  expect(stepsBefore(undefined, "letters")).toBeUndefined();
  i.sections[0]?.topics.push(
    { id: "sounds", subject: "The sounds", covers: ["vowels"], path: { A0: 3 }, status: "draft" },
    { id: "numbers", subject: "Numbers", covers: ["one to ten"], path: { A1: 1 }, status: "draft" },
    { id: "greetings", subject: "Greetings", covers: ["hello"], path: { A0: 1 }, status: "draft" },
  );
  expect(stepsBefore(i, "letters")).toEqual([{ id: "greetings", subject: "Greetings", covers: ["hello"] }]);
  expect(stepsBefore(i, "numbers")?.map((s) => s.id)).toEqual(["letters", "sounds", "greetings"]);
  const part = topicInputs(i, "numbers");
  expect([...part.given]).toEqual(["FT-08", "IX-14"]);
  expect(part.lines).toContain("  - greetings: Greetings; hello");
  expect(part.lines).toContain("- IX-14, the topic's subject ({subject}): Numbers");
});

test("a topic the index does not place has no input from it", () => {
  expect(topicInputs(index(), "letters").lines).toContain(
    "- FT-08, the steps before this topic ({list}), each with its subject and what it covers: none, this is the first",
  );
  expect(topicInputs(undefined, "letters")).toEqual({ lines: [], given: new Set() });
});
