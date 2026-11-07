// A review request: one Claude Code session's task (12.2). The source request asks every question of a topic's source
// file; a language request asks those of one language file beside its source; the index request (index-request.ts)
// those of a course's index. Each carries the review's instructions as its system prompt, and as its prompt the
// context the questions name, the questions with what each is asked of (asking.ts), and the text as the files hold
// it. The session answers with its findings alone, in the schema below; the request knows how many questions it asks,
// so the rules that hold need no answer.
import type { TopicLanguageFile } from "../generated/library-v1.ts";
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Topic } from "../v1/library.ts";
import { toYaml } from "../v1/yaml.ts";
import { asking, holds, type Selection, selected } from "./asking.ts";
import { type Question, questionsOf, type RequestKind } from "./questions.ts";
import { topicInputs } from "./steps.ts";
import { targetIds } from "./targets.ts";

export interface Request {
  kind: RequestKind;
  // The topic's id, or the course's code for its index.
  topic: string;
  // The language file a language request reads.
  language?: string;
  system: string;
  prompt: string;
  // Each rule asked, with the number of elements it is asked of.
  asked: Record<string, number>;
  // The rules that wait on an input the request lacks, unasked, and the input each waits on.
  pending: string[];
  inputs: Record<string, string>;
  // The rules a request of its own asks alone.
  only?: string[];
}

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

// The review's instructions, a session's system prompt: what it reviews, what each question is asked of, and what
// the questions' braces name.
export const instructions = (reviewed: string, elements: string, braces: string): string =>
  [
    `You review ${reviewed} against the rules of its catalog. Each question below is a yes-or-no question, asked of ${elements}, by id.`,
    "Answer each question for each element. Report only the elements whose answer is no, or yes where the question says a yes makes a finding, each as a finding: the rule's id, the id of the element (`at`), what breaks the rule, in one or two sentences, and the fix, written as the text should read.",
    `A question names its context in braces: ${braces}`,
    "The text writes inline marks as {mark content} or {mark attribute content}: target, term, ipa, variant, l1, kanji, romaji, translit and the value marks. Keep them in your fixes.",
    "Give confidence low where the answer turns on a judgment of style or of a usage that varies, and high elsewhere. Reply through the schema alone.",
  ].join("\n\n");

export const INSTRUCTIONS = instructions(
  "one topic of a language library",
  "every element its line names",
  "{title} is the topic's title; {level} the level of the element's subtopic; {line} the essence line whose `to` names the element's subtopic; {fact} the fact block before the element; {source} the source sentence of the same id; {language} the language the element is written in, or whose speakers a reason concerns; {variety} the course's default variety, or the element's own; the other names are given in the context.",
);

function context(topic: Topic, course: Course): string[] {
  const titles = course.topics.filter((t) => t !== topic).map((t) => t.source.data.title.text);
  return [
    `Course: ${course.course}, explained first in ${course.index?.data.source ?? course.course}; its varieties: ${(course.index?.data.varieties ?? ["none"]).join(", ")}, the default first.`,
    `Neighbour topics ({titles}): ${titles.length === 0 ? "none" : titles.join("; ")}.`,
    `The topic's lowest level, SH-09's {level}: ${[...topic.source.data.subtopics].map((s) => s.level).sort()[0] ?? "A0"}.`,
    `The topic teaches plain forms ({plain}): ${course.index?.data.sections.flatMap((s) => s.topics).find((e) => e.id === topic.slug)?.script === "kana" ? "yes" : "no"}.`,
  ];
}

export function sourceRequest(topic: Topic, course: Course, catalog: Catalog, selection: Selection = {}): Request {
  const source = course.index?.data.source ?? course.course;
  const given = topicInputs(course.index?.data, topic.slug);
  const ids = (q: Question): string[] => targetIds(topic, q.target);
  const asked = asking(
    questionsOf(catalog, "source").filter((q) => holds(q, course.course, [course.course, source]) && selected(q, selection)),
    ids,
    given.given,
  );
  const prompt = [
    `# The source of ${topic.source.data.id}`,
    ...context(topic, course),
    "",
    "## Questions",
    ...asked.lines,
    ...given.lines,
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
    inputs: asked.inputs,
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
  const asked = asking(
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
    inputs: asked.inputs,
    ...(selection.only !== undefined && { only: selection.only }),
  };
}
