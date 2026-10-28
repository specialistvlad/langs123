// Validates configuration, curriculum, concepts and every topic (scripts/validate/) and lists the problems;
// with --library v1, checks the new library (scripts/v1/check.ts) at library/, or at the root given after it.
// Run: npm run check   |   npm run check -- --library v1 [root]
import { join } from "node:path";
import { ROOT } from "./lib.ts";
import { checkRoot } from "./v1/check.ts";
import { formatProblem } from "./v1/schema.ts";
import { validate } from "./validate/index.ts";

const at = process.argv.indexOf("--library");
if (at >= 0 && process.argv[at + 1] === "v1") {
  const root = process.argv[at + 2] ?? join(ROOT, "library");
  const { problems } = await checkRoot(root);
  for (const p of problems) console.log(`  ✗ ${formatProblem(p)}`);
  console.log(`problems: ${problems.length}`);
  process.exit(problems.length > 0 ? 1 : 0);
}
const problems = await validate();
for (const p of problems) console.log(`  ✗ ${p.where}: ${p.message}`);
console.log(`problems: ${problems.length}`);
process.exit(problems.length > 0 ? 1 : 0);
