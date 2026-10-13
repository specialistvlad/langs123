// Generates TypeScript types from the JSON Schemas into scripts/generated/: schemas and code share one source.
// The explanation languages come from site.yaml alone: every list of them in a schema, an enum, a
// required list or the properties of a localized value, is written from it first.
// Run: npm run types   (--check fails when a schema or a generated file is out of date)
import { compileFromFile } from "json-schema-to-typescript";
import { join } from "node:path";

const SCHEMAS = join(import.meta.dir, "..", "languages", "schema");
const OUT = join(import.meta.dir, "generated");
const NAMES = ["site", "levels", "interface", "curriculum", "concepts", "topic"];
const check = process.argv.includes("--check");

const site = Bun.YAML.parse(await Bun.file(join(SCHEMAS, "..", "site.yaml")).text()) as { explain: { code: string }[] };
const CODES = site.explain.map((e) => e.code);
// A list of explanation languages: two or more language codes, English among them.
const isCodeList = (keys: unknown[]): boolean =>
  keys.length >= 2 && keys.includes("en") && keys.every((k) => typeof k === "string" && /^[a-z]{2}$/.test(k));
// A schema with every list of explanation languages written from site.yaml, each property shaped as English's.
function withCodes(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(withCodes);
  if (typeof node !== "object" || node === null) return node;
  return Object.fromEntries(
    Object.entries(node as Record<string, unknown>).map(([key, value]) => {
      if ((key === "enum" || key === "required") && Array.isArray(value) && isCodeList(value)) return [key, [...CODES]];
      if (key === "properties" && typeof value === "object" && value !== null && isCodeList(Object.keys(value))) {
        const english = (value as Record<string, unknown>)["en"];
        return [key, Object.fromEntries(CODES.map((code) => [code, withCodes(english)]))];
      }
      return [key, withCodes(value)];
    }),
  );
}

let stale = 0;
for (const name of NAMES) {
  const path = join(SCHEMAS, `${name}.schema.json`);
  const source = await Bun.file(path).text();
  const synced = `${JSON.stringify(withCodes(JSON.parse(source)), null, 2)}\n`;
  if (synced !== source) {
    if (check) {
      console.log(`  ✗ languages/schema/${name}.schema.json is out of date with site.yaml: run npm run types`);
      stale++;
    } else await Bun.write(path, synced);
  }
  const types = await compileFromFile(path, {
    bannerComment: `// Generated from languages/schema/${name}.schema.json by npm run types. Edit the schema, then regenerate.`,
    cwd: SCHEMAS,
    additionalProperties: false,
    ignoreMinAndMaxItems: true,
    style: { printWidth: 140 },
  });
  const file = join(OUT, `${name}.ts`);
  if (!check) {
    await Bun.write(file, types);
    continue;
  }
  const current = (await Bun.file(file).exists()) ? await Bun.file(file).text() : "";
  if (current !== types) {
    console.log(`  ✗ scripts/generated/${name}.ts is out of date: run npm run types`);
    stale++;
  }
}
console.log(
  check
    ? `stale files: ${stale}`
    : `wrote the explanation languages of site.yaml into the schemas and generated ${NAMES.length} type files into scripts/generated/`,
);
process.exit(stale > 0 ? 1 : 0);
