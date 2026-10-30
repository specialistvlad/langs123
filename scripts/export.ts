// Exports the library as one JSON file for apps and other readers: build/data/library.json, described by
// languages/schema/library.schema.json. Every value comes in one shape a native client decodes directly.
// Text in the §12 vocabulary folds into inline Markdown per explanation language, as the website shows it:
// bold for the marks it shows bold, italics for those it shows in italics, [title](id:topic) for a link,
// and its joiners, IPA slashes and variety names; the marks that carry a look of their own (IPA, joiners,
// optional words, gaps, slots, intonation arrows, inline varieties, kanji and its reading) are written
// [text](m:tag,tag); a translation folds into plain text. Explanation text is localized ({ en: … }); text
// in the language being learned is one string, or localized where it reads differently per explanation
// language. Each block keeps its type (prose, list, paradigm, usage, comparison, inventory, errors). Table
// rows carry cells in column order and an empty object where a row leaves a slot empty; slot paradigm
// columns carry their titles, their sentence as a group, merge and center, as the website lays them out.
// `for` lists the explanation languages an element serves. Every leaf keeps its level; readers derive the
// ranges of blocks, sections and topics from the leaves, as levels.ts does.
// With --library v1, it writes the new library's export (scripts/v1/export/library.ts) into build/data/v1/:
// library.json and one file per course, described by library/schema/export.schema.json.
// Run: npm run export; npm run export -- --design <name> carries that design's level colours (tokens.ts);
//      npm run export -- --library v1 [root] [--drafts] [--design <name>], the design's colours and type styles too
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { designArg } from "../apps/web/tokens.ts";
import { exportLibrary as exportToday } from "./export/library.ts";
import type { Library } from "./export/types.ts";
import { ROOT } from "./lib.ts";
import { exportV1, type LibraryV1, type V1Options } from "./v1/export/library.ts";

export type * from "./export/types.ts";
export type { LibraryV1, V1Options } from "./v1/export/library.ts";

export const LIBRARY_FILE = join(ROOT, "build", "data", "library.json");
export const LIBRARY_V1_DIR = join(ROOT, "build", "data", "v1");

// The library's export: today's library.json, of the topics given or all, in a design; or, given { library: "v1" },
// the new library's files.
export function exportLibrary(options: V1Options): Promise<LibraryV1>;
export function exportLibrary(only?: readonly string[], design?: string): Promise<Library>;
export function exportLibrary(first?: readonly string[] | V1Options, design?: string): Promise<Library | LibraryV1> {
  return first !== undefined && "library" in first ? exportV1(first) : exportToday(first, design);
}

const args = process.argv.slice(2);
const at = args.indexOf("--library");
if (import.meta.main && at >= 0 && args[at + 1] === "v1") {
  const root = args[at + 2]?.startsWith("--") === false ? args[at + 2] : undefined;
  const v1 = await exportLibrary({
    library: "v1",
    drafts: args.includes("--drafts"),
    design: designArg(args),
    ...(root !== undefined && { root }),
  });
  await mkdir(LIBRARY_V1_DIR, { recursive: true });
  await Bun.write(join(LIBRARY_V1_DIR, "library.json"), JSON.stringify(v1.library));
  for (const course of v1.courses) await Bun.write(join(LIBRARY_V1_DIR, `${course.course}.json`), JSON.stringify(course));
  console.log(
    `build/data/v1: library.json and ${v1.courses.length} course files, ${v1.courses.reduce((n, c) => n + c.topics.length, 0)} topics`,
  );
} else if (import.meta.main) {
  const library = await exportLibrary(undefined, designArg(process.argv.slice(2)));
  await mkdir(dirname(LIBRARY_FILE), { recursive: true });
  await Bun.write(LIBRARY_FILE, JSON.stringify(library));
  console.log(`library.json: ${Object.keys(library.topics).length} topics from ${library.source.commit} into build/data/`);
}
