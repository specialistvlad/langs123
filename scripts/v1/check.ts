// Checks a root of the new library (library/, or library/samples/): each file against its schema, then the
// library's layout, the marks and the varieties of every topic's text, each language's alignment with its source,
// and every rule of the linter. Each problem names its rule. The lists the linter reads are library/'s.
// Run: npm run check -- --library v1 [root] [--reach]
import { basename, join } from "node:path";
import { INTERFACE, ROOT } from "../lib.ts";
import { type Catalog, readRules, RULES_FILE } from "../rule-catalog.ts";
import { alignmentProblems } from "./alignment.ts";
import { type Library, typedLibrary } from "./library.ts";
import type { Needs } from "./lint/index-rules.ts";
import { readLexicon, todayIds } from "./lint/lexicon.ts";
import { type Beside, makeLint, runLint } from "./lint/lint.ts";
import { lintRules } from "./lint/rules.ts";
import { type LibraryFiles, readLibrary } from "./load.ts";
import { markProblems } from "./marks-check.ts";
import type { Problem } from "./schema.ts";
import { structureProblems } from "./structure.ts";

export const catalog = async (): Promise<Catalog> => readRules(RULES_FILE);

export function checkFiles(
  files: LibraryFiles,
  rules: Catalog,
  beside: Beside = {},
  needs: Needs[] = [],
): { library: Library; problems: Problem[] } {
  const { library, problems } = typedLibrary(files);
  problems.push(...structureProblems(library));
  for (const course of library.courses) {
    problems.push(...markProblems(course, course.topics, rules));
    for (const topic of course.topics) problems.push(...alignmentProblems(topic, course.index?.data.source));
  }
  problems.push(...runLint(lintRules(needs), makeLint(library, rules, beside)));
  return { library, problems };
}

export async function checkRoot(root: string, reach = false): Promise<{ library: Library; problems: Problem[] }> {
  const { lexicon, needs, problems } = await readLexicon(join(ROOT, "library"));
  const wording = INTERFACE.text as unknown as Record<string, Record<string, string>>;
  const options = { reach, samples: basename(root) === "samples" };
  const checked = checkFiles(await readLibrary(root), await catalog(), { lexicon, today: await todayIds(), wording, options }, needs);
  return { library: checked.library, problems: [...problems, ...checked.problems] };
}
