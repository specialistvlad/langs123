// The Explanation language sheet of a course: Follow my languages, the reader's languages (those the course lacks
// dimmed, "Not in this course") and the course's other languages; choosing one pins it for the course, Follow my
// languages lifts the pin. Its last row, on its own, leads to the languages page. A bottom sheet on a phone, a centred
// one on larger screens (languages-sheet.css).
import { type Course, type Env, named, own, pinOf, resolved } from "./client-languages-lines.ts";
import { fill, pinKey, type Resolved } from "./client-languages-model.ts";
import { store } from "./client-store.ts";

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text = ""): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  e.className = cls;
  e.textContent = text;
  return e;
};
const TICK =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const CLOSE =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

interface Row {
  pick: string;
  title: string;
  sub: string;
  rank?: number;
  // The choice is kept for the course; tick marks what the course is read in now.
  on: boolean;
  tick?: boolean;
  off?: boolean;
}

function row(r: Row): HTMLButtonElement {
  const b = el("button", "xl-row");
  b.type = "button";
  b.dataset["pick"] = r.pick;
  b.setAttribute("aria-pressed", String(r.on));
  b.disabled = r.off === true;
  if (r.rank !== undefined) b.append(el("span", `ml-rank${r.rank === 1 ? " ml-1" : ""}`, String(r.rank)));
  const name = el("span", "ml-name");
  name.append(el("span", "", r.title), el("small", "", r.sub));
  b.append(name);
  if (r.tick ?? r.on) {
    const tick = el("span", "xl-tick");
    tick.innerHTML = TICK;
    b.append(tick);
  }
  return b;
}

const card = (rows: HTMLElement[]): HTMLElement => {
  const c = el("div", "cr-card xl-card");
  c.append(...rows);
  return c;
};
const group = (label: string, rows: HTMLElement[]): Node[] => (rows.length === 0 ? [] : [el("h3", "ml-label", label), card(rows)]);

// What Follow my languages gives now; when the course lacks the reader's first language it says so.
function followNote(env: Env, course: Course, now: Resolved): string {
  const w = env.text.words;
  const first = env.list[0] ?? "";
  const missing = !course.explains.includes(first) && now.via !== "none";
  const values = { language: named(env, now.lang), first: named(env, first) };
  return fill((missing ? w["nowLanguageMissing"] : w["nowLanguage"]) ?? "", values);
}

// Opens the sheet; onPick runs after a choice is kept.
export function openSheet(env: Env, course: Course, onPick: () => void): void {
  const w = env.text.words;
  const pin = pinOf(course.code);
  const now = resolved(env, course);
  const current = now.via === "none" ? null : now.lang;
  const dialog = el("dialog", "xl-sheet");
  dialog.setAttribute("aria-label", w["explanationLanguage"] ?? "");
  const close = el("button", "xl-close glass");
  close.type = "button";
  close.setAttribute("aria-label", w["close"] ?? "");
  close.innerHTML = CLOSE;
  const head = el("div", "xl-head");
  head.append(el("span", "xl-gap"), el("h2", "", w["explanationLanguage"] ?? ""), close);
  const info = env.text.courses[course.code];
  const follow = row({
    pick: "",
    title: w["followMyLanguages"] ?? "",
    sub: followNote(env, course, now),
    on: pin === null,
  });
  const mine = env.list.map((code, i) =>
    row({
      pick: code,
      title: own(env, code),
      sub: course.explains.includes(code) ? named(env, code) : (w["notInCourse"] ?? ""),
      rank: i + 1,
      on: pin === code,
      tick: current === code,
      off: !course.explains.includes(code),
    }),
  );
  const rest = course.explains
    .filter((code) => !env.list.includes(code))
    .map((code) => row({ pick: code, title: own(env, code), sub: named(env, code), on: pin === code, tick: current === code }));
  const edit = el("a", "xl-row xl-edit", w["editLanguagesIKnow"] ?? "");
  edit.href = env.text.languages.find((l) => l.code === env.text.lang)?.page ?? "";
  dialog.append(
    el("span", "xl-grab"),
    head,
    el("p", "xl-course", info === undefined ? "" : `${info.flag} ${fill(w["courseLabel"] ?? "", { course: info.name })}`),
    card([follow]),
    ...group(w["languagesIKnow"] ?? "", mine),
    ...group(w["courseOtherLanguages"] ?? "", rest),
    card([edit]),
  );
  dialog.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const pick = target?.closest<HTMLElement>("[data-pick]");
    if (pick !== null && pick !== undefined) {
      store.set(pinKey(course.code), pick.dataset["pick"] ?? "");
      dialog.close();
      onPick();
    } else if (target === dialog || target?.closest(".xl-close")) dialog.close();
  });
  dialog.addEventListener("close", () => {
    dialog.remove();
  });
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
}
