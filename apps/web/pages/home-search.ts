// The Home's search data, one file per explanation language, search/<language>.json: every written topic of
// every course in the cards' order, each as [title, address, its levels ("A1 A2 B1"), lead, section, flag,
// course, the name (in this language) and code of the language it opens in when the course is not written for this
// language (else "" and this one), the course's code, per level what the topic holds there for the level popover, and the
// topic's id], after the scale of levels the marks draw, and the parts of the index; then the index of every word
// of those topics in the language each is read in (search-index.ts), one file per first letter,
// search/<language>/<part>.json. The Home's search (client-home.ts) ranks the topics whose title holds the query
// first, then the rest by the index.
import { join } from "node:path";
import { topicTexts, topicTitle } from "../../../scripts/content.ts";
import {
  type CurriculumLanguage,
  type Explain,
  LEVELS,
  loadCurriculum,
  loadTopics,
  localize,
  SITE,
  type Text,
  type Topic,
  type TopicRef,
} from "../../../scripts/lib.ts";
import { topicLevels } from "../../../scripts/levels.ts";
import { foldText, plainText, reading, type TextOutput, textIn } from "../../../scripts/text.ts";
import { type Context, explainsOf } from "../context.ts";
import { STRONG } from "../html.ts";
import { type Index, indexOf, partsOf, tokens, type TopicWords } from "../search-index.ts";
import { topicEntryOf } from "../level-popover.ts";
import { topicUrl } from "../urls.ts";

// Each explanation language's name in every other.
const NAMES: Record<string, Partial<Record<Explain, string>>> = Object.fromEntries(SITE.explain.map((x) => [x.code, x.name]));

export const homeSearchUrl = (explain: Explain): string => `/search/${explain}.json`;
export const homeSearchPartUrl = (explain: Explain, part: string): string => `/search/${explain}/${part}.json`;

// A text as a reader sees it, and the part of it shown in bold: the forms a rule is about.
interface Read {
  all: string;
  strong: string;
}
const READ: TextOutput<Read> = {
  text: (s) => ({ all: s, strong: "" }),
  join: (parts) => ({ all: parts.map((p) => p.all).join(""), strong: parts.map((p) => p.strong).join(" ") }),
  mark: (name, inner) => (STRONG.has(name) ? { all: inner.all, strong: inner.all } : inner),
};
const read = (t: Text, explain: Explain, plain: boolean): Read => foldText(t, READ, reading(explain, plain));

// A topic's words in an explanation language: the title, the lead with the section's name, the bold forms, and
// every other text of the lesson (topicTexts).
function topicWords(topic: Topic, title: string, section: string, explain: Explain): TopicWords {
  const lead = read(textIn(topic.summary.lead, explain), explain, false);
  const strong = [lead.strong];
  const body: string[] = [];
  for (const t of topicTexts(topic, [explain])) {
    if (t.path === "title" || t.path === "summary.lead" || !t.langs.includes(explain)) continue;
    const r = read(t.text, explain, t.plain);
    body.push(r.all);
    strong.push(r.strong);
  }
  return {
    title: tokens(title),
    lead: tokens(`${lead.all} ${section}`),
    strong: tokens(strong.join(" ")),
    body: tokens(body.join(" ")),
  };
}

// The search data of an explanation language: every written topic of the languages given, its row, and the index of
// their words. Another app reads the same through api.ts (searchData).
export function searchOf(languages: CurriculumLanguage[], refs: TopicRef[], home: Explain): SearchFile {
  const words: TopicWords[] = [];
  const topics = languages.flatMap((lang) => {
    const explains = explainsOf(lang);
    const e = explains.includes(home) ? home : (explains[0] ?? home);
    // The language a topic opens in, when it is not this one, named in this one: 英語 on the Japanese Home.
    const other = e === home ? ["", e] : [localize(NAMES[e] ?? {}, home), e];
    return refs.flatMap((ref) => {
      const levels = ref.lang === lang.code && ref.topic !== null ? topicLevels(ref.topic, e) : [];
      if (ref.topic === null || levels.length === 0) return [];
      const title = topicTitle(ref, e);
      const lead = plainText(textIn(ref.topic.summary.lead, e), reading(e, false));
      const section = localize(ref.section.title, e);
      words.push(topicWords(ref.topic, title, section, e));
      return [
        [
          title,
          topicUrl(e, lang, ref),
          levels.join(" "),
          lead,
          section,
          lang.flag,
          localize(lang.name, home),
          ...other,
          lang.code,
          topicEntryOf(ref, e).l,
          ref.id,
        ],
      ];
    });
  });
  return { levels: [...LEVELS], topics, index: indexOf(words) };
}

// The cases the search's tests hold (search-cases.json): a fixture, its index, and the words and topics each query
// finds, for another app's tests to hold as well.
export const SEARCH_CASES = join(import.meta.dir, "..", "search-cases.json");

export interface SearchFile {
  levels: string[];
  topics: unknown[][];
  index: Index;
}

export function homeSearch(ctx: Context, home: Explain): void {
  const { levels, topics, index } = searchOf(ctx.languages, ctx.refs, home);
  const parts = partsOf(index);
  ctx.file(homeSearchUrl(home), JSON.stringify({ levels, topics, parts: Object.keys(parts) }));
  for (const [part, words] of Object.entries(parts)) ctx.file(homeSearchPartUrl(home, part), JSON.stringify(words));
}

// The search data of an explanation language over the whole library, as the website builds it: the enabled
// languages being learned, each topic read in this language or, for a course not written for it, in its first.
export async function searchData(explain: Explain): Promise<SearchFile> {
  const curriculum = await loadCurriculum();
  const refs = await loadTopics(curriculum);
  return searchOf(
    curriculum.languages.filter((l) => l.enabled && refs.some((r) => r.lang === l.code)),
    refs,
    explain,
  );
}
