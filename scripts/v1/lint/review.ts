// The review of each topic and of each course's index: a topic in review or approved keeps its record (RV-16), naming
// its writer, one per course beside the leading writer (LA-04); each record, a topic's or an index's, moves its status
// one step at a time to the status of what it reviews (RV-02), names a reviewer apart from the writer's session (RV-05),
// and holds findings that each cite a rule (RV-06) and have the writer's answer, but one raised again after
// an answer, which the owner reads (RV-07); the owner approves the index and each wave before the next, the samples being
// one gate (RV-08), reads every flagged topic (RV-09) and one in ten of the rest (RV-10) in Ukrainian and English, and
// alone sets the Ukrainian flag (RV-14).
import type { TopicReviewRecord } from "../../generated/library-v1.ts";
import { LEVELS } from "../../lib.ts";
import type { Course, Topic, Typed } from "../library.ts";
import type { Problem } from "../schema.ts";
import type { Scope } from "../scope.ts";
import type { Lint, LintRule } from "./lint.ts";

const ORDER = ["draft", "in-review", "approved"];
const at = (rule: string, file: string, id: string, message: string): Problem => ({ rule, file, id, message });
type Reviewed = Topic & { review: Typed<TopicReviewRecord> };
// A review record, a topic's or an index's, with the id and the status of what it reviews.
type Kept = Typed<TopicReviewRecord> & { course: string; id: string; status: string; what: "topic" | "index" };
const ONE = { topic: "a topic", index: "an index" };
const inScope = (lint: Lint, courses: string[] | undefined): Course[] =>
  lint.library.courses.filter((c) => courses?.includes(c.course) ?? true);
const topicsOf = (c: Course): Reviewed[] => c.topics.filter((t): t is Reviewed => t.review !== undefined);
const reviewedTopics = (lint: Lint, courses: string[] | undefined): Reviewed[] => inScope(lint, courses).flatMap(topicsOf);
// Each course's record of its index, then its topics' records.
const reviewed = (lint: Lint, courses: string[] | undefined): Kept[] =>
  inScope(lint, courses).flatMap((c) => [
    ...(c.review === undefined || c.index === undefined
      ? []
      : [{ ...c.review, course: c.course, id: c.course, status: c.index.data.status, what: "index" as const }]),
    ...topicsOf(c).map((t): Kept => ({ ...t.review, course: c.course, id: t.source.data.id, status: t.source.data.status, what: "topic" })),
  ]);
const lowest = (t: Topic): string => LEVELS.find((l) => t.source.data.subtopics.some((s) => s.level === l)) ?? "A0";
const approvalOf = (lint: Lint, what: string): string | undefined => lint.library.approvals?.data.find((a) => a.what === what)?.date;
const readIn = (t: Reviewed, language: string): boolean => (t.review.data.owner ?? []).some((o) => o.language === language);

