// Converts the samples' folder in place (scripts/v1/convert.ts): each topic's source file rewritten in the new
// shape, keeping its opening comment; each language file given its fingerprints, its layout kept; and each course's
// index.yaml written, its name and varieties today's, its one section named as the interface names topics.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { INTERFACE, loadCurriculum, SITE } from "../lib.ts";
import { convertSource, sampleIndex, type Sample } from "./convert.ts";
import { stamped, withFingerprints } from "./fingerprints.ts";
import { parseMarks, plain } from "./marks.ts";
import { headerOf, toYaml } from "./yaml.ts";

type Node = Record<string, unknown>;

// The order the samples' README lists them in.
const ORDER = ["alphabet", "words-of-place", "present-simple", "subject-pronouns"];
const plainText = (text: string): string => plain(parseMarks(text).runs);

async function convertTopic(dir: string): Promise<{ source: Node; english: (id: string) => string }> {
  const text = await Bun.file(join(dir, "source.yaml")).text();
  const source = convertSource(Bun.YAML.parse(text) as Node);
  await Bun.write(join(dir, "source.yaml"), toYaml(source, headerOf(text)));
  const sentences = new Map<string, string>();
  const collect = (node: unknown): void => {
    if (Array.isArray(node)) node.forEach(collect);
    else if (typeof node === "object" && node !== null) {
      const { id, text: t } = node as Node;
      if (typeof id === "string" && typeof t === "string") sentences.set(id, t);
      Object.values(node).forEach(collect);
    }
  };
  collect(source);
  let english = (id: string): string => plainText(sentences.get(id) ?? "");
  for (const name of (await readdir(dir)).filter((n) => /^[a-z]{2}\.yaml$/.test(n))) {
    const langText = await Bun.file(join(dir, name)).text();
    const file = Bun.YAML.parse(langText) as TopicLanguageFile;
    await Bun.write(join(dir, name), withFingerprints(langText, stamped(source as unknown as TopicSource, file)));
    if (file.language === "en") {
      const translated = (id: string): string => {
        const t = file.text[id];
        return plainText(Array.isArray(t) ? t.join(" ") : (t ?? ""));
      };
      english = translated;
    }
  }
  return { source, english };
}

export async function convertSamples(root: string): Promise<string[]> {
  const curriculum = await loadCurriculum();
  const written: string[] = [];
  const courses = (await readdir(root, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  for (const course of courses.sort()) {
    const slugs = (await readdir(join(root, course))).filter((s) => ORDER.includes(s)).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const samples: Sample[] = [];
    for (const slug of slugs) samples.push({ slug, ...(await convertTopic(join(root, course, slug))) });
    const name = SITE.explain.find((e) => e.code === course)?.name;
    const varieties = curriculum.languages.find((l) => l.code === course)?.varieties;
    const index = sampleIndex(course, name, varieties, INTERFACE.text.topics, samples);
    const header = `# The index of the ${String((name as Record<string, string> | undefined)?.["en"])} samples, written by their conversion (scripts/v1/convert.ts).\n`;
    await Bun.write(join(root, course, "index.yaml"), toYaml(index, header));
    written.push(join(course, "index.yaml"), ...slugs.map((s) => join(course, s)));
  }
  return written;
}
