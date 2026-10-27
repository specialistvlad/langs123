// Languages I know, on every page. The reader's ranked list (ln-langs) starts from the browser's preferred languages; a
// first visit goes once to the first-run form of the languages page and back to where the reader was. The languages
// page itself is client-languages-page.ts. Any other page's markup, which client-languages-lines.ts writes into:
//   .xl-line[data-course][data-explains]   a course's button, its explanation languages space-separated, source first;
//                                          its content is rewritten (.xl-text, then the fallback mark); opens the sheet
//   a[data-course]                         a link to the course, /{explain}/…; it follows the course's language
//   [data-xl-card]                         a Home card holding the line; with none of the reader's languages it moves to
//                                          [data-xl-other-cards] of the hidden section [data-xl-other], after #hm-cards
//   [data-topic-explains]                  a topic's row (an <a>, or an <li> whose first link opens the topic) or header:
//                                          the languages the topic has; holds
//                                          [data-xl-tag] and, on the header, [data-xl-note] and data-course,
//                                          data-course-explains of its course
//   [data-xl-open]                         opens the sheet of the page's course (a course's 文A)
import { type Env, courseOf, courseOfLine, pinOf, resolved, topicHas, writeLanguages } from "./client-languages-lines.ts";
import { fromBrowser, inLanguage, LANGS_KEY, resolveTopic } from "./client-languages-model.ts";
import { languagesPage } from "./client-languages-page.ts";
import { openSheet } from "./client-languages-sheet.ts";
import { codesOf, type LanguagesText, loadText, readerList } from "./client-languages-text.ts";
import { store } from "./client-store.ts";

const root = document.documentElement;
const AUTOMATED = /bot|crawl|spider|slurp|lighthouse/i;

// A first visit: the list is kept and the reader goes to the first-run page; with storage off, or in an automated
// browser, the pages simply follow the browser's languages.
function firstVisit(text: LanguagesText): boolean {
  if (store.get(LANGS_KEY) !== null || navigator.webdriver || AUTOMATED.test(navigator.userAgent) || root.dataset["page"] === "404") {
    return false;
  }
  const list = fromBrowser(navigator.languages, codesOf(text), root.lang);
  store.set(LANGS_KEY, list.join(" "));
  const target = text.languages.find((l) => l.code === list[0])?.firstRun;
  if (store.get(LANGS_KEY) === null || target === undefined) return false;
  const here = `${location.pathname}${location.search}${location.hash}`;
  location.replace(root.dataset["page"] === "home" ? target : `${target}?back=${encodeURIComponent(here)}`);
  return true;
}

// A choice on a course or topic page leads to the page in the language it now resolves to.
function follow(env: Env): void {
  const kind = root.dataset["page"];
  const course = courseOf();
  const has = topicHas();
  if (course === null || (kind !== "track" && kind !== "topic")) return;
  const r = resolved(env, course);
  const to = kind === "topic" ? resolveTopic(has ?? [], env.list, pinOf(course.code)) : r.lang;
  if (to !== null && to !== root.lang && r.via !== "none") {
    location.assign(`${inLanguage(location.pathname, to)}${location.search}${location.hash}`);
  }
}

export function languages(): void {
  const main = document.querySelector<HTMLElement>(".ml-page");
  if (main !== null) {
    languagesPage(main);
    return;
  }
  const used = document.querySelector(".xl-line, [data-topic-explains]") !== null;
  if (!used && store.get(LANGS_KEY) !== null) return;
  void loadText(root.lang).then((text) => {
    if (text === null || firstVisit(text)) return;
    const env: Env = { text, list: readerList(codesOf(text), root.lang) };
    writeLanguages(env);
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".xl-line, [data-xl-open]") : null;
      const course = target === null ? null : target.matches(".xl-line") ? courseOfLine(target) : courseOf();
      if (course === null) return;
      event.preventDefault();
      // A click from Enter or Space counts no presses.
      openSheet(env, course, event.detail === 0, () => {
        writeLanguages(env);
        follow(env);
      });
    });
  });
}
