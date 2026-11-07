// The design swaps as a unit: the sample built in the proof design (tokens.proof.json) holds the same files and the same
// pages as in the default design, and its stylesheet differs only in the values of the variables the proof changes;
// the export carries the chosen design's level colours.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { exportLibrary } from "../../scripts/export/library.ts";
import { build } from "./build.ts";
import { SAMPLE } from "./sample.ts";
import { SITE_DIR, testSite } from "./test-site.ts";
import { designTokens, token } from "./tokens.ts";

const PROOF_DIR = `${SITE_DIR}-proof`;
await testSite();
await build({ outDir: PROOF_DIR, dev: false, siteUrl: "http://127.0.0.1", sample: SAMPLE, design: "proof" });

// The files of a built site, with each asset's hash taken out of its name.
const unhashed = (text: string): string => text.replace(/\b(style|levels|client)\.[0-9a-f]{10}\.(css|js)\b/g, "$1.$2");
const files = async (dir: string): Promise<string[]> =>
  (await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd: dir }))).filter((f) => unhashed(f) === f).sort();
const read = (dir: string, file: string): Promise<string> => Bun.file(join(dir, file)).text();

test("the proof design builds the same files, and every one but the stylesheet is the same", async () => {
  const names = await files(SITE_DIR);
  expect(await files(PROOF_DIR)).toEqual(names);
  const differ: string[] = [];
  for (const name of names.filter((n) => n !== "style.css")) {
    const [ours, proof] = await Promise.all([read(SITE_DIR, name), read(PROOF_DIR, name)]);
    if (unhashed(ours) !== unhashed(proof)) differ.push(name);
  }
  expect(differ).toEqual([]);
});

test("the proof's stylesheet differs only in the values of the variables it changes", async () => {
  const [ours, proof] = await Promise.all([read(SITE_DIR, "style.css"), read(PROOF_DIR, "style.css")]);
  const a = ours.split("\n");
  const b = proof.split("\n");
  expect(b.length).toBe(a.length);
  const declaration = /^\s*(--[\w-]+): .*;$/;
  const changed = a.flatMap((line, i) => {
    if (line === b[i]) return [];
    const variable = declaration.exec(line)?.[1];
    expect(variable).toBeDefined();
    expect(declaration.exec(b[i] ?? "")?.[1]).toBe(variable);
    return [variable];
  });
  // Each themed colour once on :root and twice for dark: the system's and the reader's choice.
  expect(changed.sort()).toEqual(
    [
      "--c-accent",
      "--c-accent",
      "--c-accent",
      "--c-level-a1-tint",
      "--c-level-a1-tint",
      "--c-level-a1-tint",
      "--r-12",
      "--s-16",
      "--t-body-size",
    ].sort(),
  );
});

test("the export carries the chosen design's level colours", async () => {
  const tint = async (design?: string): Promise<string | undefined> =>
    (await exportLibrary(["en.verbs.to-be"], design)).levels.find((l) => l.code === "A1")?.colors.light.tint;
  expect(await tint()).toBe(token("level-a1-tint", "light"));
  expect(await tint("proof")).toBe(token("level-a1-tint", "light", designTokens("proof").color.tokens));
  expect(await tint("proof")).not.toBe(await tint());
}, 30_000);
