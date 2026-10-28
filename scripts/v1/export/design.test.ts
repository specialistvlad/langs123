// The design in the export: every colour token in each theme as #rrggbb or #rrggbbaa, every type style with its size,
// line height and tracking in its unit, the design the export names carried through, and the library file holding it.
import { expect, test } from "bun:test";
import Ajv from "ajv";
import { token } from "../../../apps/web/tokens.ts";
import { fixture } from "../fixture.ts";
import { typedLibrary } from "../library.ts";
import { colourOf, designOf } from "./design.ts";
import { exportCourses } from "./library.ts";

const SCHEMA = (await Bun.file(`${import.meta.dir}/../../../library/schema/export.schema.json`).json()) as object;
const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, discriminator: true });
ajv.addVocabulary(["x-component"]);
ajv.addSchema(SCHEMA);

test("a colour reads as #rrggbb, or #rrggbbaa where it is translucent", () => {
  expect(colourOf("#ABC")).toBe("#aabbcc");
  expect(colourOf("#1D1D1F")).toBe("#1d1d1f");
  expect(colourOf("#11223344")).toBe("#11223344");
  expect(colourOf("rgba(47, 91, 211, 0.35)")).toBe("#2f5bd359");
  expect(colourOf("rgb(1,2,3)")).toBe("#010203");
  expect(() => colourOf("blue")).toThrow("a colour the export can't read: blue");
});

test("the design carries every colour token in both themes and every type style in its unit", () => {
  const design = designOf();
  expect(ajv.validate("export.schema.json#/definitions/design", design)).toBe(true);
  expect(design.name).toBe("default");
  expect(design.colours.find((c) => c.name === "accent-soft")).toEqual({
    name: "accent-soft",
    light: token("accent-soft", "light"),
    dark: token("accent-soft", "dark"),
  });
  expect(design.colours.find((c) => c.name === "accent-line")).toEqual({ name: "accent-line", light: "#2f5bd359", dark: "#7ea2ff73" });
  const style = (name: string): object | undefined => design.type.find((s) => s.name === name);
  expect(style("reading-body")).toEqual({
    name: "reading-body",
    group: "Reading",
    family: "sans",
    size: 17,
    unit: "px",
    lineHeight: 25,
    tracking: -0.425,
    weight: 400,
  });
  expect(style("topic-title")).toMatchObject({ size: 38, lineHeight: 43.7, tracking: -0.95, weight: 650 });
  expect(style("row-title")).toMatchObject({ lineHeight: 22, tracking: -0.43 });
  expect(style("ipa")).toEqual({ name: "ipa", group: "Topic", family: "sans", size: 0.88, unit: "em", tracking: -0.018, weight: 400 });
  expect(style("print-body")).toMatchObject({ family: "print", size: 11, unit: "pt", tracking: 0 });
});

test("the export carries the design it names, the default when it names none", () => {
  const proof = designOf("proof");
  expect(proof.name).toBe("proof");
  expect(proof.colours.find((c) => c.name === "accent")).not.toEqual(designOf().colours.find((c) => c.name === "accent"));
  const library = typedLibrary(fixture().files).library;
  expect(exportCourses(library).library.design.name).toBe("default");
  expect(exportCourses(library, { design: "proof" }).library.design).toEqual(proof);
  expect(() => designOf("nowhere")).toThrow("no design nowhere");
});
