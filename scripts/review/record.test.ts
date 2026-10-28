// The record of a review beside the writer's earlier answers: a finding on an element and rule the writer answered is
// raised again with that answer, and the report lists it apart for the owner's reading.
import { expect, test } from "bun:test";
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { fixture } from "../v1/fixture.ts";
import { typedLibrary } from "../v1/library.ts";
import { reviewTopic } from "./pipeline.ts";
import { reportOf, withReview } from "./record.ts";
import { finding, scripted } from "./stand-in.ts";

const catalog = await readRules(RULES_FILE);

test("a finding on an element and rule the writer answered is raised again with that answer, and the report lists it apart", async () => {
  const { files } = fixture();
  const { library } = typedLibrary(files);
  const [course] = library.courses;
  const [topic] = course?.topics ?? [];
  if (course === undefined || topic === undefined) throw new Error("the fixture holds a course and a topic");
  const answeredBefore: TopicReviewRecord = {
    writer: { session: "w", model: "m" },
    statuses: [{ status: "draft", date: "2026-11-01", by: "w" }],
    reviews: [
      {
        session: "r",
        model: "m",
        date: "2026-11-01",
        run: 1,
        findings: [
          { id: "f1", at: "def", language: "uk", rule: "RV-11", text: "x", answer: "declined", reason: "The sense holds." },
          { id: "f2", at: "def", rule: "SH-04", text: "x", answer: "fixed" },
        ],
      },
    ],
  };
  const done = await reviewTopic(
    topic,
    course,
    catalog,
    scripted({
      source: [[finding("SH-04", "def"), finding("SH-05", "def")], [finding("SH-04", "def")]],
      uk: [[finding("RV-11", "def")], []],
    }),
    { model: "m", date: "2026-11-02" },
  );
  const record = withReview(answeredBefore, done, { session: "w", model: "m" });
  expect(record.reviews?.slice(1).flatMap((r) => r.findings.map((f) => [f.id, f.rule, f.again]))).toEqual([
    ["f3", "SH-04", "fixed"],
    ["f4", "SH-05", undefined],
    ["f5", "SH-04", "fixed"],
    ["f6", "RV-11", "declined"],
  ]);
  expect(withReview({ ...answeredBefore, flagged: ["VO-07"] }, { ...done, partial: true }, { session: "w", model: "m" }).flagged).toEqual([
    "VO-07",
    "SH-04",
    "SH-05",
    "RV-11",
  ]);
  expect(withReview({ ...answeredBefore, flagged: ["VO-07"] }, done, { session: "w", model: "m" }).flagged).toEqual([
    "SH-04",
    "SH-05",
    "RV-11",
  ]);
  const report = reportOf(done, answeredBefore);
  expect(report).toContain("Raised again after the writer's answer, for the owner's reading:");
  expect(report).toContain("| SH-04 | `def`: It breaks. Fix: Fixed. | standing | fixed |");
  expect(report).toContain("| RV-11 | `def`: It breaks. Fix: Fixed. | disputed | declined: The sense holds. |");
  expect(report).toContain("Disputed, reported by one run alone:\n\n| Rule | Finding |\n|---|---|\n| SH-05 |");
  expect(report).not.toContain("| SH-04 | `def`: It breaks. Fix: Fixed. |\n");
});
