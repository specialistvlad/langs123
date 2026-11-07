// The new library as the checks, the tools and the export read it: the files that pass their schema, typed, each
// with its path. A file that fails its schema stays out, and the schema's problems name it; a topic folder
// without a source file is named as missing it.
import type {
  Approvals,
  ConceptRegistry,
  CourseIndex,
  TopicLanguageFile,
  TopicReviewRecord,
  TopicSource,
} from "../generated/library-v1.ts";
import type { DataFile, LibraryFiles } from "./load.ts";
import { type FileKind, type Problem, schemaProblems } from "./schema.ts";

export interface Typed<T> {
  file: string;
  data: T;
}

export interface Topic {
  course: string;
  slug: string;
  source: Typed<TopicSource>;
  languages: Typed<TopicLanguageFile>[];
  review?: Typed<TopicReviewRecord>;
}

export interface Course {
  course: string;
  dir: string;
  index?: Typed<CourseIndex>;
  // The index's review record, review.yaml beside it.
  review?: Typed<TopicReviewRecord>;
  topics: Topic[];
}

export interface Library {
  courses: Course[];
  approvals?: Typed<Approvals>;
  concepts?: Typed<ConceptRegistry>;
}

export function typedLibrary(files: LibraryFiles): { library: Library; problems: Problem[] } {
  const problems: Problem[] = files.unreadable.map((u) => ({ file: u.file, message: `its YAML doesn't parse: ${u.message}` }));
  function typed<T>(kind: FileKind, f: DataFile | undefined): Typed<T> | undefined {
    if (f === undefined) return undefined;
    const found = schemaProblems(kind, f.data, f.file);
    problems.push(...found);
    return found.length === 0 ? { file: f.file, data: f.data as T } : undefined;
  }
  function given<K extends string, T>(key: K, value: T | undefined): Partial<Record<K, T>> {
    return value === undefined ? {} : ({ [key]: value } as Record<K, T>);
  }

  const courses = files.courses.map((c): Course => {
    const topics = c.topics.flatMap((t): Topic[] => {
      for (const file of t.unknown) {
        problems.push({ file, message: "a topic's folder holds source.yaml, review.yaml and one file per language" });
      }
      if (t.source === undefined) {
        problems.push({ rule: "LA-01", file: `${c.dir}/${t.slug}`, message: "the topic has no source.yaml" });
        return [];
      }
      const source = typed<TopicSource>("source", t.source);
      const languages = t.languages.map((l) => typed<TopicLanguageFile>("language", l)).filter((l) => l !== undefined);
      const review = typed<TopicReviewRecord>("review", t.review);
      return source === undefined ? [] : [{ course: c.course, slug: t.slug, source, languages, ...given("review", review) }];
    });
    return {
      course: c.course,
      dir: c.dir,
      ...given("index", typed<CourseIndex>("index", c.index)),
      ...given("review", typed<TopicReviewRecord>("review", c.review)),
      topics,
    };
  });
  const library: Library = {
    courses,
    ...given("approvals", typed<Approvals>("approvals", files.approvals)),
    ...given("concepts", typed<ConceptRegistry>("concepts", files.concepts)),
  };
  return { library, problems };
}
