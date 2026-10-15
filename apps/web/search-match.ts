// The top bar's search: what a track's search data holds, and how a query picks and orders its rows.
// Matching sets accents and case aside (tú finds tu), and every word of the query must appear in the
// title. A title that starts with the query ranks first, then one with a word that starts with it,
// then one that holds it elsewhere; topics and the sections inside them form two groups.

// A topic, or a section of a topic's guide, with where it leads and its levels.
export interface SearchEntry {
  kind: "topic" | "section";
  title: string;
  // A topic's section of the track; a section's topic.
  context: string;
  url: string;
  from: string;
  to: string;
  // The level badge, as the pages draw it.
  badge: string;
}

// One track's search data: its name and its rows, topics first in the track's order.
export interface SearchData {
  track: string;
  entries: SearchEntry[];
}

export interface Hit {
  entry: SearchEntry;
  track: string;
  score: number;
  // Above the level the filter shows: listed after the others, dimmed.
  above: boolean;
  // Character ranges of the title that match, as [start, end).
  marks: [number, number][];
}

export const fold = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// The folded title, with the index in the title of each folded character.
function folded(title: string): { text: string; at: number[] } {
  let text = "";
  const at: number[] = [];
  let index = 0;
  for (const ch of title) {
    for (const f of fold(ch)) {
      text += f;
      at.push(index);
    }
    index += ch.length;
  }
  return { text, at };
}

const isWordStart = (text: string, i: number): boolean => i === 0 || !/[\p{L}\p{N}]/u.test(text[i - 1] ?? "");

// The score of a title for a query, with its matching ranges; null when a word of the query is missing.
export function match(title: string, query: string): { score: number; marks: [number, number][] } | null {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const { text, at } = folded(title);
  const marks: [number, number][] = [];
  let score = 0;
  for (const [n, word] of words.entries()) {
    // The first place the word starts a word of the title, else the first place it appears.
    let i = -1;
    for (let from = text.indexOf(word); from >= 0; from = text.indexOf(word, from + 1)) {
      if (i < 0) i = from;
      if (isWordStart(text, from)) {
        i = from;
        break;
      }
    }
    if (i < 0) return null;
    const start = at[i] ?? 0;
    const end = (at[i + word.length - 1] ?? start) + 1;
    marks.push([start, end]);
    if (n === 0) score = i === 0 ? 3 : isWordStart(text, i) ? 2 : 1;
  }
  return { score, marks: marks.sort((a, b) => a[0] - b[0]) };
}

// The rows of every track for a query, in two groups, each led by the rows the level filter shows.
export function search(
  data: SearchData[],
  query: string,
  level: string,
  levels: readonly string[],
  limit = 8,
): { topics: Hit[]; sections: Hit[] } {
  const top = levels.indexOf(level);
  const hits: Hit[] = [];
  for (const d of data) {
    for (const entry of d.entries) {
      const m = match(entry.title, query);
      if (m === null) continue;
      const above = top >= 0 && levels.indexOf(entry.from) > top;
      hits.push({ entry, track: d.track, score: m.score, above, marks: m.marks });
    }
  }
  const order = (a: Hit, b: Hit): number => Number(a.above) - Number(b.above) || b.score - a.score;
  const group = (kind: SearchEntry["kind"]): Hit[] =>
    hits
      .filter((h) => h.entry.kind === kind)
      .sort(order)
      .slice(0, limit);
  return { topics: group("topic"), sections: group("section") };
}

// A title with its matching ranges in <mark>, every piece escaped.
export function highlight(title: string, marks: [number, number][], escape: (s: string) => string): string {
  let out = "";
  let at = 0;
  for (const [start, end] of marks) {
    if (start < at) continue;
    out += escape(title.slice(at, start)) + `<mark>${escape(title.slice(start, end))}</mark>`;
    at = end;
  }
  return out + escape(title.slice(at));
}
