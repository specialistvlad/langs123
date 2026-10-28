// The budget: each kind's sessions as the latest reviews and the calibration ran them, a topic's sessions and tokens at
// v1 with the stronger model's requests, each wave's, and per question the cheapest model at its target beside the
// model it runs on.
import { expect, test } from "bun:test";
import { budgetReport, latestRuns, type SessionLine, topicsPerLevel } from "./budget.ts";
import { REVIEW_MODELS } from "./pipeline.ts";
import { session } from "./stand-in.ts";

const line = (topic: string, kind: string, language: string | null, run: number, inTokens = 10000, only?: string[]): SessionLine => ({
  topic,
  kind,
  language,
  run,
  ...(only !== undefined && { only }),
  ...session([]),
  tokens: { input: inTokens, output: 2000, cacheRead: 0, cacheWrite: 0 },
  ms: 30000,
});

test("the latest runs of each request: a first run starts its review again", () => {
  const older = line("en.alphabet", "source", null, 1, 90000);
  const runs = [
    older,
    line("en.alphabet", "source", null, 2, 90000),
    line("en.alphabet", "source", null, 1),
    line("en.alphabet", "source", null, 2),
  ];
  expect(latestRuns([...runs, line("calibration", "language", "uk", 1)]).map((s) => s.tokens.input)).toEqual([10000, 10000]);
});

test("the budget counts each kind's sessions, a topic's with the stronger model's requests, each wave's and the model per question", () => {
  const sessions = [
    line("en.alphabet", "source", null, 1),
    line("en.alphabet", "source", null, 2),
    line("en.alphabet", "source", null, 1, 8000, ["FT-01"]),
    line("en.alphabet", "source", null, 2, 8000, ["FT-01"]),
    line("en.alphabet", "language", "uk", 1),
    line("en.alphabet", "language", "uk", 2),
    line("en.alphabet", "language", "ja", 1),
    line("calibration", "language", "uk", 1),
    line("planted en.alphabet", "source", null, 1),
  ];
  const tallies = [
    { model: "claude-haiku-5-5", rule: "RV-11", planted: 10, caught: 7, sound: 10, flagged: 0 },
    { model: "claude-sonnet-5-5", rule: "RV-11", planted: 10, caught: 10, sound: 10, flagged: 0 },
    { model: "claude-sonnet-5-5", rule: "FT-01", planted: 1, caught: 0, sound: 0, flagged: 0 },
  ];
  const input = { sessions, tallies, writing: { input: 400000, output: 60000 }, perDay: 150, models: REVIEW_MODELS };
  const report = budgetReport(input, "2026-11-02");
  expect(report).toContain("| source | 2 | 10k | 2k | 30 s |");
  expect(report).toContain("| source, FT-01 alone | 2 | 8k |");
  expect(report).toContain("| calibration | 2 |");
  expect(report).toContain("The latest review of each sample ran 7 sessions over 1 topics, about 66k tokens in per topic");
  expect(report).toContain(
    "takes 20.5 sessions: its source request twice, the request of the stronger model's rules twice, and its 11 language files once each and again 50% of the time, as the samples ran; about 201k tokens in",
  );
  expect(report).toContain("| RV-11 | claude-sonnet-5-5 | claude-sonnet-5-5 |");
  expect(report).toContain("| FT-01 | none yet | claude-opus-5-5 |");
  expect(report).toMatch(/\| A0 \| 111 \|/);
  expect(topicsPerLevel({ en: 120, fr: 45 })).toMatchObject({ A0: 32, B1: 17, C2: 17 });
  const empty = budgetReport({ ...input, sessions: [], tallies: [], models: { model: "m" } }, "d");
  expect(empty).toContain("its source request twice, and its 11 language files once each and again 0% of the time");
  expect(empty).toContain("over 0 topics, about 0k tokens in per topic");
});
