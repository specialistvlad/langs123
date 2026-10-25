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
// Run: npm run export
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { exportLibrary } from "./export/library.ts";
import { ROOT } from "./lib.ts";

export type * from "./export/types.ts";
export { exportLibrary } from "./export/library.ts";

export const LIBRARY_FILE = join(ROOT, "build", "data", "library.json");

if (import.meta.main) {
  const library = await exportLibrary();
  await mkdir(dirname(LIBRARY_FILE), { recursive: true });
  await Bun.write(LIBRARY_FILE, JSON.stringify(library));
  console.log(`library.json: ${Object.keys(library.topics).length} topics from ${library.source.commit} into build/data/`);
}
