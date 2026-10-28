// A topic's reading time in each explanation language, as the website reckons it (apps/web/reading-time.ts): the
// words a reader of that language reads in the default variety, at the pace of a learner reading grammar. They are
// the explanations in the language, its own blocks, and the course's examples and forms, which every reader reads.
import { WORDS_PER_MINUTE } from "../../../apps/web/reading-time.ts";
import { words } from "../../words.ts";
import type { Topic } from "../library.ts";
import { parseMarks, plain } from "../marks.ts";
import { languagePieces, type Piece, sourcePieces } from "../texts.ts";

const count = (pieces: Piece[], variety: string | undefined): number =>
  pieces
    .filter((p) => p.variety === undefined || p.variety === variety)
    .reduce((n, p) => n + words(plain(parseMarks(p.text).runs)).length, 0);

export function minutesOf(topic: Topic, source: string, variety: string | undefined): Record<string, number> {
  const pieces = sourcePieces(topic.source.data);
  const course = pieces.filter((p) => p.kind !== "explanation");
  const minutes = (n: number): number => Math.max(1, Math.round(n / WORDS_PER_MINUTE));
  return {
    [source]: minutes(count(pieces, variety)),
    ...Object.fromEntries(topic.languages.map((l) => [l.data.language, minutes(count([...course, ...languagePieces(l.data)], variety))])),
  };
}
