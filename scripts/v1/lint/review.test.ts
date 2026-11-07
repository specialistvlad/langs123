// The review: each rule passes a topic whose record holds and names its written case; the rules an index's record
// keeps too (RV-02, RV-05 to RV-07) pass an index whose record holds and name its written case there.
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
// The course's index in review, its record beside it naming a finding on an entry, changed as a case says.
const indexInReview =
  (change: (r: TopicReviewRecord, c: Case) => void = () => undefined) =>
  (c: Case): void => {
    c.index.status = "in-review";
    const record = structuredClone(RECORD);
    Object.assign(record.reviews?.[0]?.findings[0] ?? {}, { at: "letters", rule: "IX-15", text: "Its covers group no contrast." });
    change(record, c);
    if (c.files.courses[0] !== undefined) c.files.courses[0].review = { file: "library/en/review.yaml", data: record };
  };
const RULES = ["RV-02", "RV-05", "RV-06", "RV-07", "RV-08", "RV-09", "RV-10", "RV-14", "RV-16", "LA-04"];
const KINDS = [
  ["a topic", inReview],
  ["an index", indexInReview],
] as const;

test.each(KINDS)("%s in review whose record holds passes every rule of the review", (_kind, inReviewOf) => {
  for (const rule of RULES) expect(lintCase(rule, inReviewOf())).toEqual([]);
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

test("RV-02: an index's record whose last status differs from the index's, that skips a step, or starts past its draft", () => {
  const approved = indexInReview((_, c) => (c.index.status = "approved"));
  expect(lintCase("RV-02", approved)).toEqual(["statuses: the last status is the index's, approved"]);
  const skipped = indexInReview((r, c) => {
    c.index.status = "approved";
    r.statuses.splice(1, 1, { status: "approved", date: "2026-11-03", by: "w" });
  });
  expect(lintCase("RV-02", skipped)).toEqual(["statuses: the status moves from draft to approved in one step"]);
  const started = indexInReview((r) => r.statuses.shift());
  expect(lintCase("RV-02", started)).toEqual(["statuses: an index starts as a draft"]);
});

test.each(KINDS)("RV-05: %s whose reviewer is the writer's own session", (_kind, inReviewOf) => {
  const own = inReviewOf((r) => Object.assign(r.reviews?.[0] ?? {}, { session: "writer-en" }));
  expect(lintCase("RV-05", own)).toEqual(["2026-11-03: the reviewer is a session apart from the writer's"]);
});

test.each(KINDS)("RV-06: %s whose finding cites neither a rule of the catalog nor a source of the index", (_kind, inReviewOf) => {
  const cites = (cited: object) => inReviewOf((r) => Object.assign(r.reviews?.[0]?.findings[0] ?? {}, { rule: undefined }, cited));
  expect(lintCase("RV-06", cites({ rule: "XX-99" }))).toEqual(["f1: the finding cites a rule of the catalog or a source of the index"]);
  expect(lintCase("RV-06", cites({ source: "profile" }))).toEqual([]);
});

test.each(KINDS)(
  "RV-07: %s whose finding has no answer, or is declined with no reason; one raised again goes to the owner",
  (_kind, inReviewOf) => {
    const said = lintCase(
      "RV-07",
      inReviewOf((r) =>
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
  },
);

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
