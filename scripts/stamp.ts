// Records in each language file of the topics named the fingerprint of every source sentence it translates
// (scripts/v1/fingerprints.ts), or of the ids given after --ids, once their translations follow the source again.
// The fingerprints block is rewritten at the file's end; the rest of the file keeps its layout.
// Run: npm run stamp -- <topic folder>... [--languages uk ja] [--ids title def]
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { TopicLanguageFile, TopicSource } from "./generated/library-v1.ts";
import { stamped, withFingerprints } from "./v1/fingerprints.ts";

const args = process.argv.slice(2);
const after = (flag: string): string[] | undefined => {
  const at = args.indexOf(flag);
  if (at < 0) return undefined;
  const rest = args.slice(at + 1);
  const end = rest.findIndex((a) => a.startsWith("--"));
  return end < 0 ? rest : rest.slice(0, end);
};
const languages = after("--languages");
const ids = after("--ids");
const flags = args.findIndex((a) => a.startsWith("--"));
const dirs = flags < 0 ? args : args.slice(0, flags);

for (const dir of dirs) {
  const source = Bun.YAML.parse(await Bun.file(join(dir, "source.yaml")).text()) as TopicSource;
  for (const name of (await readdir(dir)).filter((n) => /^[a-z]{2}\.yaml$/.test(n)).sort()) {
    if (languages !== undefined && !languages.includes(name.slice(0, 2))) continue;
    const text = await Bun.file(join(dir, name)).text();
    const record = stamped(source, Bun.YAML.parse(text) as TopicLanguageFile, ids);
    await Bun.write(join(dir, name), withFingerprints(text, record));
    console.log(`${join(dir, name)}: ${Object.keys(record).length} fingerprints`);
  }
}
