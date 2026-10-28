// Calibrates the review's questions in Claude Code sessions on each model named (scripts/review/calibrate.ts), and
// writes build/review/calibration.md and calibration.json; then the budget (scripts/review/budget.ts), from every
// session build/review/sessions.jsonl holds, into build/review/budget.md.
// Run: npm run calibrate -- [--models claude-sonnet-5-5 claude-haiku-5-5] [--per-day 150] [--budget-only]
import { appendFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { budgetReport, type SessionLine } from "./review/budget.ts";
import { type Pair, pairsRequest, type Plant, plantedRequests } from "./review/calibrate.ts";
import { REVIEW_DIR } from "./review/index.ts";
import type { Request } from "./review/request.ts";
import { claudeAttempt, runnerOf, type Session } from "./review/run.ts";
import { calibrationReport, type Tally, tally, tallyPairs } from "./review/tally.ts";
import { catalog } from "./v1/check.ts";
import { typedLibrary } from "./v1/library.ts";
import { LIBRARY_ROOT, readLibrary, SAMPLES_ROOT } from "./v1/load.ts";

const args = process.argv.slice(2);
const after = (flag: string): string[] => {
  const at = args.indexOf(flag);
  return at < 0 ? [] : args.slice(at + 1).filter((_, n, rest) => !rest.slice(0, n + 1).some((a) => a.startsWith("--")));
};
const models = after("--models").length > 0 ? after("--models") : ["claude-sonnet-5-5", "claude-haiku-5-5"];
const perDay = Number(after("--per-day")[0] ?? 150);
const date = new Date().toISOString().slice(0, 10);
const yaml = async (path: string): Promise<unknown> => Bun.YAML.parse(await Bun.file(path).text());
await mkdir(REVIEW_DIR, { recursive: true });

if (!args.includes("--budget-only")) {
  const rules = await catalog();
  const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
  const plants = (await yaml(join(LIBRARY_ROOT, "calibration", "questions.yaml"))) as Plant[];
  const pairsDir = join(LIBRARY_ROOT, "calibration", "translations");
  const pairs = await Promise.all(
    (await readdir(pairsDir)).sort().map(async (f) => ({ language: f.slice(0, 2), pairs: (await yaml(join(pairsDir, f))) as Pair[] })),
  );
  const runner = runnerOf(claudeAttempt);
  const tallies: Tally[] = [];
  const lines: SessionLine[] = [];
  const run = async (request: Request, model: string, topic: string): Promise<Session> => {
    const session = await runner(request, model);
    lines.push({ topic, kind: request.kind, language: request.language ?? null, run: 1, ...session });
    return session;
  };
  for (const model of models) {
    const planted = plantedRequests(library, rules, plants);
    await Promise.all(
      planted.map(async (p) => tallies.push(...tally(model, p, await run(p.request, model, `planted ${p.request.topic}`)))),
    );
    await Promise.all(
      pairs.map(async (p) =>
        tallies.push(tallyPairs(model, p.pairs, await run(pairsRequest(p.language, p.pairs, rules), model, "calibration"))),
      ),
    );
    console.log(`${model}: ${String(planted.length + pairs.length)} sessions`);
  }
  await Bun.write(join(REVIEW_DIR, "calibration.json"), JSON.stringify(tallies, null, 2));
  await Bun.write(join(REVIEW_DIR, "calibration.md"), calibrationReport(tallies, date));
  await appendFile(join(REVIEW_DIR, "sessions.jsonl"), lines.map((l) => `${JSON.stringify(l)}\n`).join(""));
}

const sessions = (await Bun.file(join(REVIEW_DIR, "sessions.jsonl")).text())
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l) as SessionLine);
const tallies = (await Bun.file(join(REVIEW_DIR, "calibration.json")).json()) as Tally[];
// The writing's tokens per topic, from the samples' files at about 3.5 characters a token: the files written, out;
// the conventions, the catalog and the source a translator reads, in.
const sizes = await Promise.all(
  (await Array.fromAsync(new Bun.Glob("*/*/*.yaml").scan({ cwd: SAMPLES_ROOT }))).map(async (f) => ({
    f,
    n: (await Bun.file(join(SAMPLES_ROOT, f)).text()).length,
  })),
);
const topics = new Set(sizes.map((s) => s.f.split("/").slice(0, 2).join("/"))).size;
const perFile = sizes.reduce((a, s) => a + s.n, 0) / sizes.length / 3.5;
const conventions =
  ((await Bun.file(join(LIBRARY_ROOT, "CONVENTIONS.md")).text()).length + (await Bun.file(join(LIBRARY_ROOT, "RULES.md")).text()).length) /
  3.5;
const writing = { output: Math.round((perFile * sizes.length) / topics / 3) * 12, input: Math.round((conventions + perFile) * 12) };
await Bun.write(join(REVIEW_DIR, "budget.md"), budgetReport({ sessions, tallies, writing, perDay }, date));
console.log(`${join("build", "review")}: calibration.md, budget.md`);
