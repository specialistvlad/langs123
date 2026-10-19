// Runs the checks of npm test, npm run e2e or npm run verify side by side, each in a process of its own, and
// prints each check as it ends with its time; a check that fails prints its output, and the run exits 1.
// Every test process builds the sample site (apps/web/sample.ts) into a folder of its own, build/test/<check>/,
// in under a second. A verify run that takes longer than its budget fails, outside CI, so the checks stay fast.
// Run: npm test | npm run e2e | npm run verify
import { join } from "node:path";
import { ROOT } from "./lib.ts";

type Check = [name: string, command: string[]];
const BUDGET_SECONDS = 60;

// The unit test files that check the built sample pages run in a process of their own, which parses each page
// once; the rest run in another, with coverage; every browser test file runs in one more, sharing one server
// and one Chromium (apps/web/browser.ts).
const PAGE_CHECKS = [
  "apps/web/path.test.ts",
  "apps/web/levels.test.ts",
  "apps/web/marks.test.ts",
  "apps/web/credits.test.ts",
  "apps/web/tracks.test.ts",
];
const UNIT: Check[] = [
  ["unit tests, with coverage", ["bun", "test", "--coverage", ...PAGE_CHECKS.map((file) => `--path-ignore-patterns=${file}`)]],
  ["checks on the sample pages", ["bun", "test", ...PAGE_CHECKS.map((file) => `./${file}`)]],
];
const E2E_FILES = (await Array.fromAsync(new Bun.Glob("apps/web/*.e2e.ts").scan({ cwd: ROOT }))).sort();
const E2E: Check[] = [["browser tests", ["bun", "test", ...E2E_FILES.map((file) => `./${file}`)]]];
const GROUPS: Record<string, Check[]> = {
  test: UNIT,
  e2e: E2E,
  verify: [
    ["generated types", ["bun", "run", "scripts/schema-types.ts", "--check"]],
    ...["typecheck", "lint", "format:check", "check"].map((script): Check => [script, ["bun", "run", script]]),
    ...UNIT,
    ...E2E,
  ],
};

const group = process.argv[2] ?? "";
const checks = GROUPS[group];
if (checks === undefined) {
  console.error(`usage: bun run scripts/verify.ts ${Object.keys(GROUPS).join(" | ")}`);
  process.exit(2);
}

const start = performance.now();
const seconds = (since: number): string => `${((performance.now() - since) / 1000).toFixed(1)}s`;
const results = await Promise.all(
  checks.map(async ([name, command]) => {
    const began = performance.now();
    const env: Record<string, string | undefined> = {
      ...process.env,
      TEST_SITE_DIR: join(ROOT, "build", "test", name.replace(/\W+/g, "-")),
      ...(process.stdout.isTTY && { FORCE_COLOR: "1" }),
    };
    const child = Bun.spawn(command, { cwd: ROOT, env, stdout: "pipe", stderr: "pipe" });
    const [out, err, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    const output = out + err;
    // eslint-disable-next-line no-control-regex -- the colours a check prints
    const passed = /(\d+) pass\b/.exec(output.replace(/\x1b\[[0-9;]*m/g, ""))?.[1];
    console.log(`  ${code === 0 ? "✓" : "✗"} ${name}${passed === undefined ? "" : `, ${passed} tests`}  ${seconds(began)}`);
    if (code !== 0) console.log(output);
    return code === 0;
  }),
);
const failed = results.filter((ok) => !ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed in ${seconds(start)}`);
const slow = group === "verify" && process.env["CI"] === undefined && performance.now() - start > BUDGET_SECONDS * 1000;
if (slow) console.log(`✗ verify took longer than its budget of ${String(BUDGET_SECONDS)} s: make the slowest check faster`);
process.exit(failed > 0 || slow ? 1 : 0);
