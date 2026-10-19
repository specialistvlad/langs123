// The Home's search data, one file per explanation language, search/<language>.json: every written topic of
// every course in the cards' order, each as [title, address, lowest level, highest level, lead, section, flag,
// course, and, when the course is not written for this language and opens in its first one, that language's
// name and code]. The Home's search (client-home.ts) matches the title first, then the section, then the lead.
import { topicTitle } from "../../../scripts/content.ts";
import { type Explain, explainName, localize } from "../../../scripts/lib.ts";
import { refRange } from "../../../scripts/levels.ts";
import { plainText, reading, textIn } from "../../../scripts/text.ts";
import { type Context, explainsOf } from "../context.ts";
import { topicUrl } from "../urls.ts";

export const homeSearchUrl = (explain: Explain): string => `/search/${explain}.json`;

export function homeSearch(ctx: Context, home: Explain): void {
  const topics = ctx.languages.flatMap((lang) => {
    const explains = explainsOf(lang);
    const e = explains.includes(home) ? home : (explains[0] ?? home);
    const other = e === home ? ["", e] : [explainName(e), e];
    return ctx.refs.flatMap((ref) => {
      const range = ref.lang === lang.code && ref.topic !== null ? refRange(ref, e) : null;
      if (ref.topic === null || range === null) return [];
      const lead = plainText(textIn(ref.topic.summary.lead, e), reading(e, false));
      const section = localize(ref.section.title, e);
      return [
        [topicTitle(ref, e), topicUrl(e, lang, ref), range.from, range.to, lead, section, lang.flag, localize(lang.name, home), ...other],
      ];
    });
  });
  ctx.file(homeSearchUrl(home), JSON.stringify({ topics }));
}
