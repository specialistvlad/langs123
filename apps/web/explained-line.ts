// The "Explained in" line of a course, wherever its explanation language shows (the Home's course cards, a course
// page's subtitle): a button whose .xl-text holds the server's default, the language the page is read in when the
// course is explained in it, else the course's first. The Languages page's client (client-languages.ts) rewrites it
// from the reader's languages and opens the course's "Explanation language" sheet on a tap; xl-line is styled in
// languages-lines.css.
import { type CurriculumLanguage, type Explain, localize, say, SITE } from "../../scripts/lib.ts";
import { explainsOf } from "./context.ts";
import { escapeHtml } from "./html.ts";

// Each explanation language's name in every other.
const NAMES = new Map(SITE.explain.map((x) => [x.code, x.name]));
const MARK = "\u0000";

// An explanation language's name in the language `home` is read in.
export const explainNameIn = (code: Explain, home: Explain): string => localize(NAMES.get(code) ?? {}, home);

// The language a course opens in on a page read in `home`: the page's own when the course has it, else the course's first.
export function defaultExplain(lang: CurriculumLanguage, home: Explain): Explain {
  const explains = explainsOf(lang);
  return explains.includes(home) ? home : (explains[0] ?? home);
}

// "Explained in: <b>English</b>": the name in the page's language bold, written as the template writes it (a language
// that lowercases it, lowercased).
export function explainedText(lang: CurriculumLanguage, home: Explain): string {
  const name = explainNameIn(defaultExplain(lang, home), home);
  const [before = "", shown = "", after = ""] = say("courseExplainedIn", home, { language: `${MARK}${name}${MARK}` }).split(MARK);
  return `${escapeHtml(before)}<b>${escapeHtml(shown)}</b>${escapeHtml(after)}`;
}

export const explainedLine = (lang: CurriculumLanguage, home: Explain, cls = ""): string =>
  `<button type="button" class="xl-line${cls === "" ? "" : ` ${cls}`}" data-course="${lang.code}" data-explains="${explainsOf(lang).join(" ")}" aria-haspopup="dialog"><span class="xl-text">${explainedText(lang, home)}</span></button>`;
