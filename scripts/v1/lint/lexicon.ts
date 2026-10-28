// The lists the linter reads beside the topics: each explanation language's words (words/<language>.yaml), the
// kanji of each level (ja/kanji.yaml) and each language's search needs (needs/<language>.yaml), each checked against
// its schema; and the ids of today's library's topics, which a replaces entry names (IX-07).
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type { KanjiByLevel, SearchNeeds, WordLists } from "../../generated/library-v1.ts";
import { loadCurriculum, ROOT, topicId } from "../../lib.ts";
import { type FileKind, type Problem, schemaProblems } from "../schema.ts";
import type { Lexicon } from "./lint.ts";
import type { Needs } from "./index-rules.ts";

async function read(kind: FileKind, path: string, problems: Problem[]): Promise<{ file: string; data: unknown } | undefined> {
  const f = Bun.file(path);
  if (!(await f.exists())) return undefined;
  const file = relative(ROOT, path);
  const data: unknown = Bun.YAML.parse(await f.text());
  const found = schemaProblems(kind, data, file);
  problems.push(...found);
  return found.length === 0 ? { file, data } : undefined;
}

const yamls = async (dir: string): Promise<string[]> =>
  (await readdir(dir).catch((): string[] => [])).filter((n) => n.endsWith(".yaml")).sort();

export async function readLexicon(root: string): Promise<{ lexicon: Lexicon; needs: Needs[]; problems: Problem[] }> {
  const problems: Problem[] = [];
  const words = new Map<string, WordLists>();
  for (const name of await yamls(join(root, "words"))) {
    const w = await read("words", join(root, "words", name), problems);
    if (w !== undefined) words.set((w.data as WordLists).language, w.data as WordLists);
  }
  const needs: Needs[] = [];
  for (const name of await yamls(join(root, "needs"))) {
    const n = await read("needs", join(root, "needs", name), problems);
    if (n !== undefined) needs.push({ language: name.slice(0, 2), file: n.file, data: n.data as SearchNeeds });
  }
  const kanji = await read("kanji", join(root, "ja", "kanji.yaml"), problems);
  return { lexicon: { words, ...(kanji !== undefined && { kanji: kanji.data as KanjiByLevel }) }, needs, problems };
}

export async function todayIds(): Promise<Set<string>> {
  const curriculum = await loadCurriculum();
  return new Set(curriculum.languages.flatMap((l) => l.sections.flatMap((s) => s.topics.map((t) => topicId(l.code, s.dir, t.slug)))));
}
