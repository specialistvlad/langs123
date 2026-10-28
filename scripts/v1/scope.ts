// Where a rule of the catalog (library/RULES.md) holds: in the courses its `Courses:` line lists and for the
// languages and varieties its `Languages:` line lists; a rule without the line holds in every one. The checks read
// a rule's reach from the catalog alone, so a course or a language joins a rule by a line of the catalog.
import type { Catalog } from "../rule-catalog.ts";

export interface Scope {
  courses?: string[];
  languages?: string[];
}

const list = (line: string | undefined): string[] | undefined => line?.split(",").map((s) => s.trim());

export function scopeOf(catalog: Catalog, id: string): Scope {
  const fields = catalog.rules.find((r) => r.id === id)?.fields ?? {};
  const courses = list(fields.courses);
  const languages = list(fields.languages);
  return { ...(courses !== undefined && { courses }), ...(languages !== undefined && { languages }) };
}

export const inCourse = (scope: Scope, course: string): boolean => scope.courses?.includes(course) ?? true;
