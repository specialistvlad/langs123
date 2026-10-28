// Reads a root of the new library (library/, or library/samples/) from disk: each course's index, each topic's
// source, language files and review record, the approvals and the concept registry, each file parsed and named by
// its path from core's root. A folder of the root is a course when it holds an index.yaml or a topic folder;
// schema/, samples/, words/ and needs/ hold the library's other data.
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { ROOT } from "../lib.ts";

export interface DataFile {
  file: string;
  data: unknown;
}

export interface TopicFiles {
  slug: string;
  source?: DataFile;
  languages: DataFile[];
  review?: DataFile;
  // The files of the topic's folder that are none of these.
  unknown: string[];
}

export interface CourseFiles {
  course: string;
  dir: string;
  index?: DataFile;
  topics: TopicFiles[];
}

export interface LibraryFiles {
  courses: CourseFiles[];
  approvals?: DataFile;
  concepts?: DataFile;
  // The files whose YAML doesn't parse, each with the parser's message.
  unreadable: { file: string; message: string }[];
}

export const OTHER_FOLDERS = ["schema", "samples", "words", "needs"];
const LANGUAGE_FILE = /^([a-z]{2})\.yaml$/;

const folders = async (dir: string): Promise<string[]> =>
  (await readdir(dir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

export async function readLibrary(root: string): Promise<LibraryFiles> {
  const unreadable: LibraryFiles["unreadable"] = [];
  async function read(path: string): Promise<DataFile | undefined> {
    const file = Bun.file(path);
    if (!(await file.exists())) return undefined;
    try {
      return { file: relative(ROOT, path), data: Bun.YAML.parse(await file.text()) };
    } catch (error) {
      unreadable.push({ file: relative(ROOT, path), message: (error as Error).message });
      return undefined;
    }
  }

  async function topic(dir: string, slug: string): Promise<TopicFiles> {
    const names = (await readdir(dir)).filter((n) => n.endsWith(".yaml")).sort();
    const languages = await Promise.all(names.filter((n) => LANGUAGE_FILE.test(n)).map((n) => read(join(dir, n))));
    const source = await read(join(dir, "source.yaml"));
    const review = await read(join(dir, "review.yaml"));
    return {
      slug,
      ...(source !== undefined && { source }),
      languages: languages.filter((l) => l !== undefined),
      ...(review !== undefined && { review }),
      unknown: names
        .filter((n) => !LANGUAGE_FILE.test(n) && n !== "source.yaml" && n !== "review.yaml")
        .map((n) => relative(ROOT, join(dir, n))),
    };
  }

  const courses: CourseFiles[] = [];
  for (const course of await folders(root)) {
    if (OTHER_FOLDERS.includes(course)) continue;
    const dir = join(root, course);
    const topics = await Promise.all((await folders(dir)).map((slug) => topic(join(dir, slug), slug)));
    const index = await read(join(dir, "index.yaml"));
    if (index === undefined && topics.length === 0) continue;
    courses.push({ course, dir: relative(ROOT, dir), ...(index !== undefined && { index }), topics });
  }
  const approvals = await read(join(root, "approvals.yaml"));
  const concepts = await read(join(root, "concepts.yaml"));
  return { courses, ...(approvals !== undefined && { approvals }), ...(concepts !== undefined && { concepts }), unreadable };
}

// The language a language file's name gives it: uk.yaml is Ukrainian's.
export const languageOfFile = (file: string): string => LANGUAGE_FILE.exec(file.split("/").pop() ?? "")?.[1] ?? "";
