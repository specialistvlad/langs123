// Gate 4b check 13's tools: every planted case stands in a request that asks its rule, an index question's in a copy of
// its course's index; a session's findings tally as cases caught and sound elements flagged; the pairs tally per
// language, and the report follows.
import { expect, test } from "bun:test";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { typedLibrary } from "../v1/library.ts";
import { LIBRARY_ROOT, readLibrary, SAMPLES_ROOT } from "../v1/load.ts";
import { type Pair, pairsRequest, type Plant, plantedRequests } from "./calibrate.ts";
import type { Finding, Session } from "./run.ts";
import { calibrationReport, meets, summed, tally, tallyPairs } from "./tally.ts";

const catalog = await readRules(RULES_FILE);
const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
const plants = Bun.YAML.parse(await Bun.file(`${LIBRARY_ROOT}/calibration/questions.yaml`).text()) as Plant[];
const uk = Bun.YAML.parse(await Bun.file(`${LIBRARY_ROOT}/calibration/translations/uk.yaml`).text()) as Pair[];
const today = { en: [{ id: "en.tenses.simple-tenses", title: "Simple tenses" }] };
const session = (findings: Partial<Finding>[]): Session => ({
  session: "s",
  model: "m",
  findings: findings.map((f) => ({ rule: "", at: "", text: "", fix: "", confidence: "high", ...f })),
  tokens: { input: 1000, output: 200, cacheRead: 9000, cacheWrite: 0 },
  ms: 30000,
});

test("every planted case stands in a request that asks its rule, its text in place", () => {
  const planted = plantedRequests(library, catalog, plants, today);
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

test("an index question's case is planted in a copy of its course's index: a field set, a list, a dropped field", () => {
  const planted = plantedRequests(library, catalog, plants, today);
  const es = planted.find((p) => p.request.kind === "index" && p.request.topic === "es");
  expect(es?.request.asked).toEqual({ "IX-15": 1 });
  expect(es?.request.prompt).toContain("Palabras de lugar");
  expect(es?.request.prompt).toContain("Sobre (on)");
  expect(es?.text(undefined, "words-of-place")).toEqual(["Palabras de lugar", "En (in)", "Sobre (on)", "Bajo (under)"]);
  expect(es?.text(undefined, "nowhere")).toEqual([]);
  expect([...(es?.ids.values() ?? [])]).toEqual([["words-of-place"]]);
  const en = planted.find((p) => p.request.kind === "index" && p.request.topic === "en");
  expect(en?.request.asked).toEqual({ "IX-15": 1, "IX-24": 1 });
  expect(en?.request.prompt).toContain("asked of present-simple:");
  expect(en?.request.prompt).not.toContain("replaces: en.tenses.simple-tenses");
  expect(plantedRequests(library, catalog, plants).find((p) => p.request.topic === "en")?.request.asked).toEqual({ "IX-15": 1 });
  const missing: Plant = { rule: "IX-15", topic: "es", file: "index", at: "x", set: { id: "nowhere", field: "subject", text: "x" } };
  expect(() => plantedRequests(library, catalog, [missing])).toThrow("IX-15: the index of es holds no nowhere");
  expect(() => plantedRequests({ courses: [{ course: "es", dir: "d", topics: [] }] }, catalog, [missing])).toThrow(
    "IX-15: es has no index",
  );
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
      { rule: "SH-20", at: "def" },
    ]),
  );
  expect(tallies.find((t) => t.rule === "SH-20")).toMatchObject({ planted: 1, caught: 0, flagged: 0 });
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
