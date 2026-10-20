// The Home's search data, one file per explanation language, search/<language>.json: every written topic of
// every course in the cards' order, each as [title, address, its levels ("A1 A2 B1"), lead, section, flag,
// course, and, when the course is not written for this language and opens in its first one, that language's
// name and code], after the scale of levels the marks draw. The Home's search (client-home.ts) matches the title first, then the section, then the lead.
import { topicTitle } from "../../../scripts/content.ts";
import { type Explain, explainName, LEVELS, localize } from "../../../scripts/lib.ts";
import { topicLevels } from "../../../scripts/levels.ts";
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
      const levels = ref.lang === lang.code && ref.topic !== null ? topicLevels(ref.topic, e) : [];
      if (ref.topic === null || levels.length === 0) return [];
      const lead = plainText(textIn(ref.topic.summary.lead, e), reading(e, false));
      const section = localize(ref.section.title, e);
      return [
        [topicTitle(ref, e), topicUrl(e, lang, ref), levels.join(" "), lead, section, lang.flag, localize(lang.name, home), ...other],
      ];
    });
  });
  ctx.file(homeSearchUrl(home), JSON.stringify({ levels: LEVELS, topics }));
}
