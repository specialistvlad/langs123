// A topic of a language written for some explanation languages carries exactly those: its text, its
// status and its translation stamps; the other explanation languages ask nothing of it.
import { describe, expect, test } from "bun:test";
import { fingerprint } from "../fingerprint.ts";
import type { Explain, Localized, Topic, TopicRef } from "../lib.ts";
import { checkTopic } from "./topic.ts";

const TRACK: Explain[] = ["es", "en"];
// A small Spanish topic in Spanish and English alone: Spanish is its source, and its examples translate into
// English.
function spanish(): Topic {
  const both = (en: string, es: string): Localized => ({ en, es });
  const topic: Topic = {
    id: "es.sample.topic",
    lang: "es",
    kind: "grammar",
    tags: [],
    concepts: [],
    related: [],
    status: { en: "draft", es: "draft" },
    title: both("Sample", "Muestra"),
    summary: { lead: both("Ser names what something is.", "Ser dice qué es algo."), rule: both("Ser:", "Ser:") },
    cheatsheet: {
      content: [
        { type: "usage", columns: [{ key: "use", label: both("Use", "Uso") }], rows: [{ level: "A1", use: both("Name", "Nombre") }] },
      ],
    },
    sections: [
      {
        title: both("One", "Uno"),
        role: "own",
        content: [
          { type: "list", items: [{ type: "rule", level: "A1", text: both("Name:", "Nombre:"), ex: "Soy Ana.", tr: { en: "I'm Ana." } }] },
        ],
      },
    ],
  };
  topic.translated = { en: fingerprint(topic, "es") };
  return topic;
}
const ref = { id: "es.sample.topic", lang: "es", entry: { slug: "topic" }, explain: TRACK } as TopicRef;
function problemsOf(change: (t: Topic) => void): string[] {
  const topic = spanish();
  change(topic);
  const out: string[] = [];
  checkTopic(ref, topic, new Set([ref.id]), {}, (_where, message) => out.push(message));
  return out;
}

describe("a topic of a language written for Spanish and English", () => {
  test("passes with Spanish and English alone", () => {
    expect(problemsOf(() => undefined)).toEqual([]);
  });
  test("has a status in each of them, and in no other", () => {
    expect(problemsOf((t) => (t.status = { en: "draft", uk: "draft" }))).toEqual([
      'status has no "es"',
      'status has "uk", which the topic\'s language is not written for',
    ]);
  });
  test("stamps its translations in them alone", () => {
    expect(problemsOf((t) => (t.translated = { ...t.translated, uk: fingerprint(t, "es") }))).toEqual([
      'translated has "uk", which the topic\'s language is not written for',
    ]);
  });
  test("stamps the translations, never the source", () => {
    expect(problemsOf((t) => (t.translated = { ...t.translated, es: fingerprint(t, "es") }))).toEqual([
      'translated has "es", the source the other languages follow',
    ]);
  });
  test("carries each of them in its text", () => {
    expect(problemsOf((t) => delete t.title.en)).toEqual(['title has no "en" text']);
  });
});
