// The review: each rule passes a topic whose record holds and names its written case.
import { expect, test } from "bun:test";
import type { Approvals, TopicReviewRecord } from "../../generated/library-v1.ts";
import { type Case, lintCase } from "./case.ts";

const RECORD: TopicReviewRecord = {
  writer: { session: "writer-en", model: "claude-opus-5-5" },
  statuses: [
    { status: "draft", date: "2026-11-02", by: "writer-en" },
    { status: "in-review", date: "2026-11-03", by: "writer-en" },
  ],
  reviews: [
    {
      session: "reviewer",
      model: "claude-sonnet-5-5",
      date: "2026-11-03",
      run: 1,
      findings: [{ id: "f1", at: "names.fact.1", rule: "VO-01", text: "Too long.", answer: "fixed" }],
    },
  ],
};
const inReview =
  (change: (r: TopicReviewRecord, c: Case) => void = () => undefined) =>
  (c: Case): void => {
    c.source.status = "in-review";
    const record = structuredClone(RECORD);
    change(record, c);
    c.review(record);
  };
const RULES = ["RV-02", "RV-05", "RV-06", "RV-07", "RV-08", "RV-09", "RV-10", "RV-14", "RV-16", "LA-04"];

test("a topic in review whose record holds passes every rule of the review", () => {
  for (const rule of RULES) expect(lintCase(rule, inReview())).toEqual([]);
});

test("RV-16: a topic in review with no record", () => {
  expect(lintCase("RV-16", (c) => (c.source.status = "in-review"))).toEqual([
    "en.letters: a topic in review or approved keeps its review record, review.yaml",
  ]);
});

test("RV-02: a status that skips a step, starts past its draft, or differs from the topic's", () => {
  expect(
    lintCase(
      "RV-02",
      inReview((r) => r.statuses.splice(1, 1, { status: "approved", date: "2026-11-03", by: "w" })),
    ),
  ).toEqual(["statuses: the status moves from draft to approved in one step", "statuses: the last status is the topic's, in-review"]);
  expect(
    lintCase(
      "RV-02",
      inReview((r) => r.statuses.shift()),
    ),
  ).toEqual(["statuses: a topic starts as a draft"]);
});

test("RV-05: a reviewer who is the writer's own session", () => {
  expect(
    lintCase(
      "RV-05",
      inReview((r) => Object.assign(r.reviews?.[0] ?? {}, { session: "writer-en" })),
    ),
  ).toEqual(["2026-11-03: the reviewer is a session apart from the writer's"]);
});

test("RV-06: a finding that cites neither a rule nor a source", () => {
  expect(
    lintCase(
      "RV-06",
      inReview((r) => Object.assign(r.reviews?.[0]?.findings[0] ?? {}, { rule: "XX-99" })),
    ),
  ).toEqual(["f1: the finding cites a rule of the catalog or a source of the index"]);
  expect(
    lintCase(
      "RV-06",
      inReview((r) =>
        r.reviews?.[0]?.findings.splice(0, 1, { id: "f2", at: "def", source: "profile", text: "Its level.", answer: "fixed" }),
      ),
    ),
  ).toEqual([]);
});

test("RV-07: a finding with no answer, and one declined with no reason; one raised again goes to the owner", () => {
  const said = lintCase(
    "RV-07",
    inReview((r) =>
      r.reviews?.[0]?.findings.push(
        { id: "f2", at: "def", rule: "SH-03", text: "x" },
        { id: "f3", at: "def", rule: "SH-03", text: "x", answer: "declined" },
        { id: "f4", at: "def", rule: "SH-03", text: "x", again: "declined" },
      ),
    ),
  );
  expect(said).toEqual([
    "f2: the writer answers the finding: fixed, or declined with a reason",
    "f3: the writer answers the finding: fixed, or declined with a reason",
  ]);
});

test("RV-08: an approved index without the owner's approval, and a wave written before the last is approved, the samples aside", () => {
  expect(lintCase("RV-08", (c) => Reflect.deleteProperty(c.files, "approvals"))).toEqual([
    "en: an approved index carries the owner's approval in approvals.yaml",
  ]);
  const a1 = inReview((_, c) => {
    if (c.source.subtopics[0]) c.source.subtopics[0].level = "A1";
  });
  expect(lintCase("RV-08", a1)).toEqual(["en.letters: the A1 wave is written after the owner approves the A0 wave"]);
  expect(lintCase("RV-08", a1, { beside: { options: { samples: true } } })).toEqual([]);
  const approved = (c: Case): void => {
    a1(c);
    (c.files.approvals?.data as Approvals).push({ what: "wave:A0", by: "owner", date: "2026-11-01" });
  };
  expect(lintCase("RV-08", approved)).toEqual([]);
});

const approvedTopic = (flagged: string[], owner: NonNullable<TopicReviewRecord["owner"]>) =>
  inReview((r, c) => {
    c.source.status = "approved";
    r.statuses.push({ status: "approved", date: "2026-11-04", by: "lead" });
    r.flagged = flagged;
    r.owner = owner;
    (c.files.approvals?.data as Approvals).push({ what: "wave:A0", by: "owner", date: "2026-11-05" });
  });

test("RV-09: a flagged topic approved without the owner reading it in Ukrainian and English", () => {
  expect(lintCase("RV-09", approvedTopic(["VO-01"], [{ language: "uk", date: "2026-11-04", why: "flagged" }]))).toEqual([
    "en.letters: the owner reads a flagged topic in Ukrainian and English before it is approved",
  ]);
});

test("RV-10: a wave approved with fewer owner readings than one in ten", () => {
  expect(lintCase("RV-10", approvedTopic([], []))).toEqual(["wave:A0: the owner reads 1 of its 1 unflagged topics; 0 are read"]);
  const read: NonNullable<TopicReviewRecord["owner"]> = [
    { language: "uk", date: "2026-11-04", why: "sampled" },
    { language: "en", date: "2026-11-04", why: "sampled" },
  ];
  expect(lintCase("RV-10", approvedTopic([], read))).toEqual([]);
});

test("RV-14: a Ukrainian flag the owner's reading didn't set, and another language's flag", () => {
  expect(lintCase("RV-14", (c) => (c.uk.nativeReview = true))).toEqual([
    "uk: the Ukrainian flag is set once the owner reads the topic in Ukrainian",
  ]);
  expect(lintCase("RV-14", (c) => (c.source.nativeReview = true))).toEqual(["en: the flag stays no until native contributors join"]);
});

test("LA-04: a course whose records name more than one writer beside the leading one", () => {
  const writers = (c: Case): void => {
    inReview()(c);
    const topic = c.files.courses[0]?.topics[0];
    for (const session of ["second", "third"]) {
      const copy = structuredClone(topic);
      if (copy?.review === undefined || topic === undefined) continue;
      (copy.review.data as TopicReviewRecord).writer.session = session;
      c.files.courses[0]?.topics.push(copy);
    }
  };
  expect(lintCase("LA-04", writers)).toEqual([
    "en: the course has one writer beside the leading one; its records name writer-en, second, third",
  ]);
});
