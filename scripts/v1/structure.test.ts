// The library's layout: each written case of IX-01, IX-03, IX-04, IX-26, LA-01, LA-05, LA-06 and LA-09 is named.
import { expect, test } from "bun:test";
import { catalog, checkFiles } from "./check.ts";
import { files } from "./fixture.ts";
import type { LibraryFiles } from "./load.ts";
import type { Problem } from "./schema.ts";

const rules = await catalog();
const check = (change: (f: LibraryFiles) => void): Problem[] => {
  const copy = files();
  change(copy);
  return checkFiles(copy, rules).problems;
};
// The fixture's parts, typed loosely for the changes each test makes.
interface Loose {
  course: string;
  sections: { id: string; topics: { id: string }[] }[];
}
const index = (f: LibraryFiles): Loose => f.courses[0]?.index?.data as Loose;
const topic = (f: LibraryFiles): NonNullable<LibraryFiles["courses"][number]["topics"][number]> => f.courses[0]?.topics[0] as never;
const said = (problems: Problem[]): string[] => problems.map((p) => [p.rule, p.id, p.message].filter((x) => x !== undefined).join(" "));

test("the fixture's layout holds", () => {
  expect(check(() => undefined)).toEqual([]);
});

test("IX-01: a course has its index, naming its own folder", () => {
  expect(said(check((f) => Reflect.deleteProperty(f.courses[0] ?? {}, "index")))).toEqual(["IX-01 the course has no index.yaml"]);
  expect(said(check((f) => (index(f).course = "de")))).toEqual(["IX-01 the index names course de in the folder of en"]);
});

test("IX-26: section and topic ids are unique in the course", () => {
  const twice = check((f) => {
    index(f).sections.push(...structuredClone(index(f).sections));
  });
  expect(said(twice)).toEqual(["IX-26 foundations two sections share this id", "IX-26 letters two topics share this id"]);
});

test("IX-03 and IX-04: a topic sits in its course's index, and its id names its folder", () => {
  expect(said(check((f) => (topic(f).slug = "names")))).toEqual([
    "IX-03 no section of library/en/index.yaml lists the topic names",
    "IX-04 the topic's id is en.letters; its folder makes it en.names",
  ]);
});

test("LA-01 and LA-09: a language file names its own language, and none holds the source language", () => {
  const en = check((f) => {
    const [uk] = topic(f).languages;
    topic(f).languages.push({ file: "library/en/letters/en.yaml", data: { ...(uk?.data as object), language: "en", blocks: [] } });
  });
  expect(said(en).filter((p) => !p.startsWith("FT-07"))).toEqual(["LA-09 en is the course's source language, which source.yaml holds"]);
  const misnamed = check((f) => Object.assign(topic(f).languages[0] ?? {}, { file: "library/en/letters/ja.yaml" }));
  expect(said(misnamed)).toEqual(["LA-01 the file of ja names the language uk"]);
});

test("LA-05 and LA-06: an own id starts with its language, and every id names one element", () => {
  const own = check((f) => {
    const uk = topic(f).languages[0]?.data as { blocks: { id: string }[] };
    (uk.blocks[0] as { id: string }).id = "names.fact.uk";
  });
  expect(said(own)).toEqual(["LA-05 names.fact.uk an id of the language's own text starts with uk."]);
  const twice = check((f) => {
    const source = topic(f).source?.data as { errors: { id: string }[] };
    (source.errors[1] as { id: string }).id = "err.a";
  });
  expect(said(twice)).toEqual(["LA-06 err.a two elements of the topic share this id"]);
});
