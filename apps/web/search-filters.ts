// The filters of the Home's search, a row of chips under the field (client-search-filters.ts): the course, the
// level (the site's own level choice, data-set-level), Read in (the language the Home is read in) and, once a course
// with varieties is chosen, its variety (the site's variety choice, data-set-variety). Each chip opens a menu of its
// choices; a chosen course or level fills the chip with the accent and a tap on it clears the choice. A chosen course
// shows its flag with its name; the variety chip names the variety in force and its menu ticks it.
import { type CurriculumLanguage, type Explain, LEVEL_INFO, levelName, localize, say } from "../../scripts/lib.ts";
import { varietyName } from "../../scripts/text.ts";
import type { Choice } from "./context.ts";
import { glyph, LANGUAGES } from "./glyphs.ts";
import { escapeHtml } from "./html.ts";
import { readItems } from "./read-menu.ts";
import { item } from "./track-parts.ts";
import type { Ui } from "./ui.ts";

export const CHEVRON_DOWN = glyph('<path d="M6 9l6 6 6-6"/>', 14, 2.4, ' class="hm-fchip-open"');
export const REMOVE = glyph('<path d="M7 7l10 10M17 7L7 17"/>', 14, 2.4, ' class="hm-fchip-clear"');

const chip = (target: string, label: string, attrs = ""): string =>
  `<button type="button" class="hm-fchip" popovertarget="${target}" data-target="${target}" aria-haspopup="menu"${attrs}><span class="hm-fchip-l">${label}</span>${CHEVRON_DOWN}${REMOVE}</button>`;
const menu = (id: string, label: string, items: string, more = ""): string =>
  `<div class="ix-menu hm-fmenu${more}" id="${id}" popover role="menu" aria-label="${escapeHtml(label)}">${items}</div>`;

// `start` is the course the chip starts on ("" for all courses: the Home's); a course index starts on its own.
export function searchFilters(t: Ui, home: Explain, languages: CurriculumLanguage[], read: Choice[], start = ""): string {
  const all = say("searchAllCourses", home);
  const upTo = say("searchUpTo", home);
  const courses = languages.map((l) => ({
    code: l.code,
    name: localize(l.name, home),
    label: `${l.flag} ${localize(l.name, home)}`,
    varieties: l.varieties ?? [],
  }));
  const top = LEVEL_INFO.at(-1)?.code ?? "";
  const current = read.find((c) => c.on)?.label ?? "";
  const first = courses.find((c) => c.code === start);
  const course = chip("hm-f-course", escapeHtml(first?.label ?? all), ` data-filter="course" data-all-label="${escapeHtml(all)}"`);
  const level = chip(
    "hm-f-level",
    escapeHtml(t.allLevels),
    ` data-filter="level" data-all-label="${escapeHtml(t.allLevels)}" data-up-to="${escapeHtml(upTo)}"`,
  );
  const readIn = chip("hm-f-read", `${LANGUAGES}${escapeHtml(current)}`);
  // "Variety: UK", the label meeting its value as each language writes it ("Variété : Royaume-Uni"); the page names the
  // value it keeps for the course.
  const [before = "", after = ""] = say("labelled", home, { label: t.variety }).split("{value}");
  const varieties = courses
    .filter((c) => c.varieties.length > 0)
    .map((c) =>
      chip(
        `hm-f-variety-${c.code}`,
        `${escapeHtml(before)}<span data-variety-of="${c.code}">${escapeHtml(varietyName(c.varieties[0] ?? "en-GB", home))}</span>${escapeHtml(after)}`,
        ` data-variety-course="${c.code}" hidden`,
      ),
    );
  const menus = [
    menu(
      "hm-f-course",
      all,
      [
        item('data-course=""', all, first === undefined),
        ...courses.map((c) => item(`data-course="${c.code}" data-name="${escapeHtml(c.label)}"`, c.label, c === first)),
      ].join(""),
    ),
    menu(
      "hm-f-level",
      t.level,
      [
        item(`data-set-level="${top}" data-all=""`, t.allLevels, true),
        ...LEVEL_INFO.map((l) => item(`data-set-level="${l.code}"`, upTo.replace("{level}", l.code), false, levelName(l.code, home))),
      ].join(""),
    ),
    menu("hm-f-read", t.read, readItems(t, read), " hm-ticks"),
    ...courses
      .filter((c) => c.varieties.length > 0)
      .map((c) =>
        menu(
          `hm-f-variety-${c.code}`,
          t.variety,
          c.varieties.map((v, i) => item(`data-set-variety="${v}"`, varietyName(v, home), i === 0)).join(""),
        ),
      ),
  ];
  return `<div class="hm-filters" id="hm-filters" data-start="${escapeHtml(first?.code ?? "")}" role="group" aria-label="${escapeHtml(t.search)}">${[course, level, ...varieties, readIn].join("")}</div>
${menus.join("\n")}`;
}
