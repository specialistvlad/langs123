// Checks a root of the new library (library/, or library/samples/): each file against its schema, then the
// library's layout, then the marks and the varieties of every topic's text. Each problem names its rule.
// Run: npm run check -- --library v1 [root]
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import type { Catalog } from "../rule-catalog.ts";
import { type Library, typedLibrary } from "./library.ts";
import { type LibraryFiles, readLibrary } from "./load.ts";
import { markProblems } from "./marks-check.ts";
import type { Problem } from "./schema.ts";
import { structureProblems } from "./structure.ts";

export const catalog = async (): Promise<Catalog> => readRules(RULES_FILE);

export function checkFiles(files: LibraryFiles, rules: Catalog): { library: Library; problems: Problem[] } {
  const { library, problems } = typedLibrary(files);
  problems.push(...structureProblems(library));
  for (const course of library.courses) problems.push(...markProblems(course, course.topics, rules));
  return { library, problems };
}

export const checkRoot = async (root: string): Promise<{ library: Library; problems: Problem[] }> =>
  checkFiles(await readLibrary(root), await catalog());
