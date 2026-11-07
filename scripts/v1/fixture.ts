// A small library in the new shape for the tests: one course, English, with two varieties, and one topic that uses
// every block, an essence, errors and a picture, with its Ukrainian file. Each test takes a fresh copy, changes
// what it checks, and reads it in memory (files) or from a folder (write).
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import type { CourseIndex, Localized, TopicLanguageFile } from "../generated/library-v1.ts";
import { EXPLAIN_CODES, ROOT } from "../lib.ts";
import { stamped } from "./fingerprints.ts";
import { SOURCE } from "./fixture-source.ts";
import type { LibraryFiles } from "./load.ts";

export { SOURCE } from "./fixture-source.ts";

const everywhere = (text: string): Localized => Object.fromEntries(EXPLAIN_CODES.map((c) => [c, text])) as unknown as Localized;

export const INDEX: CourseIndex = {
  course: "en",
  name: everywhere("English"),
  source: "en",
  varieties: ["en-GB", "en-US"],
  status: "approved",
  sections: [
    {
      id: "foundations",
      name: everywhere("Foundations"),
      topics: [
        {
          id: "letters",
          subject: "The letters",
          covers: ["names of letters"],
          path: { A0: 1, A1: 2 },
          status: "approved",
          script: "alphabet",
        },
      ],
    },
  ],
};

export const UK: TopicLanguageFile = {
  language: "uk",
  nativeReview: false,
  text: {
    title: "Літери",
    def: "Літери — це {term A} і {term Z}, і кожна має назву.",
    "names.title": "Назви",
    "names.fact.1": ["Кожна літера має назву.", "{term A} має назву {ipa eɪ}."],
    "names.z": "Її назва залежить від варіанта.",
    "ex.apple": "яблуко",
    "ex.zoo": "зоопарк",
    "names.why.1": "Назва дає змогу вимовити літеру.",
    "ess.do.ex": "Я працюю.",
    "forms.title": "Форми",
    "forms.fact.1": "Після {term he} дієслово додає {term -s}.",
    "forms.col.person": "Особа",
    "forms.col.sg": "Однина",
    "forms.col.pl": "Множина",
    "forms.first.name": "перша особа",
    "forms.office": "Я працюю в офісі.",
    "forms.us": "Він працює.",
    "err.a.rule": "Назва літери {term A} — {ipa eɪ}.",
    "err.a.uk": "Українською {term A} читають як {l1 uk а}.",
    "err.s.right": "Вона працює.",
    "err.s.rule": "Дієслово додає {term -s}.",
    "err.s.ja": "Японські дієслова мають одну форму.",
  },
  blocks: [
    {
      id: "uk.names.fact",
      type: "fact",
      in: "names",
      after: "names.list",
      text: [{ id: "uk.names.fact.1", text: "Українська абетка кирилична." }],
    },
    {
      id: "uk.names.example",
      type: "example",
      in: "names",
      after: "names.list",
      items: [{ id: "uk.names.box", text: "{target b}ox", tr: "коробка" }],
    },
  ],
};

UK.fingerprints = stamped(SOURCE, UK);

type CourseFiles = LibraryFiles["courses"][number];
type TopicFiles = CourseFiles["topics"][number];

// A fresh copy of the library's files, as the loader gives them, with its course's and its topic's files.
export function fixture(): { files: LibraryFiles; course: CourseFiles; topic: TopicFiles } {
  const copy = structuredClone({ INDEX, SOURCE, UK });
  const topic: TopicFiles = {
    slug: "letters",
    source: { file: "library/en/letters/source.yaml", data: copy.SOURCE },
    languages: [{ file: "library/en/letters/uk.yaml", data: copy.UK }],
    unknown: [],
  };
  const course: CourseFiles = {
    course: "en",
    dir: "library/en",
    index: { file: "library/en/index.yaml", data: copy.INDEX },
    topics: [topic],
  };
  const files: LibraryFiles = {
    courses: [course],
    approvals: { file: "library/approvals.yaml", data: [{ what: "index:en", by: "owner", date: "2026-10-28" }] },
    unreadable: [],
  };
  return { files, course, topic };
}

export const files = (): LibraryFiles => fixture().files;

// Writes the files to a new folder and returns it, the library's root; each file's path then reads from that root.
export async function write(library: LibraryFiles): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "library-"));
  const all = [
    library.approvals,
    library.concepts,
    ...library.courses.flatMap((c) => [c.index, c.review, ...c.topics.flatMap((t) => [t.source, t.review, ...t.languages])]),
  ];
  for (const f of all) {
    if (f === undefined) continue;
    const path = join(root, relative("library", f.file));
    await mkdir(join(path, ".."), { recursive: true });
    await Bun.write(path, Bun.YAML.stringify(f.data, null, 2));
  }
  return root;
}

// The path from core's root to a file of a written library, as the loader names it.
export const named = (root: string, file: string): string => relative(ROOT, join(root, relative("library", file)));
