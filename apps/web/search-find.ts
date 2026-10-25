// The topics a query finds in the Home's search data (search/<language>.json, pages/home-search.ts): those whose
// title holds every term first, by how the title holds them, then the rest by the index (search-index.ts); the
// filters of the Home (a course, the levels up to one) narrow them. The page, the build's tests and other apps share it.
import { fold, type Index, scores, tokens } from "./search-index.ts";

export interface Topic {
  title: string;
  url: string;
  // The levels the topic holds, lowest first.
  levels: string[];
  summary: string;
  flag: string;
  course: string;
  other: string;
  otherLang: string;
  // The course's code, per level what the topic holds there (the level popover's entry), and the topic's id.
  code: string;
  entry: Record<string, string>;
  id: string;
  order: number;
  t: string;
}
type Row = [string, string, string, string, string, string, string, string, string, string, Record<string, string>, string];
export interface SearchData {
  levels: string[];
  topics: Row[];
  // The parts of the index there are, by first letter (search-index.ts, partOf).
  parts: string[];
}

export const topicsOf = (data: SearchData): Topic[] =>
  data.topics.map(([title, url, levels, summary, , flag, course, other, otherLang, code, entry, id], order) => ({
    title,
    url,
    levels: levels.split(" "),
    summary,
    flag,
    course,
    other,
    otherLang,
    code,
    entry,
    id,
    order,
    t: fold(title),
  }));

// The filters of the Home's search (search-filters.ts): one course, or all ("" for all); and the levels up to one,
// a topic counting when its lowest level sits at or below it ("" for every level).
export interface Filters {
  course: string;
  upTo: string;
}
export const filtered = (topics: Topic[], filters: Filters, scale: string[]): Topic[] =>
  topics.filter(
    (t) =>
      (filters.course === "" || t.code === filters.course) &&
      (filters.upTo === "" || scale.indexOf(t.levels[0] ?? "") <= scale.indexOf(filters.upTo)),
  );

// A term's worth in a title: one that starts with it, a word of it, any part of it; 0 when the title lacks it.
function worth(term: string, t: Topic): number {
  if (t.t.startsWith(term)) return 100;
  if (` ${t.t}`.includes(` ${term}`)) return 70;
  if (t.t.includes(term)) return 40;
  return 0;
}

// The topics a query finds, most relevant first: those whose title holds every term, by how the title holds
// them, then the rest by the index; the index, then the cards' order, between equals.
export function find(topics: Topic[], index: Index, words: readonly string[], terms: string[]): Topic[] {
  const ranked = scores(index, words, terms);
  const found = topics.flatMap((topic) => {
    const worths = terms.map((term) => worth(term, topic));
    const title = worths.includes(0) ? 0 : worths.reduce((a, b) => a + b, 0);
    const score = ranked.get(topic.order) ?? 0;
    return title > 0 || score > 0 ? [{ topic, title, score }] : [];
  });
  return found.sort((a, b) => b.title - a.title || b.score - a.score || a.topic.order - b.topic.order).map((f) => f.topic);
}

// The text in runs, each place a term appears in bold: [run, bold]. Matching runs on the folded text; each folded
// letter remembers where it came from, so a bold run is cut from the original, its marks included ("Pretérito").
export function boldRuns(text: string, terms: readonly string[]): [string, boolean][] {
  let plain = "";
  const origin: number[] = [];
  for (let i = 0; i < text.length; i++) {
    for (const c of fold(text[i] ?? "")) {
      plain += c;
      origin.push(i);
    }
  }
  const spans: [number, number][] = [];
  for (const term of terms) {
    for (let at = plain.indexOf(term); at >= 0; at = plain.indexOf(term, at + term.length)) {
      let to = (origin[at + term.length - 1] ?? 0) + 1;
      while (to < text.length && /\p{M}/u.test(text[to] ?? "")) to++;
      spans.push([origin[at] ?? 0, to]);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  const runs: [string, boolean][] = [];
  let end = 0;
  for (const [from, to] of spans) {
    if (to <= end) continue;
    const start = Math.max(from, end);
    if (start > end) runs.push([text.slice(end, start), false]);
    runs.push([text.slice(start, to), true]);
    end = to;
  }
  if (end < text.length) runs.push([text.slice(end), false]);
  return runs;
}

// A topic as a query's results show it: the topic, the caption naming the language it opens in when that is not the
// page's (explained: "Explained in {name}", from the page's wording), and its lead with the terms in bold.
export interface Result {
  topic: Topic;
  caption: string;
  lead: [string, boolean][];
}
export const captionOf = (explained: string, topic: Topic): string =>
  topic.other === ""
    ? ""
    : explained.replace(/\{name(:lower)?\}/, (_all, lower?: string) => (lower === undefined ? topic.other : topic.other.toLowerCase()));

// A topic as a result shows it, the terms in bold in its lead (none: no bold).
export const resultOf = (topic: Topic, terms: readonly string[], explained: string): Result => ({
  topic,
  caption: captionOf(explained, topic),
  lead: boldRuns(topic.summary, terms),
});

// What a query shows, in order: its terms found, the filters applied, each topic with its caption and its lead.
export function results(
  topics: Topic[],
  index: Index,
  words: readonly string[],
  query: string,
  filters: Filters,
  scale: string[],
  explained: string,
): Result[] {
  const terms = tokens(query);
  return filtered(find(topics, index, words, terms), filters, scale).map((topic) => resultOf(topic, terms, explained));
}

// What a query that finds nothing offers: up to four distinct topics the filters allow, drawn with the random source
// (a number from 0 up to, not including, 1; Math.random on the page); fewer when fewer are allowed.
export function suggest(topics: Topic[], filters: Filters, scale: string[], random: () => number, count = 4): Topic[] {
  const pool = filtered(topics, filters, scale);
  const drawn: Topic[] = [];
  while (drawn.length < count && pool.length > 0) {
    const [topic] = pool.splice(Math.floor(random() * pool.length), 1);
    if (topic) drawn.push(topic);
  }
  return drawn;
}
