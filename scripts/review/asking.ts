// What a request asks (12.2): the questions of its kind that hold for its course and languages, as the catalog's
// Courses and Languages lines say, narrowed by a selection (all but some rules, or some alone, which then run as a
// request of their own); each question counted over the elements its target names and written as a line of the
// request's prompt; the rules that wait on an input M6 brings stay pending, unasked.
import type { Question } from "./questions.ts";

export interface Selection {
  only?: string[];
  except?: string[];
}

export const selected = (q: Question, s: Selection): boolean => (s.only?.includes(q.rule) ?? true) && s.except?.includes(q.rule) !== true;

// Whether a question holds for a text in these languages of this course, as its catalog lines say.
export const holds = (q: Question, course: string, languages: string[]): boolean =>
  (q.scope.courses?.includes(course) ?? true) && (q.scope.languages?.some((l) => languages.includes(l.split("-")[0] ?? "")) ?? true);

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
  "practical entries": "every entry that carries a practical cluster",
  "new entries": "every entry that names no topic in replaces",
};

export interface Asked {
  lines: string[];
  asked: Record<string, number>;
  pending: string[];
}

export function asking(qs: Question[], ids: (q: Question) => string[]): Asked {
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
