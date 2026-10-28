// Gate 4b check 13's tools: every planted case stands in a request that asks its rule; a session's findings tally as
// cases caught and sound elements flagged; the pairs tally per language; the report and the budget follow.
import { expect, test } from "bun:test";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { typedLibrary } from "../v1/library.ts";
import { LIBRARY_ROOT, readLibrary, SAMPLES_ROOT } from "../v1/load.ts";
import { budgetReport, type SessionLine, topicsPerLevel } from "./budget.ts";
import { type Pair, pairsRequest, type Plant, plantedRequests } from "./calibrate.ts";
import type { Finding, Session } from "./run.ts";
import { calibrationReport, meets, summed, tally, tallyPairs } from "./tally.ts";

const catalog = await readRules(RULES_FILE);
const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
const plants = Bun.YAML.parse(await Bun.file(`${LIBRARY_ROOT}/calibration/questions.yaml`).text()) as Plant[];
const uk = Bun.YAML.parse(await Bun.file(`${LIBRARY_ROOT}/calibration/translations/uk.yaml`).text()) as Pair[];
const session = (findings: Partial<Finding>[]): Session => ({
  session: "s",
  model: "m",
  findings: findings.map((f) => ({ rule: "", at: "", text: "", fix: "", confidence: "high", ...f })),
  tokens: { input: 1000, output: 200, cacheRead: 9000, cacheWrite: 0 },
  ms: 30000,
});

test("every planted case stands in a request that asks its rule, its text in place", () => {
  const planted = plantedRequests(library, catalog, plants);
  expect(planted.flatMap((p) => p.plants)).toHaveLength(plants.length);
  for (const p of planted) for (const c of p.plants) expect([c.rule, p.request.asked[c.rule] !== undefined]).toEqual([c.rule, true]);
  const source = planted.find((p) => p.request.topic === "en.alphabet" && p.request.language === undefined);
  expect(source?.request.prompt).toContain("The 26 letters of the English alphabet and their names");
  const de = planted.find((p) => p.request.language === "de");
  expect(de?.request.prompt).toContain("Merken Sie sich");
  expect(planted.find((p) => p.request.language === "uk")?.request.prompt).toContain("Українське {l1 uk під} — це {term under}.");
  const ft01 = planted.flatMap((p) => [...p.ids].filter(([c]) => c.rule === "FT-01").map(([, ids]) => ids))[0];
  expect(ft01).toContain("spelling.list");
  expect(ft01).toContain("spelling.have");
  expect(() =>
    plantedRequests(library, catalog, [
      { rule: "SH-04", topic: "en.alphabet", file: "source", at: "def", set: { id: "nowhere", text: "x" } },
    ]),
  ).toThrow("en.alphabet holds no nowhere");
});

test("a session's findings tally as planted cases caught and sound elements flagged", () => {
  const planted = plantedRequests(library, catalog, plants).find(
    (p) => p.request.topic === "en.alphabet" && p.request.language === undefined,
  );
  if (planted === undefined) throw new Error("no planted alphabet");
  const tallies = tally(
    "m",
    planted,
    session([
      { rule: "SH-04", at: "def" },
      { rule: "VO-02", at: "names-ee.fact.1" },
      { rule: "SH-17", at: "names-ei.fact.1" },
      { rule: "SH-17", at: "names-ei.fact.1" },
    ]),
  );
  expect(tallies.find((t) => t.rule === "SH-17")).toMatchObject({ planted: 1, caught: 1, flagged: 0 });
  expect(tallies.find((t) => t.rule === "SH-04")).toEqual({ model: "m", rule: "SH-04", planted: 1, caught: 1, sound: 0, flagged: 0 });
  expect(tallies.find((t) => t.rule === "VO-02")).toMatchObject({ planted: 1, caught: 0, flagged: 1 });
  expect(meets({ model: "m", rule: "SH-04", planted: 1, caught: 1, sound: 0, flagged: 0 })).toBe(true);
  expect(meets({ model: "m", rule: "VO-02", planted: 1, caught: 0, sound: 40, flagged: 1 })).toBe(false);
  expect(meets({ model: "m", rule: "VO-02", planted: 0, caught: 0, sound: 10, flagged: 2 })).toBe(false);
});

test("the pairs of a language tally against their planted mistakes", () => {
  const request = pairsRequest("uk", uk, catalog);
  expect(request.asked).toEqual({ "RV-11": 20 });
  expect(request.prompt).toContain("p20:");
  const planted = uk.flatMap((p, n) => (p.faithful ? [] : [`p${String(n + 1)}`]));
  const faithful = uk.flatMap((p, n) => (p.faithful ? [`p${String(n + 1)}`] : []));
  const all = tallyPairs("m", uk, session([...planted.slice(1), ...faithful.slice(0, 1)].map((at) => ({ rule: "RV-11", at }))));
  expect(all).toEqual({ model: "m", rule: "RV-11", planted: 10, caught: 9, sound: 10, flagged: 1 });
  expect(summed([all, all])).toEqual([{ ...all, planted: 20, caught: 18, sound: 20, flagged: 2 }]);
  const report = calibrationReport([all, { ...all, model: "h", caught: 10, flagged: 0 }], "2026-11-02");
  expect(report).toContain("## m\n\n| Rule | Planted caught | Sound flagged | Target |");
  expect(report).toContain("| RV-11 | 9/10 (90%) | 1/10 (10%) | met |");
  expect(report).toContain("| RV-11 | 10/10 (100%) | 0/10 (0%) | met |");
  expect(calibrationReport([{ ...all, planted: 0, caught: 0, sound: 0 }], "d")).toContain("| RV-11 | — | — | met |");
});

test("the budget counts each kind's sessions, a topic's, each wave's and the cheapest model per question", () => {
  const line = (topic: string, kind: string, language: string | null, run: number): SessionLine => ({
    topic,
    kind,
    language,
    run,
    ...session([]),
  });
  const sessions = [
    line("en.alphabet", "source", null, 1),
    line("en.alphabet", "source", null, 2),
    line("en.alphabet", "language", "uk", 1),
    line("en.alphabet", "language", "uk", 2),
    line("en.alphabet", "language", "ja", 1),
    line("calibration", "language", "uk", 1),
    line("planted en.alphabet", "source", null, 1),
  ];
  const tallies = [
    { model: "claude-haiku-5-5", rule: "RV-11", planted: 10, caught: 7, sound: 10, flagged: 0 },
    { model: "claude-sonnet-5-5", rule: "RV-11", planted: 10, caught: 10, sound: 10, flagged: 0 },
    { model: "claude-sonnet-5-5", rule: "SH-04", planted: 1, caught: 0, sound: 0, flagged: 0 },
  ];
  const report = budgetReport({ sessions, tallies, writing: { input: 400000, output: 60000 }, perDay: 150 }, "2026-11-02");
  expect(report).toContain("| source | 3 | 10k | 0k | 30 s |");
  expect(report).toContain("| calibration | 1 |");
  expect(report).toContain("its source twice, and its 11 language files once each and again 50% of the time");
  expect(report).toContain("| RV-11 | claude-sonnet-5-5 |");
  expect(report).toContain("| SH-04 | none yet |");
  expect(report).toMatch(/\| A0 \| 111 \|/);
  expect(topicsPerLevel({ en: 120, fr: 45 })).toMatchObject({ A0: 32, B1: 17, C2: 17 });
  expect(budgetReport({ sessions: [], tallies: [], writing: { input: 0, output: 0 }, perDay: 150 }, "d")).toContain("again 0% of the time");
});
