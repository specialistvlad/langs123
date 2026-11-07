// The index request (12.2, M6): one Claude Code session's task over a course's index. It asks the catalog's index
// questions of the entries each names: IX-15 of the entries that carry a practical cluster, and IX-24 of those that
// name no topic of today's library in replaces, given today's topics of the course with their titles. The session
// reads the index as the file holds it.
import { topicTitle } from "../content.ts";
import type { CourseIndex } from "../generated/library-v1.ts";
import { type Explain, loadCurriculum, loadTopics } from "../lib.ts";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Typed } from "../v1/library.ts";
import { toYaml } from "../v1/yaml.ts";
import { asking, holds, type Selection, selected } from "./asking.ts";
import { questionsOf, type Target } from "./questions.ts";
import { instructions, type Request } from "./request.ts";

// A course with its index.
export type Indexed = Course & { index: Typed<CourseIndex> };

// A topic of today's library as IX-24 names it: its id and its title in the course's source language.
export interface TodayTopic {
  id: string;
  title: string;
}

type Entry = CourseIndex["sections"][number]["topics"][number];

export const INDEX_INSTRUCTIONS = instructions(
  "the index of one course of a language library",
  "every index entry its line names",
  "{ids, titles} is the list of today's topics of the course, given in the context; the other names are given in the context.",
);

// The entries a target names: every entry, those that carry a practical cluster, or those that name no topic of
// today's in replaces, asked while today's library holds topics of the course.
const ENTRIES: Partial<Record<Target, (e: Entry, today: TodayTopic[]) => boolean>> = {
  entries: () => true,
  "practical entries": (e) => e.practical !== undefined,
  "new entries": (e, today) => today.length > 0 && e.replaces === undefined,
};

export function entryIds(index: CourseIndex, target: Target, today: TodayTopic[]): string[] {
  const names = ENTRIES[target];
  return names === undefined
    ? []
    : index.sections
        .flatMap((s) => s.topics)
        .filter((e) => names(e, today))
        .map((e) => e.id);
}

// Today's topics of a course, each with its title in the index's source language, read from the course's own files.
export async function todayTopics(course: string, source: Explain): Promise<TodayTopic[]> {
  const curriculum = await loadCurriculum();
  const own = { ...curriculum, languages: curriculum.languages.filter((l) => l.code === course) };
  return (await loadTopics(own)).map((t) => ({ id: t.id, title: topicTitle(t, source) }));
}

function context(course: Indexed, today: TodayTopic[]): string[] {
  const { data } = course.index;
  return [
    `Course: ${course.course}, explained first in ${data.source}; its varieties: ${(data.varieties ?? ["none"]).join(", ")}, the default first.`,
    `Today's topics of the course ({ids, titles}): ${today.length === 0 ? "none" : today.map((t) => `${t.id} "${t.title}"`).join("; ")}.`,
    "The index lists the course's sections and, in each, its topics in order: each entry's subject, what it covers, its planned levels, its concepts, the topic of today's library it continues (replaces) and its practical cluster.",
  ];
}

export function indexRequest(course: Indexed, catalog: Catalog, today: TodayTopic[], selection: Selection = {}): Request {
  const { data } = course.index;
  const asked = asking(
    questionsOf(catalog, "index").filter((q) => holds(q, course.course, [course.course, data.source]) && selected(q, selection)),
    (q) => entryIds(data, q.target, today),
  );
  const prompt = [
    `# The index of ${course.course}`,
    ...context(course, today),
    "",
    "## Questions",
    ...asked.lines,
    "",
    "## The index file",
    "```yaml",
    toYaml(data).trimEnd(),
    "```",
  ];
  return {
    kind: "index",
    topic: course.course,
    system: INDEX_INSTRUCTIONS,
    prompt: prompt.join("\n"),
    asked: asked.asked,
    pending: asked.pending,
    inputs: asked.inputs,
    ...(selection.only !== undefined && { only: selection.only }),
  };
}
