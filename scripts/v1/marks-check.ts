// The marks and the varieties of a topic's text. Every text parses in the mark grammar, each mark standing in the
// text it serves: the course language's, an explanation's, or any (ST-06), each attribute in its form (ST-08,
// NO-24); every variety, of an element or a variant, is one its course lists (NO-28); and where NO-03 holds, an
// element of its variety stands only as one half of a swap with the course's default.
import type { Catalog } from "../rule-catalog.ts";
import type { Course, Topic } from "./library.ts";
import { MARKS, marksOf, parseMarks, swapsOf } from "./marks.ts";
import type { Problem } from "./schema.ts";
import { inCourse, scopeOf } from "./scope.ts";
import { languagePieces, type Piece, sourcePieces } from "./texts.ts";

export const MARK_RULES = ["ST-06", "ST-08", "NO-24", "NO-28", "NO-03"];

// The marks a piece of each kind takes: a form takes those of the course language.
const TAKES = { course: ["course", "any"], form: ["course", "any"], explanation: ["explanation", "any"] } as const;

// One piece's problems; where its course has no index, its varieties stay unknown and unchecked.
function pieceProblems(piece: Piece, file: string, varieties: string[] | undefined, swapsOnly: string[]): Problem[] {
  const id = piece.id ?? piece.of;
  const problems: Problem[] = [];
  const add = (rule: string, message: string): void => {
    problems.push({ rule, file, id, message });
  };
  const parsed = parseMarks(piece.text);
  for (const p of parsed.problems) add(p.rule, p.message);
  for (const { mark } of marksOf(parsed.runs)) {
    if (!(TAKES[piece.kind] as readonly string[]).includes(MARKS[mark.name].where)) {
      add(
        "ST-06",
        `{${mark.name}} stands in ${MARKS[mark.name].where === "course" ? "the course's text" : "explanations"}, not in this ${piece.kind}`,
      );
    }
    if (mark.name === "variant" && mark.attribute !== undefined && varieties?.includes(mark.attribute) === false) {
      add("NO-28", `${mark.attribute} is no variety of the course`);
    }
  }
  if (piece.variety !== undefined && varieties?.includes(piece.variety) === false) {
    add("NO-28", `${piece.variety} is no variety of the course`);
  }
  const standard = varieties?.[0] ?? "";
  if (piece.variety !== undefined && swapsOnly.includes(piece.variety)) {
    add("NO-03", `an element of ${piece.variety} stands as one half of a swap, beside its ${standard} form`);
  }
  for (const swap of swapsOf(parsed.runs)) {
    const has = swap.map((m) => m.attribute);
    for (const v of swapsOnly.filter((s) => has.includes(s) && !has.includes(standard))) {
      add("NO-03", `the ${v} form stands beside its ${standard} form`);
    }
  }
  return problems;
}

// The problems of every piece of a course's topics, each element's named once.
export function markProblems(course: Course, topics: Topic[], catalog: Catalog): Problem[] {
  const varieties = course.index === undefined ? undefined : (course.index.data.varieties ?? []);
  const no03 = scopeOf(catalog, "NO-03");
  const swapsOnly = inCourse(no03, course.course) ? (no03.languages ?? []).filter((l) => varieties?.includes(l) === true) : [];
  const problems = topics.flatMap((t) => [
    ...sourcePieces(t.source.data).flatMap((p) => pieceProblems(p, t.source.file, varieties, swapsOnly)),
    ...t.languages.flatMap((l) => languagePieces(l.data).flatMap((p) => pieceProblems(p, l.file, varieties, swapsOnly))),
  ]);
  const seen = new Set<string>();
  return problems.filter((p) => {
    const key = JSON.stringify(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
