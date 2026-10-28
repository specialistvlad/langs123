// A review request: one Claude Code session's task (12.2). The source request asks every question of a topic's source
// file; a language request asks those of one language file beside its source. Each carries the review's instructions
// as its system prompt, and as its prompt the context the questions name, the questions with what each is asked of,
// and the text as the files hold it. The session answers with its findings alone, in the schema below; the request
// knows how many questions it asks, so the rules that hold need no answer. A selection narrows the rules a request asks:
// all but some, or some alone, which then run as a request of their own.
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Topic } from "../v1/library.ts";
import { toYaml } from "../v1/yaml.ts";
import { type Question, questionsOf, type RequestKind } from "./questions.ts";
import { targetIds } from "./targets.ts";

export interface Request {
  kind: RequestKind;
  topic: string;
  // The language file a language request reads.
  language?: string;
  system: string;
  prompt: string;
  // Each rule asked, with the number of elements it is asked of.
  asked: Record<string, number>;
  // The rules that wait on an input M6 brings, unasked.
  pending: string[];
  // The rules a request of its own asks alone.
  only?: string[];
}

export interface Selection {
  only?: string[];
  except?: string[];
}

const selected = (q: Question, s: Selection): boolean => (s.only?.includes(q.rule) ?? true) && s.except?.includes(q.rule) !== true;

export const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rule", "at", "text", "fix", "confidence"],
        properties: {
          rule: { type: "string", pattern: "^[A-Z]{2}-\\d{2}$" },
          at: { type: "string" },
          text: { type: "string" },
          fix: { type: "string" },
          confidence: { enum: ["high", "low"] },
        },
      },
    },
  },
};

export const INSTRUCTIONS = [
  "You review one topic of a language library against the rules of its catalog. Each question below is a yes-or-no question, asked of every element its line names, by id.",
  "Answer each question for each element. Report only the elements whose answer is no, or yes where the question says a yes makes a finding, each as a finding: the rule's id, the id of the element (`at`), what breaks the rule, in one or two sentences, and the fix, written as the text should read.",
  "A question names its context in braces: {title} is the topic's title; {level} the level of the element's subtopic; {line} the essence line whose `to` names the element's subtopic; {fact} the fact block before the element; {source} the source sentence of the same id; {language} the language the element is written in, or whose speakers a reason concerns; {variety} the course's default variety, or the element's own; the other names are given in the context.",
  "The text writes inline marks as {mark content} or {mark attribute content}: target, term, ipa, variant, l1, kanji, romaji, translit and the value marks. Keep them in your fixes.",
  "Give confidence low where the answer turns on a judgment of style or of a usage that varies, and high elsewhere. Reply through the schema alone.",
].join("\n\n");

// What a target names, where its ids are too many to list.
const DESCRIBED: Record<Question["target"], string> = {
  definition: "the definition",
  opening: "the title, the definition and each essence line",
  explanations: "every sentence of explanation",
  sentences: "every sentence",
  examples: "every example",
  "course text": "every example, cell and form",
  essence: "the essence",
  blocks: "every block",
  facts: "every fact block",
  whys: "every why block",
  lists: "every list block",
  errors: "every error",
  reasons: "every reason of an error's speakers",
  translations: "every translated sentence, beside its source sentence",
  "example translations": "every translated example, beside its source example",
  "own blocks": "every block of the file's own",
  "untagged blocks": "every block that carries no variety",
  entries: "every entry of the index",
};

function questions(qs: Question[], ids: (q: Question) => string[]): { lines: string[]; asked: Record<string, number>; pending: string[] } {
  const asked: Record<string, number> = {};
  const lines: string[] = [];
  const pending: string[] = [];
  for (const q of qs) {
    if (q.pending !== undefined) {
      pending.push(q.rule);
      continue;
    }
    const of = ids(q);
    if (of.length === 0) continue;
    asked[q.rule] = of.length;
    const fails = q.fails === undefined ? "" : ` A finding is a yes answer, where ${q.fails.when}.`;
    lines.push(
      `- ${q.rule} [${q.subject}], asked of ${of.length > 6 ? `${DESCRIBED[q.target]} (${of.length})` : of.join(", ")}: ${q.text}${fails}`,
    );
  }
  return { lines, asked, pending };
}

// Whether a question holds for a text in these languages of this course, as its catalog lines say.
const holds = (q: Question, course: string, languages: string[]): boolean =>
  (q.scope.courses?.includes(course) ?? true) && (q.scope.languages?.some((l) => languages.includes(l.split("-")[0] ?? "")) ?? true);

function context(topic: Topic, course: Course): string[] {
  const titles = course.topics.filter((t) => t !== topic).map((t) => t.source.data.title.text);
  return [
    `Course: ${course.course}, explained first in ${course.index?.data.source ?? course.course}; its varieties: ${(course.index?.data.varieties ?? ["none"]).join(", ")}, the default first.`,
    `Neighbour topics ({titles}): ${titles.length === 0 ? "none" : titles.join("; ")}.`,
    `The topic teaches plain forms ({plain}): ${course.index?.data.sections.flatMap((s) => s.topics).find((e) => e.id === topic.slug)?.script === "kana" ? "yes" : "no"}.`,
  ];
}

export function sourceRequest(topic: Topic, course: Course, catalog: Catalog, selection: Selection = {}): Request {
  const source = course.index?.data.source ?? course.course;
  const asked = questions(
    questionsOf(catalog, "source").filter((q) => holds(q, course.course, [course.course, source]) && selected(q, selection)),
    (q) => targetIds(topic, q.target),
  );
  const prompt = [
    `# The source of ${topic.source.data.id}`,
    ...context(topic, course),
    "",
    "## Questions",
    ...asked.lines,
    "",
    "## The source file",
    "```yaml",
    toYaml(topic.source.data).trimEnd(),
    "```",
  ];
  return {
    kind: "source",
    topic: topic.source.data.id,
    system: INSTRUCTIONS,
    prompt: prompt.join("\n"),
    asked: asked.asked,
    pending: asked.pending,
    ...(selection.only !== undefined && { only: selection.only }),
  };
}

const withoutFingerprints = (file: TopicLanguageFile): object =>
  Object.fromEntries(Object.entries(file).filter(([k]) => k !== "fingerprints"));

export function languageRequest(
  topic: Topic,
  course: Course,
  file: TopicLanguageFile,
  catalog: Catalog,
  selection: Selection = {},
): Request {
  const asked = questions(
    questionsOf(catalog, "language").filter((q) => holds(q, course.course, [file.language, course.course]) && selected(q, selection)),
    (q) => targetIds(topic, q.target, file),
  );
  const prompt = [
    `# The ${file.language} file of ${topic.source.data.id}`,
    ...context(topic, course),
    `The file translates the source into ${file.language} under the source's ids, a list where it splits a sentence and a key a + b where it joins two, and holds the blocks, errors and reasons of its own readers.`,
    "",
    "## Questions",
    ...asked.lines,
    "",
    "## The source file",
    "```yaml",
    toYaml(topic.source.data).trimEnd(),
    "```",
    "",
    `## The ${file.language} file`,
    "```yaml",
    toYaml(withoutFingerprints(file)).trimEnd(),
    "```",
  ];
  return {
    kind: "language",
    topic: topic.source.data.id,
    language: file.language,
    system: INSTRUCTIONS,
    prompt: prompt.join("\n"),
    asked: asked.asked,
    pending: asked.pending,
    ...(selection.only !== undefined && { only: selection.only }),
  };
}
