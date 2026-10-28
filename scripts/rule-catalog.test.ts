// The rule catalog's check: every covered requirement has a rule, and every rule has its parts.
import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseRules, readRules, ruleProblems, unstated } from "./rule-catalog.ts";

const CATALOG = `# Rules

The rules every topic follows.

## Covers

| Requirement | Name |
|---|---|
| 2.6 | Errors belong to their speakers |
| 9.5 levels | A level sits on the subtopic |

## Errors

### E-01 Each error names its speakers
Requirements: 2.6
Rule: Each error is written once and names every language whose speakers make it.
Not this: (written case) generic errors shown to every reader,
or the same mistake copied once per language.
Check: schema

### E-02 An error's rule says why
- **Requirements:** 2.6, 9.5 levels
- **Rule:** An error's rule states the correct form.
- **Not this**: “B C D E G P T V · names end in /iː/” (en/01-foundations/alphabet-spelling), eight letters in one row.
- **Check:** question
- **Question:** [sentence] Does this sentence state the correct form?
- **Languages:** uk, fr-CA
- **Courses:** en
- **Source:** §6 Translations and readers

#### Notes under a rule stay outside its fields

\`\`\`
### X-01 A rule shown as an example
Check: schema
\`\`\`
`;

const problems = (text: string): string[] => ruleProblems(parseRules(text));
const rule = (fields: string, id = "R-1 A rule"): string =>
  `## Covers\n\n| Requirement | Name |\n|---|---|\n| 2.6 | Errors |\n\n### ${id}\n${fields}\n`;
const FULL = "Requirements: 2.6\nRule: Do this.\nNot this: (written case) that.\nCheck: lint";

describe("reading", () => {
  test("a catalog reads its Covers table and its rules, each field's lines joined", () => {
    const catalog = parseRules(CATALOG);
    expect(catalog.covers?.map((c) => [c.id, c.name])).toEqual([
      ["2.6", "Errors belong to their speakers"],
      ["9.5 levels", "A level sits on the subtopic"],
    ]);
    expect(catalog.rules.map((r) => [r.id, r.name, r.line])).toEqual([
      ["E-01", "Each error names its speakers", 14],
      ["E-02", "An error's rule says why", 21],
    ]);
    expect(catalog.rules[0]?.fields.notThis).toBe(
      "(written case) generic errors shown to every reader, or the same mistake copied once per language.",
    );
    expect(catalog.rules[1]?.fields).toMatchObject({
      requirements: "2.6, 9.5 levels",
      check: "question",
      languages: "uk, fr-CA",
      courses: "en",
    });
  });

  test("a whole catalog with every part in place has no problems", () => {
    expect(problems(CATALOG)).toEqual([]);
  });

  test("labels match in any case, and text outside a rule or before its first field stays out", () => {
    const catalog = parseRules(
      `Intro: free text\n${rule(`A line before the fields\nNOT THIS: (written case) that.\n${FULL.replace("Not this: (written case) that.\n", "")}`)}`,
    );
    expect(catalog.rules[0]?.fields.notThis).toBe("(written case) that.");
    expect(ruleProblems(catalog)).toEqual([]);
  });

  test("a file reads as its text", async () => {
    const file = join(await mkdtemp(join(tmpdir(), "rules-")), "RULES.md");
    await writeFile(file, CATALOG);
    expect((await readRules(file)).rules).toHaveLength(2);
  });
});

