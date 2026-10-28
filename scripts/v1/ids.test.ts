// Gate 4a check 3: ids are stable. Editing a sentence keeps its id; inserting a block, a sentence or an item gives
// the new element a new id and moves no other.
import { expect, test } from "bun:test";
import { assignLanguageIds, assignSourceIds, assignTopicIds } from "./ids.ts";
import { SOURCE, UK } from "./fixture.ts";
import { idsIn } from "./structure.ts";

type Node = Record<string, unknown>;
const copy = (): { source: Node; uk: Node } => structuredClone({ source: SOURCE as unknown as Node, uk: UK as unknown as Node });
const blocks = (source: Node, n: number): Node[] => ((source["subtopics"] as Node[])[n] as { blocks: Node[] }).blocks;

test("a topic whose elements have their ids gains none", () => {
  const { source, uk } = copy();
  expect(assignTopicIds(source, [uk])).toEqual([]);
  expect(source).toEqual(SOURCE as unknown as Node);
});

test("editing a sentence keeps its id", () => {
  const { source } = copy();
  const fact = blocks(source, 0)[0] as { text: { id: string; text: string }[] };
  (fact.text[0] as { text: string }).text = "Every letter has a name.";
  expect(assignSourceIds(source)).toEqual([]);
  expect(fact.text[0]?.id).toBe("names.fact.1");
});

test("inserting a block moves no other id: the new block and its parts take new ones", () => {
  const { source } = copy();
  const before = idsIn(source);
  blocks(source, 0).unshift({ type: "fact", text: [{ text: "A new first fact." }, { text: "And its second sentence." }] });
  blocks(source, 0).push({ type: "why", text: [{ text: "A second why." }] });
  blocks(source, 1).splice(1, 0, {
    type: "list",
    items: [{ form: "x", ex: { text: "{target x}" } }],
  });
  const table = blocks(source, 1)[2] as { columns: Node[]; rows: Node[] };
  table.columns.push({ key: "du", text: "Dual" });
  table.rows.push({ features: { person: 2 }, cells: { person: { text: "second person" }, sg: ["You work."] } });
  expect(assignSourceIds(source)).toEqual([
    "names.fact-2",
    "names.fact-2.1",
    "names.fact-2.2",
    "names.why-2",
    "names.why-2.1",
    "forms.list",
    "forms.list.1",
    "forms.list.1.ex",
    "forms.table.col.du",
    "forms.table.row.1",
    "forms.table.row.1.name",
  ]);
  expect(idsIn(source).filter((id) => before.includes(id))).toEqual(before);
});

test("new sentences, lines, errors and parts take the next free number of their parent", () => {
  const { source } = copy();
  (blocks(source, 0)[0] as { text: Node[] }).text.unshift({ text: "Inserted first." });
  (source["essence"] as Node[]).push({ to: "forms", ex: { text: "We {target work}." } });
  (source["errors"] as Node[]).push({
    in: "forms",
    wrong: "He work.",
    right: { text: "He {target works}." },
    rule: { text: "Add -s." },
    speakers: { uk: { text: "Reason." }, de: "loose" },
  });
  source["title"] = { text: "The letters" };
  Reflect.deleteProperty(source, "definition");
  Reflect.deleteProperty(source, "picture");
  (source["subtopics"] as Node[]).push({ level: "A2", title: { text: "More" }, blocks: [{ type: "fact", text: [{ text: "One." }] }] });
  expect(assignSourceIds(source, ["err.3"])).toEqual([
    "title",
    "ess.1",
    "ess.1.ex",
    "names.fact.2",
    "part-3",
    "part-3.title",
    "part-3.fact",
    "part-3.fact.1",
    "err.1",
    "err.1.right",
    "err.1.rule",
    "err.1.uk",
  ]);
});

test("a language's own blocks, errors and speakers' reasons take ids starting with the language", () => {
  const { uk } = copy();
  (uk["blocks"] as Node[]).push({ type: "fact", in: "forms", after: "forms.table", text: [{ text: "Факт." }] });
  uk["errors"] = [
    { in: "forms", wrong: "w", right: { text: "r", tr: "п" }, rule: { text: "Правило." }, speakers: { uk: { text: "Причина." } } },
  ];
  uk["speakers"] = { "err.s": { text: "Українська теж." } };
  expect(assignLanguageIds(uk)).toEqual([
    "uk.forms.fact",
    "uk.forms.fact.1",
    "uk.err.1",
    "uk.err.1.right",
    "uk.err.1.rule",
    "uk.err.1.uk",
    "uk.err.s.uk",
  ]);
  expect(assignLanguageIds({ language: "ja", text: {} })).toEqual([]);
});
