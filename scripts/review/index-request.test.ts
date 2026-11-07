// The index request (M6): IX-15 asked of the entries that carry a practical cluster, IX-24 of those that name no
// topic of today's in replaces while today's library holds the course's topics, IX-11 and IX-14 pending; its review
// runs twice as the source's does, a request asking nothing runs no session, and review() keeps a course's record
// beside its index with its report and sessions.
import { afterAll, expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { fixture } from "../v1/fixture.ts";
import { typedLibrary } from "../v1/library.ts";
import { SAMPLES_ROOT } from "../v1/load.ts";
import { entryIds, type Indexed, indexRequest, todayTopics } from "./index-request.ts";
import { review } from "./index.ts";
import { indexRequestsOf, reviewIndex } from "./pipeline.ts";
import { reportOf, withReview } from "./record.ts";
import type { Runner } from "./run.ts";
import { finding, scripted } from "./stand-in.ts";

const catalog = await readRules(RULES_FILE);
const today = [{ id: "en.foundations.alphabet-spelling", title: "The Alphabet" }];
function indexed(): Indexed {
  const { library } = typedLibrary(fixture().files);
  const [course] = library.courses;
  if (course?.index === undefined) throw new Error("the fixture holds a course with its index");
  return { ...course, index: course.index };
}

test("the index request asks IX-15 of practical entries and IX-24 of entries naming no replaces, given today's topics", () => {
  const course = indexed();
  const r = indexRequest(course, catalog, today);
  expect(r).toMatchObject({
    kind: "index",
    topic: "en",
    asked: { "IX-24": 1 },
    pending: ["IX-11"],
    inputs: { "IX-11": "the sources' passages" },
  });
  expect(r.asked).not.toHaveProperty("IX-15");
  expect(r.prompt).toContain("- IX-24 [block], asked of letters: Given today's topics {ids, titles}: Yes or no:");
  expect(r.prompt).toContain("A finding is a yes answer, where the entry names no topic in replaces.");
  expect(r.prompt).toContain('Today\'s topics of the course ({ids, titles}): en.foundations.alphabet-spelling "The Alphabet".');
  expect(r.prompt).toContain("its varieties: en-GB, en-US, the default first.");
  expect(r.prompt).toContain("## The index file\n```yaml\ncourse: en\n");
  expect(r.system).toContain("You review the index of one course of a language library");
  const entry = course.index.data.sections[0]?.topics[0];
  if (entry !== undefined) {
    entry.practical = "words-of-place";
    entry.replaces = "en.foundations.alphabet-spelling";
  }
  const practical = indexRequest(course, catalog, today);
  expect(practical.asked).toEqual({ "IX-15": 1 });
  expect(practical.prompt).toContain("- IX-15 [block], asked of letters: Yes or no: does this block group its words");
  expect(indexRequest(course, catalog, []).asked).toEqual({ "IX-15": 1 });
  expect(indexRequest(course, catalog, today, { only: ["IX-24"] })).toMatchObject({ asked: {}, only: ["IX-24"] });
  expect(entryIds(course.index.data, "entries", [])).toEqual(["letters"]);
  expect(entryIds(course.index.data, "facts", today)).toEqual([]);
});

test("today's topics of a course carry their titles in the index's source language", async () => {
  const en = await todayTopics("en", "en");
  expect(en.find((t) => t.id === "en.foundations.alphabet-spelling")?.title).toBe("The Alphabet");
  expect(en.every((t) => t.id.startsWith("en."))).toBe(true);
  expect(await todayTopics("xx", "en")).toEqual([]);
});

test("the index review runs its request twice, as the source's; a request asking nothing runs no session", async () => {
  const course = indexed();
  const runs: string[] = [];
  const answers = scripted({ index: [[finding("IX-24", "letters")], [finding("IX-24", "letters"), finding("IX-24", "x")]] });
  const runner: Runner = (request, model) => {
    runs.push(`${request.kind} ${model}`);
    return answers(request, model);
  };
  const done = await reviewIndex(course, catalog, today, runner, { model: "m", date: "2026-11-06" });
  expect(runs).toEqual(["index m", "index m"]);
  expect(done).toMatchObject({ topic: "en", requests: [{ standing: [finding("IX-24", "letters")], disputed: [finding("IX-24", "x")] }] });
  const record = withReview(undefined, done, { session: "writer", model: "claude-opus-5-5" });
  expect(record.reviews?.map((r) => r.findings.map((f) => [f.id, f.rule, f.at]))).toEqual([
    [["f1", "IX-24", "letters"]],
    [
      ["f2", "IX-24", "letters"],
      ["f3", "IX-24", "x"],
    ],
  ]);
  expect(record.reviews?.[0]?.findings[0]).not.toHaveProperty("language");
  expect(record.flagged).toEqual(["IX-24"]);
  const report = reportOf(done);
  expect(report).toStartWith("# Review of en, 2026-11-06");
  expect(report).toContain("## the index (1 questions, 1 rules)");
  expect(report).toContain("| IX-24 | `letters`: It breaks. Fix: Fixed. |");
  expect(report).toContain("Pending, unasked until the request has their input: IX-11 (the sources' passages).");
  const nothing = await reviewIndex(course, catalog, [], runner, { model: "m", date: "2026-11-06" });
  expect(runs).toHaveLength(2);
  expect(nothing.requests[0]).toMatchObject({ runs: [], standing: [], disputed: [] });
  expect(reportOf(nothing)).toContain("## the index (0 questions, 0 rules)\n\n| Rule | Finding |\n|---|---|\n| — | nothing asked |");
  expect(indexRequestsOf(course, catalog, today, ["IX-24"]).map((r) => r.only)).toEqual([undefined, ["IX-24"]]);
});

const scratch = await mkdtemp(join(tmpdir(), "review-"));
afterAll(async () => {
  await rm(scratch, { recursive: true });
});

test("review keeps a course's record beside its index, with its report and sessions; a course without an index is named", async () => {
  const root = join(scratch, "samples");
  await cp(SAMPLES_ROOT, root, { recursive: true, filter: (from) => basename(from) !== "review.yaml" });
  const out = join(scratch, "out");
  const options = {
    runner: scripted({ index: [[finding("IX-15", "words-of-place")], [finding("IX-15", "words-of-place")]] }),
    writer: { session: "writer", model: "claude-opus-5-5" },
    model: "claude-sonnet-5-5",
    date: "2026-11-06",
    out,
  };
  const [en, es] = await review(root, ["en", "es"], options);
  expect(en?.requests.map((r) => [r.request.kind, r.runs.length, r.request.asked])).toEqual([["index", 2, { "IX-15": 1 }]]);
  expect(es?.requests.map((r) => [r.request.kind, r.runs.length, r.request.asked])).toEqual([["index", 0, {}]]);
  const record = Bun.YAML.parse(await Bun.file(join(root, "en", "review.yaml")).text()) as TopicReviewRecord;
  expect(record.flagged).toEqual(["IX-15"]);
  expect(record.reviews).toHaveLength(2);
  expect(await Bun.file(join(out, "en", "index.md")).text()).toContain("| IX-15 | `words-of-place`");
  expect(await Bun.file(join(out, "es", "index.md")).text()).toContain("| — | nothing asked |");
  expect(await Bun.file(join(root, "es", "review.yaml")).exists()).toBe(false);
  const sessions = (await Bun.file(join(out, "sessions.jsonl")).text()).trim().split("\n");
  expect(sessions.map((l) => JSON.parse(l) as { topic: string; kind: string; language: null })).toMatchObject([
    { topic: "en", kind: "index", language: null },
    { topic: "en", kind: "index", language: null },
  ]);
  const again = await review(root, ["en"], options);
  expect(again[0]?.requests[0]?.runs).toHaveLength(2);
  const kept = Bun.YAML.parse(await Bun.file(join(root, "en", "review.yaml")).text()) as TopicReviewRecord;
  expect(kept.reviews).toHaveLength(4);
  const index = Bun.file(join(root, "en", "index.yaml"));
  await Bun.write(
    index,
    (await index.text()).replace("varieties: [en-GB, en-US]\nstatus: draft", "varieties: [en-GB, en-US]\nstatus: approved"),
  );
  expect(review(root, ["en"], options)).rejects.toThrow("the index of en enters review once the checks pass: 1 problems");
  await rm(join(root, "es", "index.yaml"));
  expect(review(root, ["es"], options)).rejects.toThrow("es has no index.yaml to review");
});