describe("problems", () => {
  test("a catalog without a Covers table", () => {
    expect(problems("### R-1 A rule\nCheck: lint\n")).toEqual(["the catalog has no `## Covers` table of the requirements it covers"]);
  });

  test("a covered requirement no rule serves, listed twice, unnamed or not an id", () => {
    expect(problems("## Covers\n\n| 2.6 | Errors |\n| 2.6 | Errors |\n| 3.1 | |\n| 2.x | Two |\n")).toEqual([
      "4 Covers: 2.6 is listed twice",
      "5 Covers: 3.1 has no name",
      '6 Covers: "2.x" is not a requirement id such as 2.6 or 9.5 blocks',
      "3 Covers: no rule serves 2.6",
      "4 Covers: no rule serves 2.6",
      "5 Covers: no rule serves 3.1",
      "6 Covers: no rule serves 2.x",
    ]);
  });

  test("a rule missing its parts, or its id or name", () => {
    expect(problems(rule("Requirements: 2.6", "R/1"))).toEqual([
      '7 R/1: the id "R/1" is not letters, digits, dots and hyphens',
      "7 R/1: has no name after its id",
      "7 R/1: has no Rule",
      "7 R/1: has no Not this",
      "7 R/1: has no Check",
    ]);
  });

  test("a rule serving a requirement outside the Covers table, or reusing an id", () => {
    const text = `${rule(FULL)}\n### R-1 Again\n${FULL.replace("2.6", "2.6, 3.3")}\n`;
    expect(problems(text)).toEqual([
      "13 R-1: the id is used by an earlier rule",
      "13 R-1: serves 3.3, which the Covers table doesn't list",
    ]);
  });

  test("a check that is none of the four, and a Question on the wrong check", () => {
    expect(problems(rule(FULL.replace("lint", "test")))).toEqual([]);
    expect(problems(rule(FULL.replace("lint", "review")))).toEqual(['7 R-1: Check is "review", not one of schema, lint, question, test']);
    expect(problems(rule(`${FULL}\nQuestion: [block] Is it?`))).toEqual(["7 R-1: has a Question but its Check is lint"]);
    expect(problems(rule(FULL.replace("lint", "question")))).toEqual(["7 R-1: is a question check without its Question"]);
  });

  test("a Question without its one subject, or asking more than one question", () => {
    const ask = (q: string): string[] => problems(rule(`${FULL.replace("lint", "question")}\nQuestion: ${q}`));
    expect(ask("[sentence] Is it clear?")).toEqual([]);
    expect(ask("Is it clear?")).toEqual(["7 R-1: Question doesn't open with its one subject, [block] or [sentence]"]);
    expect(ask("[block] Is it clear? Is it short?")).toEqual(["7 R-1: Question doesn't ask exactly one question"]);
    expect(ask("[block] Say whether it is clear.")).toEqual(["7 R-1: Question doesn't ask exactly one question"]);
    expect(ask("[block] Does it agree with each [sentence] in it?")).toEqual(["7 R-1: Question names more than one subject"]);
  });

  test("a Not this cites its file of today's library, or is a written case", () => {
    const not = (text: string): string[] => problems(rule(FULL.replace("(written case) that.", text)));
    expect(not('"Modal Verbs in the Past" (en/06-modals/modal-perfect).')).toEqual([]);
    expect(not('"Я живу на Україні." as a row with no speakers (uk/02-nouns-cases/locative).')).toEqual([]);
    expect(not("`- { slug: alphabet-spelling }` (curriculum.yaml)")).toEqual([]);
    expect(not('"Tables first." (§7 of today\'s CONVENTIONS.md), a rule with no page.')).toEqual([]);
    const cites = '7 R-1: Not this neither cites its file of today\'s library in parentheses nor opens with "(written case)"';
    expect(not("A row whose names end in (/iː/).")).toEqual([cites]);
    expect(not("generic errors shown to every reader")).toEqual([cites]);
  });

  test("Languages, Courses and Source hold their values", () => {
    expect(problems(rule(`${FULL}\nLanguages: uk, Ukrainian\nCourses: uk\nSource: §1`))).toEqual([
      '7 R-1: Languages holds "Ukrainian", not a language tag',
    ]);
    expect(problems(rule(`${FULL}\nLanguages:\nCourses:\nSource:`))).toEqual([
      "7 R-1: Languages names no language",
      "7 R-1: Courses names no course",
      "7 R-1: Source names no section",
    ]);
  });

  test("a field given twice, and a label the catalog doesn't know", () => {
    expect(problems(rule(`${FULL}\nRule: Again.\nNot That: x`))).toEqual([
      "7 R-1: Rule is given twice",
      '7 R-1: unknown field "Not That:"',
    ]);
  });

  test("the conventions text restates every rule by its id, and a longer id names no shorter one", () => {
    const catalog = parseRules(CATALOG);
    expect(unstated(catalog, "E-01 and E-02 in the order a writer meets them.")).toEqual([]);
    expect(unstated(catalog, "E-01, then E-020 and XE-02.")).toEqual(["21 E-02: CONVENTIONS.md doesn't restate it by its id"]);
  });
});
