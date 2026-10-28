// The rule catalog of the new library, library/RULES.md: a Covers table of the requirements it covers, then one
// `### <id> <name>` heading per rule with its fields, each a line `Label: value` that may wrap onto the lines
// after it. A rule names the requirements it serves, states what to do, quotes a negative example from today's
// pages with its file in parentheses, or opens with "(written case)" and describes the form it forbids ("Not
// this"), and names its check: the schema, the linter, one question asked of one block or one sentence, or a
// test of the apps, the build or the pipeline. `Languages:` names the languages of the text a rule checks and
// `Courses:` the courses it holds for. ruleProblems names every covered requirement no rule serves and every
// rule missing a part, and unstated every rule the conventions text leaves unnamed.
import { join } from "node:path";
import { ROOT } from "./lib.ts";

export const RULES_FILE = join(ROOT, "library", "RULES.md");
export const CHECKS = ["schema", "lint", "question", "test"] as const;

const LABELS = {
  requirements: "Requirements",
  rule: "Rule",
  notThis: "Not this",
  check: "Check",
  question: "Question",
  languages: "Languages",
  courses: "Courses",
  source: "Source",
} as const;
type Field = keyof typeof LABELS;
const FIELDS = Object.keys(LABELS) as Field[];
const REQUIRED: Field[] = ["requirements", "rule", "notThis", "check"];

export interface Covered {
  id: string;
  name: string;
  line: number;
}

export interface Rule {
  id: string;
  name: string;
  line: number;
  fields: Partial<Record<Field, string>>;
  // Problems found while reading the rule: a field given twice, a label the catalog doesn't know.
  read: string[];
}

export interface Catalog {
  covers: Covered[] | null;
  rules: Rule[];
}

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
// A field's line: `Label: value`, `- Label: value`, `**Label:** value` or `**Label**: value`.
const FIELD = /^(?:[-*]\s+)?(?:\*\*)?([A-Z][A-Za-z]*(?: [A-Za-z]+){0,2})(?::\*\*|\*\*:|:)(?:\s+(.*))?$/;
const COVERED_ID = /^\d+\.\d+(?: [a-z]+)?$/;
const RULE_ID = /^[A-Za-z0-9][A-Za-z0-9.-]*$/;
const LANGUAGE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const SUBJECT = /^\[(block|sentence)\]\s+\S/;
const WRITTEN_CASE = /^\(written case\)\s+\S/;
// A file of today's library in parentheses: a topic's path, a data file, or a section of its conventions.
const CITATION = /\((?:[^()]*\b[a-z]{2}\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+|[^()]*\b[\w-]+\.(?:ya?ml|md|json)\b|§\d)[^()]*\)/;

const fieldOf = (label: string): Field | undefined => FIELDS.find((f) => LABELS[f].toLowerCase() === label.toLowerCase());
const cells = (line: string): string[] =>
  line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
const list = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "");

// Reads a catalog's text: its Covers table and its rules, each field's lines joined into one value.
export function parseRules(text: string): Catalog {
  const catalog: Catalog = { covers: null, rules: [] };
  let inCovers = false;
  let fence = false;
  let rule: Rule | null = null;
  let field: Field | null = null;
  const lines = text.split("\n");
  for (const [i, raw] of lines.entries()) {
    const line = raw.trim();
    if (line.startsWith("```")) fence = !fence;
    if (fence || line.startsWith("```")) continue;
    const heading = HEADING.exec(line);
    if (heading !== null) {
      const level = (heading[1] ?? "").length;
      const title = heading[2] ?? "";
      field = null;
      if (level <= 3) rule = null;
      if (level <= 3) inCovers = level === 2 && title.toLowerCase() === "covers";
      if (inCovers) catalog.covers ??= [];
      if (level === 3) {
        const [id = "", ...name] = title.split(/\s+/);
        rule = { id, name: name.join(" "), line: i + 1, fields: {}, read: [] };
        catalog.rules.push(rule);
      }
      continue;
    }
    if (inCovers && line.startsWith("|")) {
      const [id = "", name = ""] = cells(line);
      if (/^:?-+:?$/.test(id) || id.toLowerCase() === "requirement") continue;
      catalog.covers?.push({ id, name, line: i + 1 });
      continue;
    }
    if (rule === null) continue;
    const label = FIELD.exec(line);
    if (label !== null) {
      field = fieldOf(label[1] ?? "") ?? null;
      if (field === null) rule.read.push(`unknown field "${label[1] ?? ""}:"`);
      else if (field in rule.fields) rule.read.push(`${LABELS[field]} is given twice`);
      else rule.fields[field] = (label[2] ?? "").trim();
      continue;
    }
    if (field !== null && line !== "") rule.fields[field] = `${rule.fields[field] ?? ""} ${line}`.trim();
  }
  return catalog;
}

