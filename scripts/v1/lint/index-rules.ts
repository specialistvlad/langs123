// The index of each course: its concepts come from the registry (IX-05); a replaces entry names a topic of today's
// library (IX-07); its topics answer search needs that exist, the needs of the courses the root holds (IX-16); a
// topic receives its text once the index is approved (IX-22), and a draft index holds drafts (IX-25); a topic's
// subtopics stand at the levels its index plans (ST-14). At the library's reach: every practical cluster has a
// topic in each course (IX-13), the courses reach their levels (IX-18, IX-19), and every course is there (IX-20).
import type { CourseIndex, SearchNeeds } from "../../generated/library-v1.ts";
import { LEVELS } from "../../lib.ts";
import type { Course } from "../library.ts";
import { type Problem, SCHEMA } from "../schema.ts";
import type { Scope } from "../scope.ts";
import { scopeOf } from "../scope.ts";
import type { Lint, LintRule } from "./lint.ts";

type Entry = CourseIndex["sections"][number]["topics"][number];
const entries = (index: CourseIndex): Entry[] => index.sections.flatMap((s) => s.topics);
// Each course with its index, where the rule holds in it.
const indexed = (lint: Lint, courses: string[] | undefined): (Course & { index: NonNullable<Course["index"]> })[] =>
  lint.library.courses.filter(
    (c): c is Course & { index: NonNullable<Course["index"]> } => c.index !== undefined && (courses?.includes(c.course) ?? true),
  );
const at = (rule: string, file: string, id: string, message: string): Problem => ({ rule, file, id, message });
const levelsOf = (c: Course & { index: NonNullable<Course["index"]> }): Set<string> =>
  new Set(entries(c.index.data).flatMap((e) => Object.keys(e.path)));

export interface Needs {
  language: string;
  file: string;
  data: SearchNeeds;
}

// The courses the rules of the courses' reach name: those of IX-18 and IX-19.
const reachOf = (lint: Lint, id: string): string[] => scopeOf(lint.catalog, id).courses ?? [];

export const indexRules = (needs: Needs[]): LintRule[] => [
  {
    id: "IX-05",
    check: (lint: Lint, scope: Scope): Problem[] => {
      const keys = Object.keys(lint.library.concepts?.data ?? {});
      return indexed(lint, scope.courses).flatMap((c) =>
        entries(c.index.data).flatMap((e) =>
          (e.concepts ?? [])
            .filter((k) => !keys.includes(k))
            .map((k) => at("IX-05", c.index.file, e.id, `the concept ${k} is no key of the registry`)),
        ),
      );
    },
  },
  {
    id: "IX-07",
    check: (lint, scope) =>
      indexed(lint, scope.courses).flatMap((c) =>
        entries(c.index.data)
          .filter((e) => e.replaces !== undefined && !lint.today.has(e.replaces))
          .map((e) => at("IX-07", c.index.file, e.id, `today's library has no topic ${e.replaces ?? ""}`)),
      ),
  },
  {
    id: "IX-16",
    check: (lint: Lint, scope: Scope): Problem[] => {
      const held = new Set(lint.library.courses.map((c) => c.course));
      const all = needs
        .flatMap((n) => n.data.map((need) => ({ ...need, file: n.file })))
        .filter((n) => n.topic === undefined || held.has(n.topic.split(".")[0] ?? ""));
      const topics = new Set(indexed(lint, undefined).flatMap((c) => entries(c.index.data).map((e) => `${c.course}.${e.id}`)));
      return [
        ...indexed(lint, scope.courses).flatMap((c) =>
          entries(c.index.data).flatMap((e) =>
            (e.needs ?? [])
              .filter((id) => !all.some((n) => n.id === id))
              .map((id) => at("IX-16", c.index.file, e.id, `no search need is ${id}`)),
          ),
        ),
        ...all
          .filter((n) => n.topic !== undefined && !topics.has(n.topic))
          .map((n) => at("IX-16", n.file, n.id, `no topic of an index is ${n.topic ?? ""}`)),
      ];
    },
  },
  {
    id: "IX-22",
    check: (lint, scope) =>
      lint.options.samples === true
        ? []
        : indexed(lint, scope.courses)
            .filter((c) => c.index.data.status !== "approved")
            .flatMap((c) =>
              c.topics.map((t) =>
                at("IX-22", t.source.file, t.source.data.id, "the topic receives its text once its course's index is approved"),
              ),
            ),
  },
  {
    id: "IX-25",
    check: (lint, scope) =>
      indexed(lint, scope.courses)
        .filter((c) => c.index.data.status === "draft")
        .flatMap((c) =>
          entries(c.index.data)
            .filter((e) => e.status !== "draft")
            .map((e) => at("IX-25", c.index.file, e.id, "a draft index holds draft entries alone")),
        ),
  },
  {
    id: "ST-14",
    check: (lint, scope) =>
      indexed(lint, scope.courses).flatMap((c) =>
        c.topics.flatMap((t) => {
          const planned = Object.keys(entries(c.index.data).find((e) => e.id === t.slug)?.path ?? {}).sort();
          const written = [...new Set(t.source.data.subtopics.map((s) => s.level))].sort();
          return planned.join() === written.join() || planned.length === 0
            ? []
            : [
                at(
                  "ST-14",
                  t.source.file,
                  t.source.data.id,
                  `the subtopics stand at ${written.join(", ")}; the index plans ${planned.join(", ")}`,
                ),
              ];
        }),
      ),
  },
  {
    id: "IX-13",
    reach: true,
    check: (lint: Lint, scope: Scope): Problem[] => {
      const clusters = (SCHEMA.definitions["cluster"] as { enum?: string[] }).enum ?? [];
      return indexed(lint, scope.courses).flatMap((c) =>
        clusters
          .filter((k) => !entries(c.index.data).some((e) => e.practical === k))
          .map((k) => at("IX-13", c.index.file, k, "the index has no topic for this practical cluster")),
      );
    },
  },
  ...(["IX-18", "IX-19"] as const).map((id): LintRule => ({
    id,
    reach: true,
    check: (lint, scope) =>
      indexed(lint, scope.courses).flatMap((c) => {
        const has = levelsOf(c);
        const reach = id === "IX-18" ? [...LEVELS] : LEVELS.slice(0, LEVELS.indexOf("A2") + 1);
        return [
          ...reach.filter((l) => !has.has(l)).map((l) => at(id, c.index.file, l, "the course has no topic at this level")),
          ...[...has]
            .filter((l) => !reach.includes(l as (typeof LEVELS)[number]))
            .map((l) => at(id, c.index.file, l, "the course reaches no further than A2 at v1")),
        ];
      }),
  })),
  {
    id: "IX-20",
    reach: true,
    check: (lint) => {
      const present = lint.library.courses.map((c) => c.course);
      return [...reachOf(lint, "IX-18"), ...reachOf(lint, "IX-19")]
        .filter((c) => !present.includes(c))
        .map((c) => at("IX-20", "library", c, "the library holds this course"));
    },
  },
];
