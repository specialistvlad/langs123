// The new library's export (9.2, 9.8, 9.10), described by library/schema/export.schema.json: library.json, what the
// index screens read, the chosen design's colours and type styles, every course with its sections, its topics' titles,
// definitions, levels and reading minutes, and its study path; one file per course with its topics, loaded when a
// reader opens the course; and one layer file per topic and language but the source, loaded on top of a web page
// (7.4, layers.ts).
// The export holds the approved topics, and every topic with drafts, for the samples, the tests and the preview (RV-03).
import { join } from "node:path";
import type { Course as CourseEntry, CourseFile, LayerFile, LibraryFile, Topic as Exported } from "../../generated/export-v1.ts";
import { EXPLAIN_CODES, INTERFACE, LEVELS, ROOT } from "../../lib.ts";
import { varietyName } from "../../text.ts";
import { commitOf, levelScale, siteOf } from "../../export/library.ts";
import { type Course, type Library, typedLibrary } from "../library.ts";
import { readLibrary } from "../load.ts";
import { designOf } from "./design.ts";
import { layersOf } from "./layers.ts";
import { exportTopic } from "./topic.ts";
import { EXPORT_VERSION } from "./version.ts";

export { EXPORT_VERSION } from "./version.ts";

export interface V1Options {
  library: "v1";
  // The library's root: library/ when none is given.
  root?: string;
  drafts?: boolean;
  // The design whose level colours, colours and type styles the export carries (tokens.ts).
  design?: string;
}

export interface LibraryV1 {
  library: LibraryFile;
  courses: CourseFile[];
  // One layer per topic and language, at its path under the export's folder.
  layers: { path: string; data: LayerFile }[];
}

function entryOf(c: Course & { index: NonNullable<Course["index"]> }, topics: Exported[]): CourseEntry {
  const { data } = c.index;
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  const entries = data.sections.flatMap((s) => s.topics);
  return {
    code: c.course,
    name: Object.fromEntries(Object.entries(data.name)),
    source: data.source,
    varieties: (data.varieties ?? []).map((v) => ({
      code: v,
      name: Object.fromEntries(EXPLAIN_CODES.map((e) => [e, varietyName(v as Parameters<typeof varietyName>[0], e)])),
    })),
    levels: LEVELS.filter((l) => topics.some((t) => t.levels.includes(l))),
    sections: data.sections.map((s) => ({
      id: s.id,
      name: Object.fromEntries(Object.entries(s.name)),
      topics: s.topics.flatMap((e) => {
        const t = bySlug.get(e.id);
        return t === undefined
          ? []
          : [{ id: e.id, title: t.title.text, definition: t.definition.text, levels: t.levels, minutes: t.minutes }];
      }),
    })),
    path: LEVELS.flatMap((level) => {
      const at = entries
        .filter((e) => e.path[level] !== undefined && bySlug.has(e.id))
        .sort((a, b) => (a.path[level] ?? 0) - (b.path[level] ?? 0));
      return at.length === 0 ? [] : [{ level, topics: at.map((e) => e.id) }];
    }),
  };
}

// The export of a library already read: each course with an index, its topics the approved ones, or all with drafts.
export function exportCourses(library: Library, options: Omit<V1Options, "library" | "root"> = {}): LibraryV1 {
  const courses = library.courses.filter((c): c is Course & { index: NonNullable<Course["index"]> } => c.index !== undefined);
  const files = courses.map((c): CourseFile => {
    const shown = c.topics.filter((t) => options.drafts === true || t.source.data.status === "approved");
    return {
      version: EXPORT_VERSION,
      course: c.course,
      topics: shown.map((t) => exportTopic(t, c.index.data.source, c.index.data.varieties ?? [])),
    };
  });
  return {
    library: {
      version: EXPORT_VERSION,
      source: { commit: commitOf() },
      site: siteOf(),
      levels: levelScale(options.design),
      design: designOf(options.design),
      interface: INTERFACE,
      courses: courses.map((c, n) => entryOf(c, files[n]?.topics ?? [])),
    },
    courses: files,
    layers: layersOf(files, (code) => courses.find((c) => c.course === code)?.index.data.source ?? code),
  };
}

export async function exportV1(options: V1Options): Promise<LibraryV1> {
  const { library } = typedLibrary(await readLibrary(options.root ?? join(ROOT, "library")));
  return exportCourses(library, options);
}
