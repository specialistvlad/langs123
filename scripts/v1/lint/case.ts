// The linter's test cases: a fresh copy of the fixture library, changed as a rule's written case says, checked
// whole, with the problems of one rule read back. A case may make the fixture another course, add a language's file,
// give the linter its lists, or run the rules of the library's reach.
import type { CourseIndex, TopicLanguageFile, TopicReviewRecord, TopicSource, WordLists } from "../../generated/library-v1.ts";
import { catalog, checkFiles } from "../check.ts";
import { fixture } from "../fixture.ts";
import type { LibraryFiles } from "../load.ts";
import type { Needs } from "./index-rules.ts";
import type { Beside, Lexicon } from "./lint.ts";

const rules = await catalog();

export interface Case {
  files: LibraryFiles;
  index: CourseIndex;
  source: TopicSource;
  uk: TopicLanguageFile;
  // Sets the topic's review record.
  review: (record: TopicReviewRecord) => void;
  // Makes the fixture a course of another language, written in its source, with the varieties given.
  course: (code: string, source?: string, varieties?: string[]) => void;
  // Adds a language's file translating the ids given.
  language: (code: string, text: Record<string, string>) => TopicLanguageFile;
}

export interface Given {
  words?: WordLists[];
  kanji?: Lexicon["kanji"];
  needs?: Needs[];
  beside?: Omit<Beside, "lexicon">;
}

export function lintCase(rule: string, change: (c: Case) => void = () => undefined, given: Given = {}): string[] {
  const { files: copy, course, topic } = fixture();
  const c: Case = {
    files: copy,
    index: course.index?.data as CourseIndex,
    source: topic.source?.data as TopicSource,
    uk: topic.languages[0]?.data as TopicLanguageFile,
    review: (record) => {
      topic.review = { file: "library/en/letters/review.yaml", data: record };
    },
    course: (code, source = code, varieties) => {
      course.course = code;
      Object.assign(c.index, { course: code, source });
      if (varieties === undefined) Reflect.deleteProperty(c.index, "varieties");
      else c.index.varieties = varieties;
      c.source.id = `${code}.letters`;
    },
    language: (code, text) => {
      const file: TopicLanguageFile = { language: code as TopicLanguageFile["language"], nativeReview: false, text };
      topic.languages.push({ file: `library/en/letters/${code}.yaml`, data: file });
      return file;
    },
  };
  change(c);
  const lexicon: Lexicon = {
    words: new Map((given.words ?? []).map((w) => [w.language, w])),
    ...(given.kanji !== undefined && { kanji: given.kanji }),
  };
  return checkFiles(copy, rules, { ...given.beside, lexicon }, given.needs)
    .problems.filter((p) => p.rule === rule)
    .map((p) => `${p.id ?? p.file}: ${p.message}`);
}
