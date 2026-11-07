// The owner's labels: read from their file, each with its rule, element and verdict; a flag labelled as breaking
// leaves the sound elements and the false alarms when the saved sessions are counted again.
import { afterAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { typedLibrary } from "../v1/library.ts";
import { LIBRARY_ROOT, readLibrary, SAMPLES_ROOT } from "../v1/load.ts";
import { type Plant, plantedRequests } from "./calibrate.ts";
import { labelledTally, readLabels } from "./labels.ts";
import type { Finding, Session } from "./run.ts";
import { calibrationReport, tally } from "./tally.ts";

const catalog = await readRules(RULES_FILE);
const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
const plants = Bun.YAML.parse(await Bun.file(`${LIBRARY_ROOT}/calibration/questions.yaml`).text()) as Plant[];
const scratch = await mkdtemp(join(tmpdir(), "labels-"));
afterAll(async () => {
  await rm(scratch, { recursive: true });
});
const session = (findings: Partial<Finding>[]): Session => ({
  session: "s",
  model: "m",
  findings: findings.map((f) => ({ rule: "ST-02", at: "", text: "", fix: "", confidence: "high", ...f })),
  tokens: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
  ms: 1,
});

test("the labels are read from their file, each whole", async () => {
  const file = join(scratch, "labels.yaml");
  await Bun.write(file, "- { rule: ST-02, topic: es.subject-pronouns, language: source, at: tu-usted.fact, breaks: true }\n");
  expect(await readLabels(file)).toEqual([
    { rule: "ST-02", topic: "es.subject-pronouns", language: "source", at: "tu-usted.fact", breaks: true },
  ]);
  const bad = [
    ["- { rule: ST-02, topic: es.subject-pronouns, at: tu-usted.fact, breaks: true }\n", "label 1 lacks language"],
    [
      "- { rule: ST-02, topic: es.subject-pronouns, language: source, at: tu-usted.fact, breaks: yes }\n",
      "label 1 lacks breaks true or false",
    ],
    ["rule: ST-02\n", "holds a list of labels"],
  ] as const;
  for (const [n, [text, message]] of bad.entries()) {
    const one = join(scratch, `bad${String(n)}.yaml`);
    await Bun.write(one, text);
    expect(readLabels(one)).rejects.toThrow(message);
  }
});

test("a flag labelled as breaking leaves the sound elements and the false alarms; one labelled false, or unlabelled, stays", () => {
  const planted = plantedRequests(library, catalog, plants).find(
    (p) => p.request.topic === "es.subject-pronouns" && p.request.language === undefined,
  );
  if (planted === undefined) throw new Error("the Spanish sample's planted source request");
  const found = session([{ at: "cosas.fact.1" }, { at: "tu-usted.fact" }, { at: "personas.fact" }, { at: "genero.fact" }]);
  const plain = tally("m", planted, found).find((t) => t.rule === "ST-02");
  expect(plain).toMatchObject({ planted: 1, caught: 1, flagged: 3 });
  const labels = [
    { rule: "ST-02", topic: "es.subject-pronouns", language: "source", at: "tu-usted.fact", breaks: true },
    { rule: "ST-02", topic: "es.subject-pronouns", language: "source", at: "personas.fact", breaks: false },
    { rule: "SH-19", topic: "es.subject-pronouns", language: "source", at: "genero.fact", breaks: true },
  ];
  const counted = labelledTally("m", planted, found, ["ST-02"], labels).find((t) => t.rule === "ST-02");
  expect(counted).toMatchObject({ planted: 1, caught: 1, flagged: 2, sound: (plain?.sound ?? 0) - 1 });
  expect(labelledTally("m", planted, found, ["SH-19"], labels).find((t) => t.rule === "ST-02")).toEqual(plain);
  const report = calibrationReport(
    [counted ?? { model: "m", rule: "ST-02", planted: 0, caught: 0, sound: 0, flagged: 0 }],
    "d",
    "Labels: 3 from a file.",
  );
  expect(report).toContain("Sound elements are those of the samples the question reads.\n\nLabels: 3 from a file.");
  expect(calibrationReport([], "d")).toContain("the owner's labels to come.");
});
