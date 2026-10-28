// A topic is checked against its schema in two passes: one that holds passes the first, and one that breaks it is
// checked again for every error, so each problem is named in one run.
import { expect, test } from "bun:test";
import { loadConcepts, loadTopics, type Topic, type TopicRef } from "../lib.ts";
import { checkRef, type Problem } from "./index.ts";

const refs = await loadTopics();
const concepts = await loadConcepts();
const ids = new Set(refs.map((r) => r.id));
const ref = refs.find((r) => r.topic !== null) as TopicRef & { topic: Topic };

const problemsOf = async (topic: unknown): Promise<string[]> => {
  const problems: Problem[] = [];
  await checkRef({ ...ref, topic: topic as Topic }, ids, concepts, (where, message) => problems.push({ where, message }));
  return problems.map((p) => p.message);
};

test("a topic that holds its schema has no schema problem, and one that breaks it twice has both named", async () => {
  expect(await problemsOf(ref.topic)).toEqual([]);
  const broken = structuredClone(ref.topic) as unknown as Record<string, unknown>;
  Reflect.deleteProperty(broken, "title");
  broken["kind"] = "novel";
  expect(await problemsOf(broken)).toEqual(["/ must have required property 'title'", "/kind must be equal to one of the allowed values"]);
  expect(await problemsOf(ref.topic)).toEqual([]);
});
