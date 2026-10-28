// Checks each file of the new library against its definition in library/schema/library.schema.json. A problem
// names the rule of library/RULES.md the failing part of the schema holds (its x-rule), where it has one.
import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import { join } from "node:path";
import { ROOT } from "../lib.ts";

export const SCHEMA_FILE = join(ROOT, "library", "schema", "library.schema.json");
export type FileKind = "index" | "source" | "language" | "review" | "approvals" | "concepts" | "words" | "kanji" | "needs";

export interface Problem {
  rule?: string;
  file: string;
  id?: string;
  message: string;
}

export const formatProblem = (p: Problem): string => `${p.rule ?? "schema"} ${p.file}${p.id === undefined ? "" : ` ${p.id}`}: ${p.message}`;

interface Annotated {
  "x-rule"?: string;
  "x-extra"?: Record<string, string>;
  properties?: Record<string, Annotated>;
}

const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, discriminator: true, verbose: true });
ajv.addVocabulary(["x-rule", "x-extra", "x-component"]);
// The schema itself, for the checks that read its vocabularies: the features a table crosses and their values.
export const SCHEMA = (await Bun.file(SCHEMA_FILE).json()) as {
  definitions: Record<string, { properties?: Record<string, { enum?: unknown[] }> }>;
};
ajv.addSchema(SCHEMA);

// The rule a schema error breaks: a missing property's own rule, the rule x-extra names for a property the schema
// lacks, else the rule of the schema that failed.
function ruleOf(e: ErrorObject): string | undefined {
  const parent = e.parentSchema as Annotated | undefined;
  const { missingProperty, additionalProperty } = e.params as { missingProperty?: string; additionalProperty?: string };
  const own = missingProperty === undefined ? undefined : parent?.properties?.[missingProperty]?.["x-rule"];
  const extra = additionalProperty === undefined ? undefined : parent?.["x-extra"]?.[additionalProperty];
  return own ?? extra ?? parent?.["x-rule"];
}

function message(e: ErrorObject): string {
  const params = e.params as { additionalProperty?: string; allowedValues?: unknown[] };
  const extra = params.additionalProperty ?? params.allowedValues?.join(", ");
  return `${e.instancePath === "" ? "/" : e.instancePath} ${e.message ?? ""}${extra === undefined ? "" : `: ${extra}`}`;
}

export function schemaProblems(kind: FileKind, data: unknown, file: string): Problem[] {
  const validate = ajv.getSchema(`library.schema.json#/definitions/${kind}`) as ValidateFunction;
  if (validate(data)) return [];
  // An anyOf names each branch that failed, then itself; the reader needs the last line alone.
  const errors = (validate.errors ?? []).filter((e) => !/\/anyOf\/\d+\//.test(e.schemaPath));
  return errors.map((e) => {
    const rule = ruleOf(e);
    return { ...(rule !== undefined && { rule }), file, message: message(e) };
  });
}
