// The Home's search data, one file per explanation language, search/<language>.json: every written topic of
// every course in the cards' order, each as [title, address, its levels ("A1 A2 B1"), lead, section, flag,
// course, the name and code of the language it opens in when the course is not written for this language (else
// "" and this one), the course's code, per level what the topic holds there for the level popover, and the
// topic's id], after the scale of levels the marks draw, and the parts of the index; then the index of every word
// of those topics in the language each is read in (search-index.ts), one file per first letter,
// search/<language>/<part>.json. The Home's search (client-home.ts) ranks the topics whose title holds the query
// first, then the rest by the index.
import { topicTexts, topicTitle } from "../../../scripts/content.ts";
import { type Explain, explainName, LEVELS, localize, type Text, type Topic } from "../../../scripts/lib.ts";
import { topicLevels } from "../../../scripts/levels.ts";
import { foldText, plainText, reading, type TextOutput, textIn } from "../../../scripts/text.ts";
import { type Context, explainsOf } from "../context.ts";
import { STRONG } from "../html.ts";
import { indexOf, partsOf, tokens, type TopicWords } from "../search-index.ts";
import { topicEntryOf } from "../level-popover.ts";
import { topicUrl } from "../urls.ts";

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

export function homeSearch(ctx: Context, home: Explain): void {
  const words: TopicWords[] = [];
  const topics = ctx.languages.flatMap((lang) => {
    const explains = explainsOf(lang);
    const e = explains.includes(home) ? home : (explains[0] ?? home);
    const other = e === home ? ["", e] : [explainName(e), e];
    return ctx.refs.flatMap((ref) => {
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
  const parts = partsOf(indexOf(words));
  ctx.file(homeSearchUrl(home), JSON.stringify({ levels: LEVELS, topics, parts: Object.keys(parts) }));
  for (const [part, index] of Object.entries(parts)) ctx.file(homeSearchPartUrl(home, part), JSON.stringify(index));
}
