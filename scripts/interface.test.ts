// interface.yaml holds the wording apps show: every key of its text and counts is one the web app or the
// export asks for, or one the export carries for other programs built on the library.
import { expect, test } from "bun:test";
import { Glob } from "bun";
import { join } from "node:path";
import { INTERFACE, ROOT } from "./lib.ts";

// Wording the export carries for programs built on the library, which the web app shows nowhere.
const FOR_PROGRAMS = ["tagline"];

// Wording no app asks for any more, waiting for languages/interface.yaml to drop it; each entry goes with its key.
const RETIRED = [
  "read",
  "readNote",
  "grouping",
  "resizeList",
  "chooseLanguage",
  "trackIntro",
  "pathIntro",
  "onThisPage",
  "matrixExplained",
];

const SOURCES = ["apps/**/*.ts", "scripts/**/*.ts"]
  .flatMap((pattern) => [...new Glob(pattern).scanSync(ROOT)])
  .filter((file) => !/\.(test|e2e)\.ts$/.test(file) && !file.startsWith("scripts/generated/"));
const code = (await Promise.all(SOURCES.map((file) => Bun.file(join(ROOT, file)).text()))).join("\n");
const asked = (key: string): boolean => ["'", '"', "`"].some((q) => code.includes(`${q}${key}${q}`));

test("every key of interface.yaml's text and counts is one an app asks for", () => {
  const keys = [...Object.keys(INTERFACE.text), ...Object.keys(INTERFACE.counts)];
  expect(keys.filter((key) => !asked(key) && !FOR_PROGRAMS.includes(key) && !RETIRED.includes(key))).toEqual([]);
});

test("the wording kept for programs is wording the web app shows nowhere", () => {
  expect(FOR_PROGRAMS.filter(asked)).toEqual([]);
});

test("the retired wording is still in interface.yaml and asked for nowhere", () => {
  const keys = [...Object.keys(INTERFACE.text), ...Object.keys(INTERFACE.counts)];
  expect(RETIRED.filter((key) => !keys.includes(key) || asked(key))).toEqual([]);
});
