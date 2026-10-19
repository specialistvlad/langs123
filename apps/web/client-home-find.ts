// The Home's search over every course (search/<language>.json, pages/home-search.ts): topics that hold every
// term of the query, most relevant first, and the text with each place a term appears in bold.

export interface Topic {
  title: string;
  url: string;
  from: string;
  to: string;
  summary: string;
  flag: string;
  course: string;
  other: string;
  otherLang: string;
  order: number;
  t: string;
  s: string;
  d: string;
}
type Row = [string, string, string, string, string, string, string, string, string, string];

// Words compare without case, accents and marks: "Preterito" finds "Pretérito".
export const fold = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export const tokens = (s: string): string[] =>
  fold(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

export const topicsOf = (data: { topics: Row[] }): Topic[] =>
  data.topics.map(([title, url, from, to, summary, section, flag, course, other, otherLang], order) => ({
    title,
    url,
    from,
    to,
    summary,
    flag,
    course,
    other,
    otherLang,
    order,
    t: fold(title),
    s: fold(section),
    d: fold(summary),
  }));

// A term's worth in a topic: a title that starts with it, a word of the title, any part of it, then the
// section, then the summary; 0 when the topic lacks it.
function worth(term: string, t: Topic): number {
  if (t.t.startsWith(term)) return 100;
  if (` ${t.t}`.includes(` ${term}`)) return 70;
  if (t.t.includes(term)) return 40;
  if (` ${t.s}`.includes(` ${term}`)) return 20;
  if (` ${t.d}`.includes(` ${term}`)) return 15;
  if (t.d.includes(term)) return 8;
  return 0;
}

// Every topic that holds all the terms, most relevant first, the cards' order between equals.
export function find(topics: Topic[], terms: string[]): Topic[] {
  const found: { topic: Topic; score: number }[] = [];
  for (const topic of topics) {
    let score = 0;
    for (const term of terms) {
      const w = worth(term, topic);
      if (w === 0) {
        score = 0;
        break;
      }
      score += w;
    }
    if (score > 0) found.push({ topic, score });
  }
  return found.sort((a, b) => b.score - a.score || a.topic.order - b.topic.order).map((f) => f.topic);
}

export const el = (tag: string, className = "", text?: string): HTMLElement => {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// The text with each place a term appears in bold. Matching runs on the folded text; each folded letter
// remembers where it came from, so the bold run is cut from the original, marks included.
export function marked(text: string, terms: string[]): DocumentFragment {
  const out = document.createDocumentFragment();
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
  let end = 0;
  for (const [from, to] of spans) {
    if (to <= end) continue;
    const start = Math.max(from, end);
    if (start > end) out.append(text.slice(end, start));
    out.append(el("b", "", text.slice(start, to)));
    end = to;
  }
  if (end < text.length) out.append(text.slice(end));
  return out;
}
