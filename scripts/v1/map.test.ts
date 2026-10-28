// Gate 4a check 8: the presentation map holds both ways over the library's schema, and over its export's; a type
// without its component, a component the map lacks, and a component no type names are each found.
import { expect, test } from "bun:test";
import { mapped, mapProblems } from "./map.ts";
import { SCHEMA } from "./schema.ts";

const EXPORT = (await Bun.file(`${import.meta.dir}/../../library/schema/export.schema.json`).json()) as {
  definitions: Record<string, object>;
};

test("every data type has its component, and every component shows a type", () => {
  expect(mapProblems(SCHEMA as never)).toEqual({ unmapped: [], unknown: [], unused: [] });
  const types = new Map(mapped(SCHEMA as never).map((m) => [m.type, m.components]));
  expect(types.get("table")).toEqual(["R5"]);
  expect(types.get("index.varieties")).toEqual(["Variety control"]);
  expect(types.get("language.fingerprints")).toEqual(["build"]);
  expect(types.get("{kanji}")).toEqual(["R8"]);
});

test("the export's parts name the components that show them", () => {
  const shown = new Set(mapped(EXPORT as never).flatMap((m) => m.components));
  for (const c of ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R9", "I1"]) expect(shown.has(c)).toBe(true);
});

test("a type without its component, one the map lacks, and an unused component are each named", () => {
  const planted = {
    definitions: {
      lone: { type: "string" },
      odd: { "x-component": "R10", properties: { own: { type: "string" }, kept: { $ref: "#/definitions/lone" } } },
    },
  };
  expect(mapProblems(planted as never)).toEqual({
    unmapped: ["lone"],
    unknown: ["odd: R10", "odd.own: R10"],
    unused: ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R9", "I1", "Variety control", "build"],
  });
});
