// The similar-topic check of an index (M6): a lexical TF-IDF cosine over each index entry's subject, coverage and
// concepts, pairing the entries of one course that stand close. It runs with no model and no download; the pairs it
// finds above the threshold are the candidates a Choice question decides on in a Claude Code session, as the review
// does. A local embedding model joins only where calibration shows this pass missing a near-duplicate the samples
// plant. The entry's subject and covers are plain strings in the index (library.schema.json → text), so the pass
// reads them as written; concepts are slugs, split on their hyphens into words.
import type { Entry } from "../generated/library-v1.ts";
import { checkRoot } from "../v1/check.ts";
import type { Library } from "../v1/library.ts";

// The cosine at or above which two entries of a course are a near-duplicate candidate. The distinct samples stand
// below 0.1 and a planted near-duplicate above 0.8, so 0.3 holds the candidates apart from the rest until
// calibration tunes it.
export const SIMILAR_THRESHOLD = 0.3;

export interface SimilarPair {
  course: string;
  // The ids of the two entries, in the index's order.
  a: string;
  b: string;
  // Their cosine similarity, 0 to 1, rounded to three places.
  score: number;
}

const TOKEN = /[\p{L}\p{M}\p{Nd}]+/gu;

// The words a comparison reads from an entry: its subject and its covers as written, and its concept slugs split on
// their hyphens, all lowercased.
function wordsOf(entry: Entry): string[] {
  const text = [entry.subject, ...entry.covers, ...(entry.concepts ?? [])].join(" ").toLowerCase();
  return [...text.matchAll(TOKEN)].map((m) => m[0]);
}

function counts(words: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const w of words) tf.set(w, (tf.get(w) ?? 0) + 1);
  return tf;
}

const norm = (v: Map<string, number>): number => Math.sqrt([...v.values()].reduce((s, w) => s + w * w, 0));

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [word, weight] of small) {
    const other = large.get(word);
    if (other !== undefined) dot += weight * other;
  }
  const na = norm(a);
  const nb = norm(b);
  return na === 0 || nb === 0 ? 0 : dot / (na * nb);
}

const round = (x: number): number => Math.round(x * 1000) / 1000;

// The close pairs among the entries of one course: TF-IDF over the course's own entries, so a word common to every
// entry carries no weight, then the cosine of each pair against the threshold.
function closeIn(course: string, entries: Entry[], threshold: number): SimilarPair[] {
  if (entries.length < 2) return [];
  const docs = entries.map((e) => ({ id: e.id, tf: counts(wordsOf(e)) }));
  const df = new Map<string, number>();
  for (const doc of docs) for (const word of doc.tf.keys()) df.set(word, (df.get(word) ?? 0) + 1);
  const idf = (word: string): number => Math.log(entries.length / (df.get(word) ?? entries.length));
  const vectors = docs.map((doc) => {
    const v = new Map<string, number>();
    for (const [word, tf] of doc.tf) v.set(word, tf * idf(word));
    return { id: doc.id, v };
  });
  const pairs: SimilarPair[] = [];
  vectors.forEach((x, i) => {
    for (const y of vectors.slice(i + 1)) {
      const score = cosine(x.v, y.v);
      if (score >= threshold) pairs.push({ course, a: x.id, b: y.id, score: round(score) });
    }
  });
  return pairs;
}

// The close pairs of every course of a loaded library, strongest first.
export function similarTopics(library: Library, threshold = SIMILAR_THRESHOLD): SimilarPair[] {
  const pairs = library.courses.flatMap((course) =>
    closeIn(
      course.course,
      (course.index?.data.sections ?? []).flatMap((s) => s.topics),
      threshold,
    ),
  );
  return pairs.sort((x, y) => y.score - x.score);
}

// The close pairs of the library at a root, as reviewQueue reads a root.
export const similarTopicsOf = async (root: string, threshold = SIMILAR_THRESHOLD): Promise<SimilarPair[]> =>
  similarTopics((await checkRoot(root)).library, threshold);
