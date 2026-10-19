// The study path holds one step for every level of every written topic, inside the curriculum and
// lowest level first; a language being learned lists its explanation languages from the source, its own
// varieties, and titles in exactly its explanation languages.
import { describe, expect, test } from "bun:test";
import { type CurriculumLanguage, type Explain, loadCurriculum, loadTopics } from "../lib.ts";
import { checkLanguage, checkPath } from "./curriculum.ts";

const curriculum = await loadCurriculum();
const refs = await loadTopics(curriculum);
const english = curriculum.languages[0];
if (!english) throw new Error("curriculum.yaml has no language");
const source: CurriculumLanguage = english;

// The path problems after changing a copy of the English path.
function messagesOf(change: (path: Record<string, string[]>) => void): string[] {
  const language = structuredClone(source);
  change(language.path);
  const messages: string[] = [];
  checkPath(language, refs, (_, message) => messages.push(message));
  return messages;
}
const steps = (path: Record<string, string[]>, level: string): string[] => path[level] ?? [];

describe("the study path", () => {
  test("the path as it is passes", () => {
    expect(messagesOf(() => undefined)).toEqual([]);
  });
  test("a step names a topic in the curriculum", () => {
    expect(messagesOf((p) => steps(p, "A1").push("en.verbs.no-such-topic"))).toContain(
      "path A1: en.verbs.no-such-topic is not a topic of this language in the curriculum",
    );
  });
  test("a step sits at a level its topic holds", () => {
    expect(messagesOf((p) => steps(p, "A0").push("en.tenses.perfect-tenses"))).toContain(
      "path A0: en.tenses.perfect-tenses has nothing at A0",
    );
  });
  test("every level of a topic has a step", () => {
    const messages = messagesOf((p) => {
      p["A2"] = steps(p, "A2").filter((id) => id !== "en.verbs.to-be");
    });
    expect(messages).toContain("path A2: en.verbs.to-be holds A2 and needs a step there");
  });
  test("levels run lowest first", () => {
    const messages = messagesOf((p) => {
      const a0 = steps(p, "A0");
      delete p["A0"];
      p["A0"] = a0;
    });
    const order = [...Object.keys(source.path).filter((l) => l !== "A0"), "A0"];
    expect(messages).toContain(`path en: levels run lowest first (${order.join(", ")})`);
  });
});

// The language problems after changing a copy of the Spanish entry.
const found = curriculum.languages.find((l) => l.code === "es");
if (!found) throw new Error("curriculum.yaml has no Spanish");
const spanish: CurriculumLanguage = found;
function languageMessages(change: (language: CurriculumLanguage) => void): string[] {
  const language = structuredClone(spanish);
  change(language);
  const messages: string[] = [];
  checkLanguage(language, (_, message) => messages.push(message));
  return messages;
}

describe("a language being learned", () => {
  test("every language as it is passes", () => {
    const messages: string[] = [];
    for (const language of curriculum.languages) checkLanguage(language, (_, message) => messages.push(message));
    expect(messages).toEqual([]);
  });
  test("its explanation languages start with itself, the source the others translate", () => {
    expect(languageMessages((l) => (l.explain = ["en", ...(l.explain ?? []).filter((e) => e !== "en")]))).toEqual([
      "es: explain starts with es, the source the other explanation languages translate",
    ]);
  });
  test("its varieties are its own", () => {
    expect(languageMessages((l) => (l.varieties = ["es-419", "en-GB"]))).toEqual(["es: variety en-GB belongs to another language"]);
  });
  test("its section and topic titles carry exactly its explanation languages", () => {
    // Spanish written for three explanation languages, in one section of one topic.
    const messages = languageMessages((l) => {
      const keep: Explain[] = ["es", "en", "uk"];
      l.explain = keep;
      const [section] = l.sections;
      const [topic] = section?.topics ?? [];
      if (!section || !topic?.title) return;
      const only = (title: Partial<Record<Explain, string>>, langs: Explain[]): Partial<Record<Explain, string>> =>
        Object.fromEntries(Object.entries(title).filter(([k]) => langs.includes(k as Explain)));
      l.sections = [
        {
          ...section,
          title: only(section.title, ["en", "uk"]),
          topics: [{ ...topic, title: { ...only(topic.title, keep), fr: "L’alphabet" } }],
        },
      ];
    });
    expect(messages).toEqual([
      'es section 01-fundamentos has no "es" title',
      'es topic 01-fundamentos/alfabeto-ortografia has a "fr" title, which es is not written for',
    ]);
  });
});
