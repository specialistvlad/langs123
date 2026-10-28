// Items, examples, tables and errors: each rule passes the fixture and names its written case.
import { expect, test } from "bun:test";
import type { Block, CommonError, ListItem, Table } from "../../generated/library-v1.ts";
import { MARKS } from "../marks.ts";
import { lintCase } from "./case.ts";

const RULES = ["FT-02", "FT-03", "FT-04", "ST-03", "ST-04", "ST-05", "ST-07", "ST-13", "ER-01", "ER-05", "LA-08"];
const list = (items: ListItem[]): Block => ({ id: "names.list", type: "list", items });
const table = (b: Block[]): Table => b[1] as Table;

test("the fixture holds every rule of items, tables and errors", () => {
  for (const rule of RULES) expect(lintCase(rule)).toEqual([]);
});

test("FT-02: an item that states a form with no example of its own", () => {
  expect(lintCase("FT-02", (c) => c.source.subtopics[0]?.blocks.splice(1, 1, list([{ id: "names.a", form: "A", ipa: "eɪ" }])))).toEqual([
    "names.a: the item has no example of its own",
  ]);
});

test("FT-03: an example cut short or collapsed into a frame", () => {
  const cut = (text: string): string[] =>
    lintCase("FT-03", (c) =>
      (c.source.subtopics[1]?.blocks[2] as { items: { text: string }[] }).items.splice(0, 1, { id: "forms.office", text } as never),
    );
  expect(cut("I like apples, bananas, etc.")).toEqual([
    "forms.office: the example is written out in full, with no etc., … or / between forms",
  ]);
  expect(cut("I like tea / coffee / milk.")).toHaveLength(1);
  expect(cut("A, B, C…")).toHaveLength(1);
});

test("FT-04: a list with no fact ahead of it, and an item whose rule is a fragment", () => {
  expect(lintCase("FT-04", (c) => c.source.subtopics[0]?.blocks.reverse())).toEqual([
    "names.list: the list follows the fact that governs its items",
  ]);
  expect(
    lintCase("FT-04", (c) =>
      Object.assign((c.source.subtopics[0]?.blocks[1] as { items: ListItem[] }).items[1] ?? {}, { text: "names end in {ipa iː}" }),
    ),
  ).toEqual(["names.z: the item's rule is a sentence of its own"]);
});

test("ST-03: a table whose columns, rows and cells cross no two axes", () => {
  const said = lintCase("ST-03", (c) => {
    const t = table(c.source.subtopics[1]?.blocks ?? []);
    t.columns.push({ id: "forms.col.du", key: "du", text: "Dual" });
    (t.columns[0] as { key: string }).key = "who";
    Object.assign(t.rows[0] ?? {}, { features: { number: "sg" }, cells: { person: "I", sg: ["I work."], pl: ["We work."], x: ["?"] } });
  });
  expect(said).toEqual([
    "forms.table: the first column names the rows' axis, person",
    "forms.table: du is no value of number",
    "forms.first: the row names its person",
    "forms.first: no column is person",
    "forms.first: a sg row holds no pl cell",
    "forms.first: no column is x",
    "forms.third: no column is person",
  ]);
});

test("ST-04: a sentence in a cell of forms", () => {
  expect(
    lintCase("ST-04", (c) =>
      Object.assign(table(c.source.subtopics[1]?.blocks ?? []).rows[0]?.cells ?? {}, {
        sg: { id: "forms.first.sg", text: "I work, as you see." },
      }),
    ),
  ).toEqual(["forms.first: the sg cell holds forms; a sentence names its row alone"]);
});

test("ST-05: every mark of the vocabulary records why it exists", () => {
  const was = MARKS.term.why;
  MARKS.term.why = "bold";
  expect(lintCase("ST-05")).toEqual(["term: the mark records why it exists: what the reader sees or hears, or what reads it"]);
  MARKS.term.why = was;
});

test("ST-07: an ipa mark with its slashes written inside", () => {
  expect(
    lintCase(
      "ST-07",
      (c) =>
        (((c.source.subtopics[0]?.blocks[0] as { text: { text: string }[] }).text[0] as { text: string }).text =
          "Each letter has a name, as {term A} has {ipa /eɪ/}."),
    ),
  ).toEqual(['names.fact.1: the ipa mark holds its symbols alone, not "/eɪ/"']);
});

test("ST-13: an error that names no subtopic of its topic", () => {
  expect(lintCase("ST-13", (c) => Object.assign(c.source.errors[0] ?? {}, { in: "gone" }))).toEqual(["err.a: no subtopic is gone"]);
});

const twice: CommonError = {
  id: "err.a2",
  in: "names",
  wrong: "A {ipa a}",
  right: "A {ipa eɪ}",
  rule: { id: "err.a2.rule", text: "Again." },
  speakers: { es: { id: "err.a2.es", text: "Spanish." } },
};

test("ER-01: an error written twice", () => {
  expect(lintCase("ER-01", (c) => c.source.errors.push(twice))).toEqual([
    "err.a2: the error is written once, as err.a, with every language whose speakers make it",
  ]);
});

test("ER-05: a language's own error that names other speakers and follows no error", () => {
  const said = lintCase("ER-05", (c) => {
    c.uk.errors = [
      {
        id: "uk.err.1",
        in: "names",
        wrong: "w",
        right: "r",
        rule: { id: "uk.err.1.rule", text: "П." },
        speakers: { pl: { id: "uk.err.1.pl", text: "П." } },
      },
    ];
  });
  expect(said).toEqual([
    "uk.err.1: the error names uk among its speakers",
    "uk.err.1: the error names the source error it follows in after:",
  ]);
});

test("LA-08: a fingerprint of a sentence the file doesn't translate", () => {
  expect(lintCase("LA-08", (c) => Object.assign(c.uk.fingerprints ?? {}, { "names.gone": "00000000" }))).toEqual([
    "names.gone: a fingerprint belongs to a sentence the file translates",
  ]);
});

test("SH-13, ST-09, ST-10 and ST-12: a level on an essence line, item, row or error, and a role, which the schema registers none of, are refused by the schema", () => {
  const level = { level: "A1" };
  expect(lintCase("SH-13", (c) => Object.assign(c.source.essence[0] ?? {}, level))).toEqual([
    "library/en/letters/source.yaml: /essence/0 must NOT have additional properties: level",
  ]);
  expect(lintCase("ST-12", (c) => Object.assign(c.source.errors[0] ?? {}, level))).toEqual([
    "library/en/letters/source.yaml: /errors/0 must NOT have additional properties: level",
  ]);
  expect(lintCase("ST-12", (c) => Object.assign(table(c.source.subtopics[1]?.blocks ?? []).rows[0] ?? {}, level))).toHaveLength(1);
  expect(lintCase("ST-10", (c) => Object.assign(c.source.subtopics[0] ?? {}, { role: "own" }))).toEqual([
    "library/en/letters/source.yaml: /subtopics/0 must NOT have additional properties: role",
  ]);
});
