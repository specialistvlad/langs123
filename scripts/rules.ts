// Checks the rule catalog of the new library, library/RULES.md (scripts/rule-catalog.ts): every covered
// requirement has a rule, and every rule has its requirements, its statement, its "Not this" and its check.
// Run: bun run rules [file]
import { relative } from "node:path";
import { ROOT } from "./lib.ts";
import { readRules, ruleProblems, RULES_FILE } from "./rule-catalog.ts";

const file = process.argv[2] ?? RULES_FILE;
const name = relative(ROOT, file);
const problems = (await Bun.file(file).exists()) ? ruleProblems(await readRules(file)) : ["the rule catalog is missing"];
for (const p of problems) console.log(`  ✗ ${name}${/^\d/.test(p) ? ":" : ": "}${p}`);
console.log(`problems: ${problems.length}`);
process.exit(problems.length > 0 ? 1 : 0);
