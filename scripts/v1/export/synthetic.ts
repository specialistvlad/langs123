// A library of the size v1 reaches, for the export's size budget (gate 4a check 9): the seven courses, each with the
// topics its levels plan, every topic the fixture's grown to the largest sample's size (ten subtopics, fifteen
// essence lines, four errors) and written in all 12 explanation languages. The sizes are the course files' and
// library.json's, in bytes and gzipped, as the app downloads them.
import type { TopicLanguageFile, TopicSource } from "../../generated/library-v1.ts";
import { EXPLAIN_CODES } from "../../lib.ts";
import { INDEX, SOURCE, UK } from "../fixture.ts";
import type { Course, Library, Topic } from "../library.ts";
import { exportCourses } from "./library.ts";

// The topics of each course at v1: English, Spanish and Ukrainian from A0 to C2, the others to A2.
export const PLAN: Record<string, number> = { en: 120, es: 120, uk: 120, fr: 45, ja: 45, it: 45, de: 45 };
const GROWTH = 5;

// Each id of a copy of the topic's text, renamed for its copy n.
const renamed = (value: unknown, n: number): unknown =>
  JSON.parse(JSON.stringify(value).replace(/"(id|to|in|after|line)":"([^"]+)"/g, `"$1":"$2-${n}"`));
// A text of the same length with its letters turned k places along their alphabet, so that no two topics, copies
// or languages repeat each other's words and the compressed sizes stay those of written text.
const turned = (text: string, k: number): string =>
  text
    .replace(/[a-z]/g, (c) => String.fromCharCode(97 + ((c.charCodeAt(0) - 97 + k) % 26)))
    .replace(/[а-я]/g, (c) => String.fromCharCode(1072 + ((c.charCodeAt(0) - 1072 + k) % 32)));
const turnedValues = (value: unknown, k: number): unknown =>
  JSON.parse(
    JSON.stringify(value).replace(
      /"(text|tr|ipa|wrong)":"((?:[^"\\]|\\.)*)"/g,
      (_, key: string, t: string) => `"${key}":"${turned(t, k)}"`,
    ),
  );

function grownSource(id: string, k: number): TopicSource {
  const copies = Array.from(
    { length: GROWTH },
    (_, n) =>
      turnedValues(renamed({ essence: SOURCE.essence, subtopics: SOURCE.subtopics, errors: SOURCE.errors }, n), k + n) as Pick<
        TopicSource,
        "essence" | "subtopics" | "errors"
      >,
  );
  return {
    ...structuredClone(SOURCE),
    id,
    status: "approved",
    essence: copies.flatMap((c) => c.essence),
    subtopics: copies.flatMap((c) => c.subtopics),
    errors: copies.slice(0, 2).flatMap((c) => c.errors),
  };
}

function grownLanguage(language: string, k: number): TopicLanguageFile {
  const text: TopicLanguageFile["text"] = {};
  for (let n = 0; n < GROWTH; n++) {
    for (const [id, v] of Object.entries(UK.text)) {
      text[`${id}-${n}`] = typeof v === "string" ? turned(v, k + n) : v.map((t) => turned(t, k + n));
    }
  }
  return { language: language as TopicLanguageFile["language"], nativeReview: false, text: { ...UK.text, ...text } };
}

export function syntheticLibrary(plan: Record<string, number> = PLAN): Library {
  const courses = Object.entries(plan).map(([code, count]): Course => {
    const source = code === "ja" ? "en" : code;
    const topics = Array.from({ length: count }, (_, n): Topic => {
      const slug = `topic-${n + 1}`;
      const languages = EXPLAIN_CODES.filter((l) => l !== source).map((l, m) => ({ file: `${l}.yaml`, data: grownLanguage(l, 7 * n + m) }));
      return { course: code, slug, source: { file: "source.yaml", data: grownSource(`${code}.${slug}`, 7 * n) }, languages };
    });
    const entries = topics.map((t, n) => ({ ...structuredClone(INDEX.sections[0]?.topics[0] as object), id: t.slug, path: { A1: n + 1 } }));
    const index = {
      ...structuredClone(INDEX),
      course: code,
      source,
      sections: [{ ...structuredClone(INDEX.sections[0]), topics: entries }],
    } as unknown as typeof INDEX;
    return { course: code, dir: code, index: { file: "index.yaml", data: index }, topics };
  });
  return { courses };
}

// The export's size budget, for the owner to approve: a course file within 8 MB, 1.5 MB gzipped, the size the app
// loads when a reader opens the course (9.10); library.json within 1 MB, 100 KB gzipped, which it loads at start.
export const BUDGET = { course: { bytes: 8_000_000, gzipped: 1_500_000 }, library: { bytes: 1_000_000, gzipped: 100_000 } };

export interface Sizes {
  file: string;
  bytes: number;
  gzipped: number;
}

// The size of each file the library's export writes.
export function exportSizes(library: Library): Sizes[] {
  const out = exportCourses(library);
  const size = (file: string, value: unknown): Sizes => {
    const text = JSON.stringify(value);
    return { file, bytes: Buffer.byteLength(text), gzipped: Bun.gzipSync(text).byteLength };
  };
  return [size("library.json", out.library), ...out.courses.map((c) => size(`${c.course}.json`, c))];
}
