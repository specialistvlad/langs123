// A topic's review with a stand-in runner: the source runs twice, a language request once or twice, findings both
// runs report stand and the others are disputed; the record, the report, the queue and the sessions follow, and a
// topic whose checks fail stays out of review.
import { afterAll, expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { fixture } from "../v1/fixture.ts";
import { typedLibrary } from "../v1/library.ts";
import { SAMPLES_ROOT } from "../v1/load.ts";
import { review, reviewQueue } from "./index.ts";
import { drawn, reviewTopic, verdicts } from "./pipeline.ts";
import { queueOf } from "./queue.ts";
import { reportOf, withReview } from "./record.ts";
import type { Finding, Runner, Session } from "./run.ts";

const catalog = await readRules(RULES_FILE);
const finding = (rule: string, at: string, confidence: Finding["confidence"] = "high"): Finding => ({
  rule,
  at,
  text: "It breaks.",
  fix: "Fixed.",
  confidence,
});
const session = (findings: Finding[], n = 1): Session => ({
  session: `s${String(n)}`,
  model: "claude-sonnet-5-5",
  findings,
  tokens: { input: 10, output: 5, cacheRead: 20, cacheWrite: 0 },
  ms: 2000,
});
// A runner that answers each request's runs from a list, by its language.
const scripted = (answers: Record<string, Finding[][]>): Runner => {
  const seen: Record<string, number> = {};
  return (request) => {
    const k = request.language ?? "source";
    seen[k] = (seen[k] ?? 0) + 1;
    return Promise.resolve(session(answers[k]?.[(seen[k] ?? 1) - 1] ?? [], seen[k]));
  };
};

test("findings both runs report stand, the others are disputed, and one run's findings stand", () => {
  expect(
    verdicts([session([finding("SH-04", "def"), finding("VO-02", "x")]), session([finding("SH-04", "def"), finding("FT-05", "y")])]),
  ).toEqual({
    standing: [finding("SH-04", "def")],
    disputed: [finding("VO-02", "x"), finding("FT-05", "y")],
  });
  expect(verdicts([session([finding("SH-04", "def")])])).toEqual({ standing: [finding("SH-04", "def")], disputed: [] });
});

test("the one-in-ten draw of clean language requests is a hash, the same each time", () => {
  const dates = Array.from({ length: 200 }, (_, n) => `2026-11-${String(n)}`);
  const share = dates.filter((d) => drawn("en.letters", "uk", d)).length / dates.length;
  expect(share).toBeGreaterThan(0.03);
  expect(share).toBeLessThan(0.2);
  expect(drawn("en.letters", "uk", "2026-11-01")).toBe(drawn("en.letters", "uk", "2026-11-01"));
});

test("the source runs twice, a clean language request once, one with findings twice", async () => {
  const { files } = fixture();
  const { library } = typedLibrary(files);
  const [course] = library.courses;
  const [topic] = course?.topics ?? [];
  if (course === undefined || topic === undefined) throw new Error("the fixture holds a course and a topic");
  const clean = await reviewTopic(topic, course, catalog, scripted({ source: [[finding("SH-04", "def")], []] }), {
    model: "m",
    date: "2026-11-02",
    sessions: 2,
  });
  expect(clean.requests.map((r) => [r.request.language ?? "source", r.runs.length, r.standing.length, r.disputed.length])).toEqual([
    ["source", 2, 0, 1],
    ["uk", drawn("en.letters", "uk", "2026-11-02") ? 2 : 1, 0, 0],
  ]);
  const found = await reviewTopic(topic, course, catalog, scripted({ uk: [[finding("RV-11", "def", "low")], [finding("RV-11", "def")]] }), {
    model: "m",
    date: "2026-11-02",
  });
  expect(found.requests[1]).toMatchObject({ standing: [finding("RV-11", "def", "low")], disputed: [] });
  expect(found.requests[1]?.runs).toHaveLength(2);

  const record = withReview(undefined, found, { session: "writer", model: "claude-opus-5-5" });
  expect(record.writer).toEqual({ session: "writer", model: "claude-opus-5-5" });
  expect(record.statuses).toEqual([{ status: "draft", date: "2026-11-02", by: "writer" }]);
  expect(record.reviews?.map((r) => [r.session, r.run, r.findings.map((f) => [f.id, f.rule, f.language])])).toEqual([
    ["s1", 1, []],
    ["s2", 2, []],
    ["s1", 1, [["f1", "RV-11", "uk"]]],
    ["s2", 2, [["f2", "RV-11", "uk"]]],
  ]);
  expect(record.flagged).toEqual(["RV-11"]);
  expect(withReview(record, clean, { session: "w", model: "m" }).reviews?.at(-1)?.findings).toEqual([]);
  expect(withReview(record, clean, { session: "w", model: "m" }).reviews?.[4]?.findings[0]?.id).toBe("f3");

  const report = reportOf(found);
  expect(report).toStartWith("# Review of en.letters, 2026-11-02");
  expect(report).toContain("| RV-11 | `def`: It breaks. Fix: Fixed. (low confidence) |");
  expect(report).toContain("Pending, unasked until M6 brings their input: SH-09, VO-03, FT-08.");
  expect(report).toContain("Run 2: session s2, claude-sonnet-5-5, 30 tokens in, 5 out, 2 s.");
  expect(reportOf(clean)).toContain("Disputed, reported by one run alone:");
});

test("the queue holds each flagged topic and the one-in-ten draw of each wave's clean ones", () => {
  const { files, topic } = fixture();
  const flagged: TopicReviewRecord = {
    writer: { session: "w", model: "m" },
    statuses: [{ status: "draft", date: "2026-11-02", by: "w" }],
    flagged: ["RV-11"],
    owner: [{ language: "uk", date: "2026-11-03", why: "flagged" }],
  };
  topic.review = { file: "library/en/letters/review.yaml", data: flagged };
  expect(queueOf(typedLibrary(files).library)).toEqual([
    { topic: "en.letters", wave: "A0", why: "flagged", flagged: ["RV-11"], reads: ["en"] },
  ]);
  topic.review = { file: "library/en/letters/review.yaml", data: { ...flagged, flagged: [], owner: [] } };
  const library = typedLibrary(files).library;
  expect(queueOf(library)).toEqual([{ topic: "en.letters", wave: "A0", why: "sampled", flagged: [], reads: ["uk", "en"] }]);
  library.approvals = { file: "a", data: [{ what: "wave:A0", by: "owner", date: "2026-11-01", seed: 7 }] };
  const [first] = library.courses[0]?.topics ?? [];
  if (first !== undefined) {
    library.courses[0]?.topics.push(
      ...Array.from({ length: 10 }, (_, n) => ({
        ...first,
        slug: `l${String(n)}`,
        source: { ...first.source, data: { ...first.source.data, id: `en.l${String(n)}` } },
      })),
    );
  }
  expect(queueOf(library).map((q) => q.why)).toEqual(["sampled", "sampled"]);
});

const scratch = await mkdtemp(join(tmpdir(), "review-"));
afterAll(async () => {
  await rm(scratch, { recursive: true });
});

test("review writes each topic's record beside it, its report, the sessions and the queue; a topic the checks fail stays out", async () => {
  const root = join(scratch, "samples");
  await cp(SAMPLES_ROOT, root, { recursive: true, filter: (from) => basename(from) !== "review.yaml" });
  const out = join(scratch, "out");
  const options = {
    runner: scripted({ source: [[finding("VO-07", "ex.apple")], [finding("VO-07", "ex.apple")]] }),
    writer: { session: "writer", model: "claude-opus-5-5" },
    model: "claude-sonnet-5-5",
    date: "2026-11-02",
    out,
  };
  const [done] = await review(root, ["en.alphabet"], options);
  expect(done?.requests.map((r) => r.request.language ?? "source")).toEqual(["source", "ja", "uk"]);
  const record = Bun.YAML.parse(await Bun.file(join(root, "en", "alphabet", "review.yaml")).text()) as TopicReviewRecord;
  expect(record.flagged).toEqual(["VO-07"]);
  expect(await Bun.file(join(out, "en", "alphabet.md")).text()).toContain("| VO-07 | `ex.apple`");
  expect((await Bun.file(join(out, "sessions.jsonl")).text()).trim().split("\n").length).toBeGreaterThanOrEqual(4);
  expect(JSON.parse(await Bun.file(join(out, "queue.json")).text())).toEqual([
    { topic: "en.alphabet", wave: "A0", why: "flagged", flagged: ["VO-07"], reads: ["uk", "en"] },
  ]);
  expect((await reviewQueue(root)).map((q) => q.topic)).toEqual(["en.alphabet"]);
  await Bun.write(join(root, "en", "alphabet", "uk.yaml"), "language: uk\nnativeReview: false\ntext: {}\n");
  expect(review(root, ["en.alphabet"], options)).rejects.toThrow("en.alphabet enters review once the checks pass");
});