// What is wrong with one rule, given the requirement ids the catalog covers.
function problemsOf(rule: Rule, covered: Set<string>): string[] {
  const problems = [...rule.read];
  const { fields } = rule;
  if (!RULE_ID.test(rule.id)) problems.push(`the id "${rule.id}" is not letters, digits, dots and hyphens`);
  if (rule.name === "") problems.push("has no name after its id");
  for (const f of REQUIRED) if ((fields[f] ?? "") === "") problems.push(`has no ${LABELS[f]}`);
  const requirements = list(fields.requirements);
  for (const r of requirements) if (!covered.has(r)) problems.push(`serves ${r}, which the Covers table doesn't list`);
  const check = fields.check ?? "";
  if (check !== "" && !(CHECKS as readonly string[]).includes(check)) problems.push(`Check is "${check}", not one of ${CHECKS.join(", ")}`);
  const question = fields.question ?? "";
  if (check === "question" && question === "") problems.push("is a question check without its Question");
  if (check !== "question" && check !== "" && question !== "") problems.push(`has a Question but its Check is ${check}`);
  if (question !== "") {
    if (!SUBJECT.test(question)) problems.push("Question doesn't open with its one subject, [block] or [sentence]");
    if ((question.match(/\?/g) ?? []).length !== 1 || !question.endsWith("?")) problems.push("Question doesn't ask exactly one question");
    if (/\[(?:block|sentence)\]/.test(question.replace(SUBJECT, ""))) problems.push("Question names more than one subject");
  }
  const notThis = fields.notThis ?? "";
  if (notThis !== "" && !WRITTEN_CASE.test(notThis) && !CITATION.test(notThis)) {
    problems.push('Not this neither cites its file of today\'s library in parentheses nor opens with "(written case)"');
  }
  for (const f of ["languages", "courses"] as const) {
    if (f in fields && list(fields[f]).length === 0) problems.push(`${LABELS[f]} names no ${f === "courses" ? "course" : "language"}`);
    for (const tag of list(fields[f])) if (!LANGUAGE.test(tag)) problems.push(`${LABELS[f]} holds "${tag}", not a language tag`);
  }
  if ("source" in fields && fields.source === "") problems.push("Source names no section");
  return problems;
}

// Every problem of a catalog, as "line id: what", in the catalog's order.
export function ruleProblems(catalog: Catalog): string[] {
  if (catalog.covers === null) return ["the catalog has no `## Covers` table of the requirements it covers"];
  const problems: string[] = [];
  const covered = new Set<string>();
  for (const c of catalog.covers) {
    if (!COVERED_ID.test(c.id)) problems.push(`${c.line} Covers: "${c.id}" is not a requirement id such as 2.6 or 9.5 blocks`);
    if (covered.has(c.id)) problems.push(`${c.line} Covers: ${c.id} is listed twice`);
    if (c.name === "") problems.push(`${c.line} Covers: ${c.id} has no name`);
    covered.add(c.id);
  }
  const seen = new Set<string>();
  for (const rule of catalog.rules) {
    if (seen.has(rule.id)) problems.push(`${rule.line} ${rule.id}: the id is used by an earlier rule`);
    seen.add(rule.id);
    for (const p of problemsOf(rule, covered)) problems.push(`${rule.line} ${rule.id}: ${p}`);
  }
  const served = new Set(catalog.rules.flatMap((r) => list(r.fields.requirements)));
  for (const c of catalog.covers) if (!served.has(c.id)) problems.push(`${c.line} Covers: no rule serves ${c.id}`);
  return problems;
}

// The rules the conventions text leaves unnamed (CA-01): a writer reads every rule there, by its id.
export const unstated = (catalog: Catalog, conventions: string): string[] =>
  catalog.rules
    .filter((r) => !new RegExp(`(?<![\\w-])${r.id.replace(/[.]/g, "\\.")}(?![\\w-])`).test(conventions))
    .map((r) => `${r.line} ${r.id}: CONVENTIONS.md doesn't restate it by its id`);

export const readRules = async (file = RULES_FILE): Promise<Catalog> => parseRules(await Bun.file(file).text());
