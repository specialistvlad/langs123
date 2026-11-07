// Calibrates the review's questions in Claude Code sessions on each model named (scripts/review/calibrate.ts), and
// writes build/review/calibration.md and calibration.json; then the budget (scripts/review/budget.ts), from every
// session build/review/sessions.jsonl holds, into build/review/budget.md. With --rules, the planted requests holding
// a case of the rules named run alone (RV-11 runs the pairs), and their tallies replace those of the same model and
// rule in calibration.json; each session's findings stay in sessions.jsonl, and --retally counts the latest saved
// session of each request again in place of a new one. --flags writes build/review/flags.md alone, from the saved
// sessions of the models named: each element they flagged against the rules given, for the owner to label.
// Run: npm run calibrate -- [--models claude-sonnet-5-5 claude-haiku-5-5] [--rules SH-20 ST-02] [--retally] [--per-day 150]
//      [--budget-only] [--flags ST-02 SH-19 ER-08]
import { appendFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { budgetReport, type SessionLine } from "./review/budget.ts";
import { type Pair, pairsRequest, type Plant, plantedRequests } from "./review/calibrate.ts";
import { flagsOf, flagsReport, mergeFlags } from "./review/flags.ts";
import { type Indexed, todayTopics } from "./review/index-request.ts";
import { REVIEW_MODELS } from "./review/pipeline.ts";
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
const only = after("--rules");
const flagged = after("--flags");
const asked = (rule: string): boolean => only.length === 0 || only.includes(rule);
const perDay = Number(after("--per-day")[0] ?? 150);
const date = new Date().toISOString().slice(0, 10);
const yaml = async (path: string): Promise<unknown> => Bun.YAML.parse(await Bun.file(path).text());
await mkdir(REVIEW_DIR, { recursive: true });
const readSessions = async (): Promise<SessionLine[]> =>
  (await Bun.file(join(REVIEW_DIR, "sessions.jsonl")).text())
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as SessionLine);
// The latest saved session of a request on a model, with its findings.
const latest = (saved: SessionLine[], topic: string, language: string | null, model: string): Session | undefined => {
  const last = saved.findLast((l) => l.topic === topic && l.language === language && l.model === model);
  return last === undefined || typeof last.findings === "number" ? undefined : { ...last, findings: last.findings };
};

const rules = await catalog();
const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
const plants = (await yaml(join(LIBRARY_ROOT, "calibration", "questions.yaml"))) as Plant[];
// Today's topics of each course whose index holds a planted case, for IX-24.
const indexed = library.courses.filter(
  (c): c is Indexed => c.index !== undefined && plants.some((p) => p.file === "index" && p.topic === c.course),
);
const today = Object.fromEntries(
  await Promise.all(indexed.map(async (c) => [c.course, await todayTopics(c.course, c.index.data.source)] as const)),
);

if (flagged.length > 0) {
  const saved = await readSessions();
  const flags = plantedRequests(library, rules, plants, today).flatMap((p) =>
    models.flatMap((model) => {
      const last = latest(saved, `planted ${p.request.topic}`, p.request.language ?? null, model);
      return last === undefined ? [] : flagsOf(p, model, last.findings, flagged);
    }),
  );
  const merged = mergeFlags(flags, flagged);
  await Bun.write(join(REVIEW_DIR, "flags.md"), flagsReport(merged, rules, date));
  console.log(`build/review/flags.md: ${String(merged.length)} elements`);
} else if (!args.includes("--budget-only")) {
  const pairsDir = join(LIBRARY_ROOT, "calibration", "translations");
  const pairs = await Promise.all(
    (await readdir(pairsDir)).sort().map(async (f) => ({ language: f.slice(0, 2), pairs: (await yaml(join(pairsDir, f))) as Pair[] })),
  );
  const runner = runnerOf(claudeAttempt);
  const tallies: Tally[] = [];
  const lines: SessionLine[] = [];
  const saved = await readSessions();
  const run = async (request: Request, model: string, topic: string): Promise<Session> => {
    const language = request.language ?? null;
    if (args.includes("--retally")) {
      const last = latest(saved, topic, language, model);
      if (last === undefined) throw new Error(`no saved session of ${topic} ${language ?? "source"} on ${model}`);
      return last;
    }
    const session = await runner(request, model);
    lines.push({ topic, kind: request.kind, language, run: 1, ...session });
    return session;
  };
  const unplanted = only.filter((r) => r !== "RV-11" && !plants.some((p) => p.rule === r));
  if (unplanted.length > 0) throw new Error(`no planted case of ${unplanted.join(", ")} (library/calibration/questions.yaml)`);
  const planted = plantedRequests(library, rules, plants, today).filter((p) => p.plants.some((c) => asked(c.rule)));
  const pairsRun = asked("RV-11") ? pairs : [];
  for (const model of models) {
    await Promise.all(
      planted.map(async (p) =>
        tallies.push(...tally(model, p, await run(p.request, model, `planted ${p.request.topic}`)).filter((t) => asked(t.rule))),
      ),
    );
    await Promise.all(
      pairsRun.map(async (p) =>
        tallies.push(tallyPairs(model, p.pairs, await run(pairsRequest(p.language, p.pairs, rules), model, "calibration"))),
      ),
    );
    console.log(`${model}: ${String(planted.length + pairsRun.length)} sessions${args.includes("--retally") ? ", counted again" : ""}`);
  }
  const file = Bun.file(join(REVIEW_DIR, "calibration.json"));
  const before = (await file.exists()) ? ((await file.json()) as Tally[]) : [];
  const ran = new Set(tallies.map((t) => `${t.model} ${t.rule}`));
  const all = [...before.filter((t) => !ran.has(`${t.model} ${t.rule}`)), ...tallies];
  await Bun.write(file, JSON.stringify(all, null, 2));
  await Bun.write(join(REVIEW_DIR, "calibration.md"), calibrationReport(all, date));
  await appendFile(join(REVIEW_DIR, "sessions.jsonl"), lines.map((l) => `${JSON.stringify(l)}\n`).join(""));
}

if (flagged.length === 0) {
  const sessions = await readSessions();
  const tallies = (await Bun.file(join(REVIEW_DIR, "calibration.json")).json()) as Tally[];
  // The writing's tokens per topic, from the samples' files at about 3.5 characters a token: the files written, out;
  // the conventions, the catalog and the source a translator reads, in.
  const sizes = await Promise.all(
    (await Array.fromAsync(new Bun.Glob("*/*/*.yaml").scan({ cwd: SAMPLES_ROOT })))
      .filter((f) => !f.endsWith("/review.yaml"))
      .map(async (f) => ({
        f,
        n: (await Bun.file(join(SAMPLES_ROOT, f)).text()).length,
      })),
  );
  const topics = new Set(sizes.map((s) => s.f.split("/").slice(0, 2).join("/"))).size;
  const perFile = sizes.reduce((a, s) => a + s.n, 0) / sizes.length / 3.5;
  const conventions =
    ((await Bun.file(join(LIBRARY_ROOT, "CONVENTIONS.md")).text()).length +
      (await Bun.file(join(LIBRARY_ROOT, "RULES.md")).text()).length) /
    3.5;
  const writing = { output: Math.round((perFile * sizes.length) / topics / 3) * 12, input: Math.round((conventions + perFile) * 12) };
  await Bun.write(join(REVIEW_DIR, "budget.md"), budgetReport({ sessions, tallies, writing, perDay, models: REVIEW_MODELS }, date));
  console.log(`${join("build", "review")}: calibration.md, budget.md`);
}