export const REVIEW: LintRule[] = [
  {
    id: "RV-16",
    check: (lint, scope) =>
      lint.library.courses
        .filter((c) => scope.courses?.includes(c.course) ?? true)
        .flatMap((c) => c.topics.filter((t) => t.source.data.status !== "draft" && t.review === undefined))
        .map((t) => at("RV-16", t.source.file, t.source.data.id, "a topic in review or approved keeps its review record, review.yaml")),
  },
  {
    id: "LA-04",
    check: (lint, scope) =>
      lint.library.courses
        .filter((c) => scope.courses?.includes(c.course) ?? true)
        .flatMap((c) => {
          const writers = [...new Set(c.topics.flatMap((t) => (t.review === undefined ? [] : [t.review.data.writer.session])))];
          return writers.length > 2
            ? [at("LA-04", c.dir, c.course, `the course has one writer beside the leading one; its records name ${writers.join(", ")}`)]
            : [];
        }),
  },
  {
    id: "RV-02",
    check: (lint, scope) =>
      reviewed(lint, scope.courses).flatMap(({ file, data, status, what }) => {
        const steps = data.statuses.map((s) => s.status);
        const found: Problem[] = [];
        if (steps[0] !== "draft") found.push(at("RV-02", file, "statuses", `${ONE[what]} starts as a draft`));
        steps.forEach((s, n) => {
          if (n > 0 && ORDER.indexOf(s) !== ORDER.indexOf(steps[n - 1] ?? "") + 1) {
            found.push(at("RV-02", file, "statuses", `the status moves from ${steps[n - 1] ?? ""} to ${s} in one step`));
          }
        });
        if (steps.at(-1) !== status) found.push(at("RV-02", file, "statuses", `the last status is the ${what}'s, ${status}`));
        return found;
      }),
  },
  {
    id: "RV-05",
    check: (lint, scope) =>
      reviewed(lint, scope.courses).flatMap(({ file, data }) =>
        (data.reviews ?? [])
          .filter((r) => r.session === data.writer.session)
          .map((r) => at("RV-05", file, r.date, "the reviewer is a session apart from the writer's")),
      ),
  },
  {
    id: "RV-06",
    check: (lint: Lint, scope: Scope): Problem[] => {
      const rules = new Set(lint.catalog.rules.map((r) => r.id));
      return reviewed(lint, scope.courses).flatMap(({ file, data }) => {
        return (data.reviews ?? []).flatMap((r) =>
          r.findings
            .filter((f) => !(f.rule !== undefined && rules.has(f.rule)))
            .map((f) => at("RV-06", file, f.id, "the finding cites a rule of the catalog")),
        );
      });
    },
  },
  {
    id: "RV-07",
    check: (lint, scope) =>
      reviewed(lint, scope.courses).flatMap(({ file, data }) =>
        (data.reviews ?? []).flatMap((r) =>
          r.findings
            .filter((f) => f.again === undefined && (f.answer === undefined || (f.answer === "declined" && f.reason === undefined)))
            .map((f) => at("RV-07", file, f.id, "the writer answers the finding: fixed, or declined with a reason")),
        ),
      ),
  },
  {
    id: "RV-08",
    check: (lint: Lint, scope: Scope): Problem[] => {
      const courses = lint.library.courses.filter((c) => scope.courses?.includes(c.course) ?? true);
      return [
        ...courses
          .filter((c) => c.index?.data.status === "approved" && approvalOf(lint, `index:${c.course}`) === undefined)
          .map((c) => at("RV-08", c.index?.file ?? c.dir, c.course, "an approved index carries the owner's approval in approvals.yaml")),
        ...courses.flatMap((c) =>
          c.topics.flatMap((t) => {
            const level = lowest(t);
            const before = LEVELS[LEVELS.indexOf(level as (typeof LEVELS)[number]) - 1];
            const written = t.review?.data.statuses[0]?.date;
            const approved = before === undefined ? undefined : approvalOf(lint, `wave:${before}`);
            if (before === undefined || written === undefined || lint.options.samples === true) return [];
            return approved !== undefined && approved <= written
              ? []
              : [at("RV-08", t.source.file, t.source.data.id, `the ${level} wave is written after the owner approves the ${before} wave`)];
          }),
        ),
      ];
    },
  },
  {
    id: "RV-09",
    check: (lint, scope) =>
      reviewedTopics(lint, scope.courses)
        .filter(
          (t) => t.source.data.status === "approved" && (t.review.data.flagged ?? []).length > 0 && !(readIn(t, "uk") && readIn(t, "en")),
        )
        .map((t) =>
          at("RV-09", t.review.file, t.source.data.id, "the owner reads a flagged topic in Ukrainian and English before it is approved"),
        ),
  },
  {
    id: "RV-10",
    check: (lint, scope) =>
      LEVELS.flatMap((level) => {
        if (approvalOf(lint, `wave:${level}`) === undefined) return [];
        const wave = reviewedTopics(lint, scope.courses).filter(
          (t) => lowest(t) === level && t.source.data.status === "approved" && (t.review.data.flagged ?? []).length === 0,
        );
        const read = wave.filter((t) => readIn(t, "uk") && readIn(t, "en")).length;
        return read >= Math.ceil(wave.length / 10)
          ? []
          : [
              at(
                "RV-10",
                "library/approvals.yaml",
                `wave:${level}`,
                `the owner reads ${Math.ceil(wave.length / 10)} of its ${wave.length} unflagged topics; ${read} are read`,
              ),
            ];
      }),
  },
  {
    id: "RV-14",
    check: (lint, scope) =>
      lint.library.courses
        .filter((c) => scope.courses?.includes(c.course) ?? true)
        .flatMap((c) =>
          c.topics.flatMap((t) => {
            const flags = [
              { language: c.index?.data.source ?? c.course, file: t.source.file, flag: t.source.data.nativeReview },
              ...t.languages.map((l) => ({ language: l.data.language, file: l.file, flag: l.data.nativeReview })),
            ];
            const read = (t.review?.data.owner ?? []).some((o) => o.language === "uk");
            return flags
              .filter((f) => f.flag && (f.language !== "uk" || !read))
              .map((f) =>
                at(
                  "RV-14",
                  f.file,
                  f.language,
                  f.language === "uk"
                    ? "the Ukrainian flag is set once the owner reads the topic in Ukrainian"
                    : "the flag stays no until native contributors join",
                ),
              );
          }),
        ),
  },
];
