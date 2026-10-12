// Stamps the fingerprint of the source text on a topic's translations, once they are up to date with it.
// Run: npm run translated -- <topic id or file>… <language>…   (no language: every one but the source)
//      npm run translated -- --all
import { relative } from "node:path";
import { fingerprint, SOURCE } from "./fingerprint.ts";
import { EXPLAIN_CODES, type Explain, loadCurriculum, loadTopics, ROOT } from "./lib.ts";

const args = process.argv.slice(2);
const others = EXPLAIN_CODES.filter((e) => e !== SOURCE);
const langs = args.filter((a): a is Explain => (others as string[]).includes(a));
const wanted = args.filter((a) => !langs.includes(a as Explain) && a !== "--all");
if (wanted.length === 0 && !args.includes("--all")) {
  console.error(`usage: npm run translated -- <topic id or file>… [${others.join(" ")}] | --all`);
  process.exit(1);
}
const refs = (await loadTopics(await loadCurriculum())).filter((r) => r.topic !== null);
const chosen = args.includes("--all")
  ? refs
  : refs.filter((r) => wanted.some((w) => w === r.id || relative(ROOT, w) === r.path || w === r.path));
for (const w of wanted) {
  if (!chosen.some((r) => w === r.id || relative(ROOT, w) === r.path || w === r.path)) console.error(`  ? ${w}: no such topic`);
}

for (const ref of chosen) {
  const file = Bun.file(`${ROOT}/${ref.path}`);
  const text = await file.text();
  if (ref.topic === null) continue;
  const print = fingerprint(ref.topic);
  const old = (ref.topic.translated ?? {}) as Partial<Record<Explain, string>>;
  const now = Object.fromEntries(others.map((l) => [l, (langs.length === 0 || langs.includes(l) ? print : old[l]) ?? print]));
  const line = `translated: { ${others.map((l) => `${l}: "${now[l]}"`).join(", ")} }`;
  const next = /^translated: .*$/m.test(text) ? text.replace(/^translated: .*$/m, line) : text.replace(/^(status: .*)$/m, `$1\n${line}`);
  await Bun.write(file, next);
  console.log(`  ✓ ${ref.id}: ${(langs.length ? langs : others).join(", ")}`);
}
