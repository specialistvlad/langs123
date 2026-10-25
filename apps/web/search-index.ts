// The Home search's index of every word of every topic, as search/<language>.json holds it (pages/home-search.ts
// writes it), and the ranking the browser runs over it (client-home-find.ts). A word weighs by where it stands in
// a topic, how often, and how few topics hold it (BM25F): the title most, then the forms a rule is about, the lead
// and the section, then the rest of the lesson. Nothing here touches the page, so the build and the browser share it.

// Words compare without case, accents and marks: "Preterito" finds "Pretérito".
export const fold = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export const tokens = (s: string): string[] =>
  fold(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

// A topic's words by where they stand: the title, the lead with the section's name, the forms the text shows in
// bold, and every text of the lesson.
export interface TopicWords {
  title: string[];
  lead: string[];
  strong: string[];
  body: string[];
}
type Field = keyof TopicWords;

// Each word: how many topics hold it, then its best topics, each as its place in the topics and its weight ×100.
export type Index = Record<string, number[]>;

const FIELDS: Record<Field, number> = { title: 8, lead: 3, strong: 4, body: 1 };
// A word's weight grows with its count and levels off slowly: a lesson built on a word outweighs one that uses it
// in a few examples.
const K1 = 4;
const B = 0.75;
// A word keeps the topics it ranks best: a query lists 40 at most, and the file stays small.
export const BEST = 16;

export function indexOf(topics: TopicWords[]): Index {
  const fields = Object.keys(FIELDS) as Field[];
  const n = topics.length;
  const average = Object.fromEntries(fields.map((f) => [f, topics.reduce((s, t) => s + t[f].length, 0) / n || 1])) as Record<Field, number>;
  // Each word's weighted count in each topic, its field's length counting against it.
  const counts = new Map<string, Map<number, number>>();
  topics.forEach((topic, i) => {
    for (const f of fields) {
      const norm = 1 - B + (B * topic[f].length) / average[f];
      for (const word of topic[f]) {
        const per = counts.get(word) ?? new Map<number, number>();
        per.set(i, (per.get(i) ?? 0) + FIELDS[f] / norm);
        counts.set(word, per);
      }
    }
  });
  const index: Index = {};
  for (const [word, per] of counts) {
    const idf = Math.log(1 + (n - per.size + 0.5) / (per.size + 0.5));
    const best = [...per]
      .map(([i, tf]): [number, number] => [i, Math.max(1, Math.round((100 * idf * tf * (K1 + 1)) / (tf + K1)))])
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, BEST);
    index[word] = [per.size, ...best.flat()];
  }
  return index;
}

// The index comes in parts, one per first letter of its words (search/<language>/<part>.json), so a query loads
// only the parts its terms start with. A part's name is its letter's code point in hexadecimal: "77" for w.
export const partOf = (word: string): string => (word.codePointAt(0) ?? 0).toString(16);

export function partsOf(index: Index): Record<string, Index> {
  const parts: Record<string, Index> = {};
  for (const [word, postings] of Object.entries(index)) (parts[partOf(word)] ??= {})[word] = postings;
  return parts;
}

// One letter added, dropped or changed: "pasive" and "passive".
export function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// The words a term stands for, each with how much it counts. A word of the index stands for itself. The last
// term, which the reader may still be typing, stands for the commonest words it starts; a term of five letters
// or more that the index lacks stands for the words one letter away that start with the same letter, the words
// of its own part.
export function readings(index: Index, words: readonly string[], term: string, last: boolean): [string, number][] {
  if (index[term] !== undefined) return [[term, 1]];
  const common = (found: string[], worth: number): [string, number][] =>
    found
      .sort((a, b) => (index[b]?.[0] ?? 0) - (index[a]?.[0] ?? 0) || a.localeCompare(b))
      .slice(0, 6)
      .map((w) => [w, worth]);
  const started =
    last && term.length >= 3
      ? common(
          words.filter((w) => w.startsWith(term)),
          0.9,
        )
      : [];
  if (started.length > 0 || term.length < 5) return started;
  return common(
    words.filter((w) => partOf(w) === partOf(term) && oneEdit(term, w)),
    0.8,
  );
}

// Each topic a query finds, by its place in the topics, with its score: for every term, the best of the words it
// stands for.
export function scores(index: Index, words: readonly string[], terms: readonly string[]): Map<number, number> {
  const total = new Map<number, number>();
  terms.forEach((term, n) => {
    const best = new Map<number, number>();
    for (const [word, worth] of readings(index, words, term, n === terms.length - 1)) {
      const postings = index[word] ?? [];
      for (let k = 1; k + 1 < postings.length; k += 2) {
        const topic = postings[k] ?? 0;
        best.set(topic, Math.max(best.get(topic) ?? 0, worth * (postings[k + 1] ?? 0)));
      }
    }
    for (const [topic, s] of best) total.set(topic, (total.get(topic) ?? 0) + s);
  });
  return total;
}
