// Writes the reader's languages into a page: every course's "Explained in" line (.xl-line) and the links to the course,
// the Home's courses that none of the reader's languages explains moved under their own heading, each topic's link
// and "EN" tag, and the topic page's fallback note. The page's markup is described in client-languages.ts.
import { aroundName, fill, inLanguage, pinKey, resolveCourse, type Resolved, resolveTopic } from "./client-languages-model.ts";
import type { LanguagesText } from "./client-languages-text.ts";
import { store } from "./client-store.ts";

export interface Env {
  text: LanguagesText;
  list: string[];
}
export interface Course {
  code: string;
  explains: string[];
}

export const pinOf = (code: string): string | null => {
  const pin = store.get(pinKey(code));
  return pin === null || pin === "" ? null : pin;
};
export const named = (env: Env, code: string): string => env.text.languages.find((l) => l.code === code)?.named ?? code;
export const own = (env: Env, code: string): string => env.text.languages.find((l) => l.code === code)?.own ?? code;
export const resolved = (env: Env, course: Course): Resolved => resolveCourse(course.explains, env.list, pinOf(course.code));

const words = (s: string): string[] => s.split(" ").filter((w) => w !== "");
export const courseOfLine = (line: HTMLElement): Course => ({
  code: line.dataset["course"] ?? "",
  explains: words(line.dataset["explains"] ?? ""),
});
// The course a page shows: the one its line names, else the one its topic's header names.
export function courseOf(): Course | null {
  const line = document.querySelector<HTMLElement>(".xl-line[data-course]");
  if (line !== null) return courseOfLine(line);
  const header = document.querySelector<HTMLElement>("[data-course-explains]");
  return header === null ? null : { code: header.dataset["course"] ?? "", explains: words(header.dataset["courseExplains"] ?? "") };
}
// The languages the topic of a topic page has: its header's.
export const topicHas = (): string[] | null => {
  const header = document.querySelector<HTMLElement>("[data-topic-explains]:has([data-xl-note])");
  return header === null ? null : words(header.dataset["topicExplains"] ?? "");
};

const span = (cls: string, text: string): HTMLElement => {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = text;
  return s;
};
// A template's text around the {language} placeholder, the language in bold.
function withName(template: string, name: string): Node[] {
  const [before, shown, after] = aroundName(template, name);
  const bold = document.createElement("b");
  bold.textContent = shown;
  return [document.createTextNode(before), bold, document.createTextNode(after)];
}

function writeLine(env: Env, line: HTMLElement, r: Resolved, course: Course): void {
  const w = env.text.words;
  let text = line.querySelector<HTMLElement>(".xl-text");
  if (text === null) {
    text = span("xl-text", "");
    line.replaceChildren(text);
  }
  line.querySelector(".xl-fb")?.remove();
  if (r.via === "none") {
    text.replaceChildren(`${w["noneOfYourLanguages"] ?? ""} · `, span("xl-source", own(env, course.explains[0] ?? "")));
    return;
  }
  text.replaceChildren(...withName(w["courseExplainedIn"] ?? "", named(env, r.lang)));
  if (r.via !== "fallback") return;
  const back = span("xl-fb", "↩");
  back.setAttribute("role", "img");
  back.setAttribute("aria-label", w["fallbackLanguage"] ?? "");
  back.title = w["fallbackLanguage"] ?? "";
  text.after(back);
}

// The Home's cards sit in the grid, in order; those that no language of the reader's explains sit in the section under
// the grid.
function place(cards: Map<HTMLElement, boolean>): void {
  const other = document.querySelector<HTMLElement>("[data-xl-other]");
  const box = other?.querySelector<HTMLElement>("[data-xl-other-cards]") ?? null;
  const grid = document.getElementById("hm-cards");
  if (other === null || box === null || grid === null) return;
  const order = [...cards.keys()].sort((a, b) => Number(a.dataset["xlOrder"]) - Number(b.dataset["xlOrder"]));
  grid.append(...order.filter((c) => cards.get(c) !== true));
  box.append(...order.filter((c) => cards.get(c) === true));
  other.hidden = box.children.length === 0;
}

function lines(env: Env): void {
  const cards = new Map<HTMLElement, boolean>();
  document.querySelectorAll<HTMLElement>(".xl-line[data-course]").forEach((line, i) => {
    const course = courseOfLine(line);
    const r = resolved(env, course);
    writeLine(env, line, r, course);
    const card = line.closest<HTMLElement>("[data-xl-card]");
    if (card !== null) {
      card.dataset["xlOrder"] ??= String(i);
      card.classList.toggle("xl-dim", r.via === "none");
      cards.set(card, r.via === "none");
    }
    document.querySelectorAll<HTMLAnchorElement>(`a[data-course="${course.code}"]`).forEach((a) => {
      a.setAttribute("href", inLanguage(a.getAttribute("href") ?? "", r.lang));
    });
  });
  place(cards);
}

// A topic's row on a course page and its header on the topic page.
function topics(env: Env): void {
  const course = courseOf();
  if (course === null) return;
  const r = resolved(env, course);
  const pin = pinOf(course.code);
  const page = document.documentElement.lang;
  document.querySelectorAll<HTMLElement>("[data-topic-explains]").forEach((el) => {
    const has = words(el.dataset["topicExplains"] ?? "");
    const note = el.querySelector<HTMLElement>("[data-xl-note]");
    // A row opens the topic in the first language of the reader's that it has; the header shows the topic as written.
    const shown = note === null ? (resolveTopic(has, env.list, pin) ?? page) : page;
    const differs = note === null ? shown !== r.lang : !has.includes(r.lang);
    const link = el instanceof HTMLAnchorElement ? el : el.matches("li") ? el.querySelector("a[href]") : null;
    link?.setAttribute("href", inLanguage(link.getAttribute("href") ?? "", shown));
    el.querySelectorAll<HTMLElement>("[data-xl-tag]").forEach((tag) => {
      tag.textContent = shown.toUpperCase();
      tag.hidden = !differs;
    });
    if (note === null) return;
    note.hidden = !differs;
    note.replaceChildren(...(differs ? fallbackNote(env, r.lang, shown) : []));
  });
}

function fallbackNote(env: Env, wanted: string, shown: string): Node[] {
  const w = env.text.words;
  const icon = span("xl-fb", "↩");
  icon.setAttribute("aria-hidden", "true");
  const change = document.createElement("button");
  change.type = "button";
  change.className = "xl-change";
  change.dataset["xlOpen"] = "";
  change.textContent = w["changeLanguage"] ?? "";
  const sentence = fill(w["topicFallback"] ?? "", { language: named(env, wanted), fallback: named(env, shown) });
  const p = document.createElement("p");
  p.append(`${sentence} `, change);
  return [icon, p];
}

export function writeLanguages(env: Env): void {
  lines(env);
  topics(env);
}
