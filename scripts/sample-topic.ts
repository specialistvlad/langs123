// A small topic for tests: every block type, and text in every place a topic holds it.
import { EXPLAIN_CODES, type Localized, type Topic } from "./lib.ts";
import type { Report } from "./validate/report.ts";

// Text in every explanation language, and a translation into each one but the language being learned.
const all = (text: string): Localized => Object.fromEntries(EXPLAIN_CODES.map((l) => [l, text]));
const tr = (text: string): Localized => Object.fromEntries(EXPLAIN_CODES.filter((l) => l !== "en").map((l) => [l, text]));

export const SAMPLE: Topic = {
  id: "en.sample.topic",
  lang: "en",
  kind: "grammar",
  tags: [],
  concepts: [],
  related: [],
  status: Object.fromEntries(EXPLAIN_CODES.map((l) => [l, "draft"])) as Topic["status"],
  title: all("Sample"),
  summary: { lead: all("Lead."), rule: all("Rule:"), ex: "Ex." },
  cheatsheet: {
    content: [{ type: "usage", columns: [{ key: "use", label: all("Use") }], rows: [{ level: "A1", use: all("use") }] }],
  },
  sections: [
    {
      title: all("One"),
      role: "own",
      content: [
        { type: "prose", level: "A1", text: all("Prose."), ex: "Prose ex.", tr: tr("Prose tr.") },
        { type: "list", items: [{ type: "rule", level: "A1", text: all("Item."), ex: "Item ex.", tr: tr("Item tr.") }] },
        {
          type: "comparison",
          columns: [
            { key: "a", label: "a" },
            { key: "b", label: all("b") },
          ],
          rows: [{ level: "A2", a: { ex: "Cell ex.", tr: tr("Cell tr.") }, b: all("cell"), tr: tr("Row tr.") }],
        },
        { type: "errors", rows: [{ level: "A1", wrong: "Wrong.", right: "Right.", rule: all("Rule.") }] },
      ],
    },
  ],
};

// The problems a check finds in the sample topic after a change.
export function problemsAfter(change: (t: Topic) => void, check: (topic: Topic, where: string, report: Report) => void): string[] {
  const topic = structuredClone(SAMPLE);
  change(topic);
  const out: string[] = [];
  check(topic, "sample", (_where, message) => out.push(message));
  return out;
}

// The blocks of the sample's one section.
export const sampleBlocks = (t: Topic): Topic["sections"][number]["content"] => t.sections[0]?.content ?? [];
