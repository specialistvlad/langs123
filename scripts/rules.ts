// Checks the rule catalog of the new library, library/RULES.md (scripts/rule-catalog.ts): every covered
// requirement has a rule, every rule has its requirements, its statement, its "Not this" and its check, and the
// conventions text beside it, CONVENTIONS.md, restates every rule by its id.
// Run: bun run rules [file]
import { dirname, join, relative } from "node:path";
import { ROOT } from "./lib.ts";
import { readRules, ruleProblems, RULES_FILE, unstated } from "./rule-catalog.ts";

const file = process.argv[2] ?? RULES_FILE;
const name = relative(ROOT, file);
const conventions = Bun.file(join(dirname(file), "CONVENTIONS.md"));
async function check(): Promise<string[]> {
  if (!(await Bun.file(file).exists())) return ["the rule catalog is missing"];
  const catalog = await readRules(file);
  if (!(await conventions.exists())) return [...ruleProblems(catalog), "the conventions text beside it, CONVENTIONS.md, is missing"];
  return [...ruleProblems(catalog), ...unstated(catalog, await conventions.text())];
}
const problems = await check();
for (const p of problems) console.log(`  ✗ ${name}${/^\d/.test(p) ? ":" : ": "}${p}`);
console.log(`problems: ${problems.length}`);
process.exit(problems.length > 0 ? 1 : 0);
