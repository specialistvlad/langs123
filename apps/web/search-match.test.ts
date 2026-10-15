// The top bar's search: matching sets accents and case aside, every word of the query counts, titles
// that start with the query lead, and rows above the level filter follow the others.
import { describe, expect, test } from "bun:test";
import { highlight, match, search, type SearchData, type SearchEntry } from "./search-match.ts";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const entry = (kind: SearchEntry["kind"], title: string, from = "A1"): SearchEntry => ({
  kind,
  title,
  context: "",
  url: `/${title}/`,
  from,
  to: from,
  badge: "",
});
const data: SearchData[] = [
  {
    track: "Learn Spanish",
    entries: [
      entry("topic", "Subject Pronouns", "A0"),
      entry("topic", "Forms of Address: tú, usted, vosotros, ustedes"),
      entry("topic", "Usted and Ustedes", "B1"),
      entry("section", "Usted with other words", "A2"),
    ],
  },
];

describe("match", () => {
  test("accents and case aside", () => {
    expect(match("Forms of Address: tú, usted", "TU")).not.toBeNull();
    expect(match("Forms of Address: tu", "tú")).not.toBeNull();
  });
  test("every word of the query, in any order", () => {
    expect(match("Forms of Address", "address forms")).not.toBeNull();
    expect(match("Forms of Address", "forms verbs")).toBeNull();
  });
  test("a title that starts with the query, then a word that does, then the query inside a word", () => {
    expect(match("Usted and Ustedes", "usted")?.score).toBe(3);
    expect(match("Forms of Address: usted", "usted")?.score).toBe(2);
    expect(match("Reflexive verbs", "exive")?.score).toBe(1);
  });
  test("marks the matching characters of the title, accents kept", () => {
    const m = match("Forms of Address: tú, usted", "tu");
    expect(m?.marks).toEqual([[18, 20]]);
    expect(highlight("Forms of Address: tú, usted", m?.marks ?? [], (s) => s)).toBe("Forms of Address: <mark>tú</mark>, usted");
  });
});

describe("search", () => {
  test("topics and sections in two groups, a title that starts with the query first", () => {
    const found = search(data, "usted", "C2", LEVELS);
    expect(found.topics.map((h) => h.entry.title)).toEqual(["Usted and Ustedes", "Forms of Address: tú, usted, vosotros, ustedes"]);
    expect(found.sections.map((h) => h.entry.title)).toEqual(["Usted with other words"]);
  });
  test("rows above the level filter come after the others, marked", () => {
    const found = search(data, "usted", "A2", LEVELS);
    expect(found.topics.map((h) => [h.entry.title, h.above])).toEqual([
      ["Forms of Address: tú, usted, vosotros, ustedes", false],
      ["Usted and Ustedes", true],
    ]);
  });
  test("an empty query finds nothing", () => {
    expect(search(data, "  ", "C2", LEVELS)).toEqual({ topics: [], sections: [] });
  });
});
