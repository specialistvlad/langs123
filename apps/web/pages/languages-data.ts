// What the client reads to write the reader's languages into any page, in one explanation language, at
// /{explain}/languages.json (client-languages-text.ts): the languages in site order with their own names and their
// names in this language, each language's pages, each course's flag and name, and the wording of the lines, the
// sheet and the fallback note with their placeholders as the interface file holds them.
import { type Explain, INTERFACE, localize, SITE, type TextKey } from "../../../scripts/lib.ts";
import { type Context, EXPLAINS, explainsOf } from "../context.ts";
import { homeUrl, languagesFirstUrl, languagesUrl } from "../urls.ts";

const WORDS = [
  "courseExplainedIn",
  "fallbackLanguage",
  "noneOfYourLanguages",
  "explanationLanguage",
  "followMyLanguages",
  "nowLanguage",
  "nowLanguageMissing",
  "courseLabel",
  "notInCourse",
  "languagesIKnow",
  "courseOtherLanguages",
  "editLanguagesIKnow",
  "topicFallback",
  "changeLanguage",
  "close",
] as const satisfies readonly TextKey[];

export interface LanguagesData {
  // The language of the data.
  lang: Explain;
  // Each enabled explanation language: its own name, its name in this language, its Home, its languages page and
  // that page's first-run form.
  languages: { code: Explain; own: string; named: string; home: string; page: string; firstRun: string }[];
  // Each course: its flag and its name in this language, by the code of the language it teaches.
  courses: Record<string, { flag: string; name: string }>;
  words: Record<(typeof WORDS)[number], string>;
}

// A string of the interface file as it is, placeholders and all.
const raw = (key: TextKey, explain: Explain): string => INTERFACE.text[key][explain];

export function languagesData(ctx: Context, explain: Explain): LanguagesData {
  return {
    lang: explain,
    languages: SITE.explain
      .filter((l) => EXPLAINS.includes(l.code))
      .map((l) => ({
        code: l.code,
        own: localize(l.name, l.code),
        named: localize(l.name, explain),
        home: homeUrl(l.code),
        page: languagesUrl(l.code),
        firstRun: languagesFirstUrl(l.code),
      })),
    courses: Object.fromEntries(
      ctx.languages.filter((l) => explainsOf(l).length > 0).map((l) => [l.code, { flag: l.flag, name: localize(l.name, explain) }]),
    ),
    words: Object.fromEntries(WORDS.map((key) => [key, raw(key, explain)])) as LanguagesData["words"],
  };
}
