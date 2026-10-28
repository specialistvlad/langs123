// The YAML writer: every file of the samples and the fixture reads back as the value it was written from, in the
// samples' style: short maps in flow style, lists of maps in block style, strings quoted only where they need it.
import { expect, test } from "bun:test";
import { files } from "./fixture.ts";
import { headerOf, toYaml } from "./yaml.ts";

test("every sample file and every fixture file reads back as written", async () => {
  const values: { header: string; data: object }[] = [];
  for await (const path of new Bun.Glob("library/samples/**/*.yaml").scan({ cwd: `${import.meta.dir}/../..` })) {
    const text = await Bun.file(`${import.meta.dir}/../../${path}`).text();
    values.push({ header: headerOf(text), data: Bun.YAML.parse(text) as object });
  }
  const f = files();
  for (const c of f.courses) {
    values.push(
      { header: "", data: c.index?.data as object },
      ...c.topics.flatMap((t) => [t.source, ...t.languages].map((d) => ({ header: "", data: d?.data as object }))),
    );
  }
  expect(values.length).toBeGreaterThan(12);
  for (const { header, data } of values) {
    const text = toYaml(data, header);
    expect(text.startsWith(header)).toBe(true);
    expect(Bun.YAML.parse(text)).toEqual(data);
  }
});

test("a string is quoted where YAML would read it otherwise", () => {
  const value = {
    plain: "The letters",
    special: ["true", "no", "12", "1e3", "2026-10-28", "", " lead", "trail ", "a: b", "a #b", "end:", "-x", "{target x}", "two\nlines"],
    numbers: [1, 2.5, true, null],
    flow: { comma: "a, b" },
  };
  const text = toYaml(value);
  expect(Bun.YAML.parse(text)).toEqual(value);
  expect(text).toContain("plain: The letters\n");
  expect(text).toContain('flow: { comma: "a, b" }');
  expect(toYaml({ empty: {}, list: [], deep: [{ a: 1 }] })).toBe("empty: {}\nlist: []\ndeep:\n  - { a: 1 }\n");
  expect(toYaml({ long: "x".repeat(150), nested: { list: ["y".repeat(70), "z".repeat(70)] } })).toBe(
    `long: ${"x".repeat(150)}\nnested:\n  list:\n    - ${"y".repeat(70)}\n    - ${"z".repeat(70)}\n`,
  );
});

test("headerOf keeps the comment lines a file opens with", () => {
  expect(headerOf("# one\n# two\nid: x\n# not this\n")).toBe("# one\n# two\n");
  expect(headerOf("id: x\n")).toBe("");
});
