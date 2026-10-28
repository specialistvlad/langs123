// The samples' conversion: each change of the M4 study's list, a second run that changes nothing, and the samples
// converted in a copy of their folder holding the schema, the layout and the alignment, the lint naming only the
// marks content writes.
import { afterAll, expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkRoot } from "./check.ts";
import { convertSource, sampleIndex } from "./convert.ts";
import { convertSamples } from "./convert-samples.ts";
import { SAMPLES_ROOT } from "./load.ts";

const OLD = {
  id: "es.pronouns",
  course: "es",
  source: "es",
  status: "draft",
  essence: [
    { id: "ess.a", to: "names", letter: "A", small: "a", name: "eɪ" },
    { id: "ess.yo", to: "names", word: "yo", text: "quien habla" },
  ],
  subtopics: [
    {
      id: "names",
      level: "A1",
      title: { id: "names.title", text: "Las personas" },
      blocks: [
        { id: "names.list", type: "list", items: [{ id: "names.b", letter: "B", name: "biː", ex: { id: "ex.b", text: "{target b}" } }] },
        {
          id: "names.table",
          type: "table",
          axes: ["persona", "número"],
          columns: [
            { id: "c.p", key: "persona", text: "Persona" },
            { id: "c.s", key: "singular", text: "Singular" },
            { id: "c.p2", key: "plural", text: "Plural" },
          ],
          rows: [
            {
              id: "r.2",
              features: { person: 2 },
              persona: { id: "r.2.name", text: "segunda" },
              singular: ["tú"],
              plural: ["{variant es-419 ustedes}", "{variant es-ES vosotros}"],
            },
            { id: "r.3", features: { person: 3 }, persona: "él" },
          ],
        },
      ],
    },
  ],
  errors: [
    {
      id: "err.w",
      in: "names",
      wrong: "W {term double v}",
      right: "W {term double u}",
      rule: { id: "err.w.rule", text: "x" },
      speakers: {},
    },
  ],
};

test("the source takes the new shape: items, typed axes, cells, variety forms, plain forms, and no course or source", () => {
  const converted = convertSource(structuredClone(OLD));
  expect(Object.keys(converted)).toEqual(["id", "status", "essence", "subtopics", "errors"]);
  expect(converted["essence"]).toEqual([
    { id: "ess.a", to: "names", form: ["A", "a"], ipa: "eɪ" },
    { id: "ess.yo", to: "names", form: "yo", text: "quien habla" },
  ]);
  const [list, table] = (converted["subtopics"] as { blocks: Record<string, unknown>[] }[])[0]?.blocks ?? [];
  expect((list?.["items"] as unknown[])[0]).toEqual({ id: "names.b", form: "B", ipa: "biː", ex: { id: "ex.b", text: "{target b}" } });
  expect(table?.["axes"]).toEqual({ rows: "person", columns: "number" });
  expect((table?.["columns"] as { key: string }[]).map((c) => c.key)).toEqual(["person", "sg", "pl"]);
  expect(table?.["rows"]).toEqual([
    {
      id: "r.2",
      features: { person: 2 },
      cells: {
        person: { id: "r.2.name", text: "segunda" },
        sg: ["tú"],
        pl: [
          { form: "ustedes", variety: "es-419" },
          { form: "vosotros", variety: "es-ES" },
        ],
      },
    },
    { id: "r.3", features: { person: 3 }, cells: { person: "él" } },
  ]);
  expect((converted["errors"] as Record<string, unknown>[])[0]).toMatchObject({ wrong: "W double v", right: "W double u" });
  expect(convertSource(converted)).toEqual(converted);
});

test("a course's index holds its samples in order, each placed at its levels", () => {
  const sample = (slug: string, levels: string[]) => ({
    slug,
    source: { id: `en.${slug}`, subtopics: levels.map((level, n) => ({ level, title: { id: `s${n}` } })) },
    english: (id: string) => `English of ${id}`,
  });
  const index = sampleIndex("en", { en: "English" }, ["en-GB", "en-US"], { en: "Topics" }, [
    sample("alphabet", ["A0"]),
    sample("present-simple", ["A1", "A0"]),
  ]);
  expect(index).toMatchObject({ course: "en", source: "en", varieties: ["en-GB", "en-US"], status: "draft", sources: [] });
  const topics = (index["sections"] as { topics: Record<string, unknown>[] }[])[0]?.topics;
  expect(topics).toEqual([
    {
      id: "alphabet",
      subject: "English of title",
      covers: ["English of s0"],
      path: { A0: 1 },
      status: "draft",
      replaces: "en.foundations.alphabet-spelling",
      script: "alphabet",
    },
    {
      id: "present-simple",
      subject: "English of title",
      covers: ["English of s0", "English of s1"],
      path: { A0: 2, A1: 1 },
      status: "draft",
      replaces: "en.tenses.simple-tenses",
    },
  ]);
  expect(sampleIndex("xx", {}, undefined, {}, [])).not.toHaveProperty("varieties");
});

const scratch = await mkdtemp(join(tmpdir(), "samples-"));
afterAll(async () => {
  await rm(scratch, { recursive: true });
});

test("the four samples convert, and hold the schema, the layout and the alignment; the lint names only content's marks", async () => {
  const root = join(scratch, "samples");
  await cp(SAMPLES_ROOT, root, { recursive: true });
  expect(await convertSamples(root)).toEqual([
    "en/index.yaml",
    "en/alphabet",
    "en/words-of-place",
    "en/present-simple",
    "es/index.yaml",
    "es/subject-pronouns",
  ]);
  const { library, problems } = await checkRoot(root);
  expect(library.courses.map((c) => [c.course, c.topics.length])).toEqual([
    ["en", 3],
    ["es", 1],
  ]);
  expect([...new Set(problems.map((p) => p.rule))].filter((r) => !["NO-08", "NO-29", "NO-35", "NO-36"].includes(r ?? ""))).toEqual([]);
  const again = await Bun.file(join(root, "en", "present-simple", "source.yaml")).text();
  await convertSamples(root);
  expect(await Bun.file(join(root, "en", "present-simple", "source.yaml")).text()).toBe(again);
});
