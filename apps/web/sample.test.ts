// The sample uses every feature the library uses, so the tests that build only the sample see every way a
// page renders. A feature only some other topic uses fails here, naming a topic to add to sample.ts.
import { expect, test } from "bun:test";
import { loadTopics } from "../../scripts/lib.ts";
import { features, SAMPLE } from "./sample.ts";

const written = (await loadTopics()).flatMap((r) => (r.topic === null ? [] : [{ id: r.id, features: features(r.topic) }]));

test("every sample topic exists", () => {
  expect(SAMPLE.topics.filter((id) => !written.some((t) => t.id === id))).toEqual([]);
});

test("the sample uses every feature the library uses", () => {
  const sampled = new Set(written.filter((t) => SAMPLE.topics.includes(t.id)).flatMap((t) => [...t.features]));
  const missing = [...new Set(written.flatMap((t) => [...t.features]))]
    .filter((f) => !sampled.has(f))
    .map((f) => `${f}: add ${written.find((t) => t.features.has(f))?.id ?? ""} to SAMPLE in apps/web/sample.ts`);
  expect(missing).toEqual([]);
});
