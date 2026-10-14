// The study path of a language being learned: per level, lowest first, the topics to study at that
// level. A step is a topic at a level, so a written topic has a step at every level its leaves hold
// and at no other; a planned topic's steps sit inside its planned range.
import { SOURCE } from "../fingerprint.ts";
import { type CurriculumLanguage, type Explain, explainOf, type Level, lv, type TopicRef } from "../lib.ts";
import { contains, refRange, topicLevels } from "../levels.ts";
import type { Report } from "./report.ts";

// A language being learned: its explanation languages start with the source, its varieties are its own,
// and its section and topic titles carry exactly its explanation languages.
export function checkLanguage(language: CurriculumLanguage, report: Report): void {
  const where = "curriculum.yaml";
  const explain = explainOf(language);
  if (explain[0] !== SOURCE) report(where, `${language.code}: explain starts with ${SOURCE}, the source the translations follow`);
  for (const v of language.varieties ?? []) {
    if (!v.startsWith(`${language.code}-`)) report(where, `${language.code}: variety ${v} belongs to another language`);
  }
  const titles = (title: Partial<Record<Explain, string>> | undefined, what: string): void => {
    if (title === undefined) return;
    for (const l of explain) if (title[l] === undefined) report(where, `${what} has no "${l}" title`);
    for (const l of Object.keys(title)) {
      if (!(explain as string[]).includes(l)) report(where, `${what} has a "${l}" title, which ${language.code} is not written for`);
    }
  };
  for (const section of language.sections) {
    titles(section.title, `${language.code} section ${section.dir}`);
    for (const topic of section.topics) titles(topic.title, `${language.code} topic ${section.dir}/${topic.slug}`);
  }
}

const held = (ref: TopicRef): Level[] => (ref.topic ? topicLevels(ref.topic) : []);

export function checkPath(language: CurriculumLanguage, refs: TopicRef[], report: Report): void {
  const own = new Map(refs.filter((r) => r.lang === language.code).map((r) => [r.id, r]));
  const levels = Object.keys(language.path);
  if (levels.some((l, i) => i > 0 && lv(l) <= lv(levels[i - 1] ?? null))) {
    report("curriculum.yaml", `path ${language.code}: levels run lowest first (${levels.join(", ")})`);
  }
  const steps = new Set<string>();
  for (const [level, ids] of Object.entries(language.path)) {
    for (const id of ids) {
      const ref = own.get(id);
      if (!ref) {
        report("curriculum.yaml", `path ${level}: ${id} is not a topic of this language in the curriculum`);
        continue;
      }
      steps.add(`${level} ${id}`);
      const range = refRange(ref);
      const holds = ref.topic ? held(ref).includes(level as Level) : range !== null && contains(range, level);
      if (!holds) report("curriculum.yaml", `path ${level}: ${id} has nothing at ${level}`);
    }
  }
  for (const ref of own.values()) {
    for (const level of held(ref)) {
      if (!steps.has(`${level} ${ref.id}`)) report("curriculum.yaml", `path ${level}: ${ref.id} holds ${level} and needs a step there`);
    }
  }
}
