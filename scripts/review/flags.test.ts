// The flags for the owner: an element's text in its request, a session's flags outside the planted cases, one flag per
// element with every model's finding, and the report naming the labels' shape.
import { expect, test } from "bun:test";
import { readRules, RULES_FILE } from "../rule-catalog.ts";
import { typedLibrary } from "../v1/library.ts";
import { LIBRARY_ROOT, readLibrary, SAMPLES_ROOT } from "../v1/load.ts";
import { type Plant, plantedRequests } from "./calibrate.ts";
import { elementText, type Flag, flagsOf, flagsReport, mergeFlags } from "./flags.ts";
import type { Finding } from "./run.ts";

const catalog = await readRules(RULES_FILE);
const { library } = typedLibrary(await readLibrary(SAMPLES_ROOT));
const plants = Bun.YAML.parse(await Bun.file(`${LIBRARY_ROOT}/calibration/questions.yaml`).text()) as Plant[];
const planted = plantedRequests(library, catalog, plants);
const finding = (rule: string, at: string, text = "Found."): Finding => ({ rule, at, text, fix: "", confidence: "high" });

test("an element's text: the source's sentences or block, a language's translations and its own blocks", () => {
  const ja = planted.find((p) => p.request.topic === "en.present-simple" && p.request.language === "ja")?.topic;
  if (ja === undefined) throw new Error("no planted ja request");
  expect(elementText(ja, undefined, "states.fact")[0]).toContain("Verbs of states");
  expect(elementText(ja, "ja", "states.fact.1")[0]).toContain("状態を表す動詞");
  expect(elementText(ja, "ja", "ja.forms.fact").length).toBeGreaterThan(0);
  expect(elementText(ja, "ja", "nowhere")).toEqual([]);
});

test("a session's flags leave the planted cases and the other rules out, and a language's flag on the source's text is the source's", () => {
  const vi = planted.find((p) => p.request.language === "vi");
  if (vi === undefined) throw new Error("no planted vi request");
  const flags = flagsOf(
    vi,
    "m",
    [finding("ST-02", "names-o-r.fact"), finding("SH-20", "names-u.why.1"), finding("SH-04", "def")],
    ["ST-02", "SH-20"],
  );
  expect(flags.map((f) => [f.rule, f.language, f.at])).toEqual([["ST-02", "source", "names-o-r.fact"]]);
  expect(flags[0]?.text[0]).toContain("Three letters have names");
});

const flag = (rule: string, at: string, model: string, text: string[] = ["A text."]): Flag => ({
  rule,
  topic: "en.alphabet",
  language: "source",
  at,
  text,
  findings: [{ model, request: "source", at, text: `${model} found it.` }],
});

test("one flag per rule and element, with every model's finding, in the rules' order; the report names the labels' shape", () => {
  const merged = mergeFlags(
    [
      flag("SH-19", "a.why", "m"),
      flag("ST-02", "a.fact", "m", ["A text.", "Another."]),
      flag("ST-02", "a.fact", "o", ["A text.", "Another."]),
      flag("ST-02", "a.fact.1", "m"),
      { ...flag("ST-02", "b.fact", "m", ["B text."]), findings: [{ model: "m", request: "vi", at: "b.fact", text: "Seen in vi." }] },
      flag("ST-02", "c.fact.1", "m", ["C text."]),
      flag("ST-02", "c.fact", "o", ["C text."]),
    ],
    ["ST-02", "SH-19"],
  );
  expect(merged.map((f) => [f.rule, f.at, f.findings.length])).toEqual([
    ["ST-02", "a.fact", 3],
    ["ST-02", "b.fact", 1],
    ["ST-02", "c.fact", 2],
    ["SH-19", "a.why", 1],
  ]);
  const report = flagsReport([...merged, flag("XX-99", "b", "m", [])], catalog, "2026-10-28");
  expect(report).toContain("- { rule: ST-02, topic: en.alphabet, language: source, at: a.fact, breaks: true }");
  const st02 = catalog.rules.find((r) => r.id === "ST-02");
  expect(report).toContain(`## ST-02 ${st02?.name ?? ""}\n\nRule: ${st02?.fields.rule ?? ""}`);
  expect(report).toContain(
    "> A text.\n> Another.\n\n- m: m found it.\n- o: o found it.\n- m (at `a.fact.1`): m found it.\n\n```yaml\n- { rule: ST-02, topic: en.alphabet, language: source, at: a.fact, breaks: }",
  );
  expect(report).toContain("- m (vi request): Seen in vi.");
  expect(report).toContain("## XX-99\n\nRule: \n\n### en.alphabet, source: `b`\n\n> (the request holds no element of this id)");
  expect(flagsReport([], catalog, "d")).toContain("at: cosas.fact.1, breaks: true }");
});
