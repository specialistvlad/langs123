// The layout of the new library: every course has its index and names itself as its folder does (IX-01); a
// section's and a topic's ids are unique in the course (IX-26); every topic sits in its course's index and its
// file names the slug of its folder (IX-03, IX-04); a language file names the language of its name and none
// translates the course's source language (LA-01, LA-09); and every id of a topic names one thing (LA-06), its
// own blocks' ids starting with their language (LA-05).
import type { Course, Library, Topic } from "./library.ts";
import type { Problem } from "./schema.ts";
import { languageOfFile } from "./load.ts";

// Every `id` of an element, at any depth.
export function idsIn(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(idsIn);
  if (typeof node !== "object" || node === null) return [];
  const own = (node as { id?: unknown }).id;
  return [...(typeof own === "string" ? [own] : []), ...Object.values(node).flatMap(idsIn)];
}

const repeated = (ids: string[]): string[] => [...new Set(ids.filter((id, n) => ids.indexOf(id) !== n))];

function courseProblems(c: Course): Problem[] {
  if (c.index === undefined) return [{ rule: "IX-01", file: c.dir, message: "the course has no index.yaml" }];
  const { file, data } = c.index;
  const problems: Problem[] = [];
  if (data.course !== c.course) {
    problems.push({ rule: "IX-01", file, message: `the index names course ${data.course} in the folder of ${c.course}` });
  }
  for (const id of repeated(data.sections.map((s) => s.id))) {
    problems.push({ rule: "IX-26", file, id, message: "two sections share this id" });
  }
  const slugs = data.sections.flatMap((s) => s.topics.map((t) => t.id));
  for (const id of repeated(slugs)) problems.push({ rule: "IX-26", file, id, message: "two topics share this id" });
  for (const t of c.topics) {
    if (!slugs.includes(t.slug)) {
      problems.push({ rule: "IX-03", file: t.source.file, message: `no section of ${file} lists the topic ${t.slug}` });
    }
  }
  return problems;
}

function topicProblems(t: Topic, source: string | undefined): Problem[] {
  const { file, data } = t.source;
  const problems: Problem[] = [];
  const expected = `${t.course}.${t.slug}`;
  if (data.id !== expected) {
    problems.push({ rule: "IX-04", file, message: `the topic's id is ${data.id}; its folder makes it ${expected}` });
  }
  const ids = idsIn({ ...data, id: undefined });
  for (const l of t.languages) {
    const named = languageOfFile(l.file);
    if (l.data.language !== named) {
      problems.push({ rule: "LA-01", file: l.file, message: `the file of ${named} names the language ${l.data.language}` });
    }
    if (l.data.language === source) {
      problems.push({ rule: "LA-09", file: l.file, message: `${source} is the course's source language, which source.yaml holds` });
    }
    const own = idsIn([l.data.blocks, l.data.errors, l.data.speakers]);
    for (const id of own.filter((i) => !i.startsWith(`${l.data.language}.`))) {
      problems.push({ rule: "LA-05", file: l.file, id, message: `an id of the language's own text starts with ${l.data.language}.` });
    }
    ids.push(...own);
  }
  for (const id of repeated(ids)) problems.push({ rule: "LA-06", file, id, message: "two elements of the topic share this id" });
  return problems;
}

export const structureProblems = (library: Library): Problem[] =>
  library.courses.flatMap((c) => [...courseProblems(c), ...c.topics.flatMap((t) => topicProblems(t, c.index?.data.source))]);
