// Gives every element of the topics named that lacks an id one (scripts/v1/ids.ts), and rewrites each file that
// gained one in the samples' style, keeping its opening comment.
// Run: npm run ids -- <topic folder>...
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { assignTopicIds } from "./v1/ids.ts";
import { headerOf, toYaml } from "./v1/yaml.ts";

for (const dir of process.argv.slice(2)) {
  const names = ["source.yaml", ...(await readdir(dir)).filter((n) => /^[a-z]{2}\.yaml$/.test(n)).sort()];
  const texts = await Promise.all(names.map((n) => Bun.file(join(dir, n)).text()));
  const data = texts.map((t) => Bun.YAML.parse(t) as Record<string, unknown>);
  const before = data.map((d) => JSON.stringify(d));
  const [source = {}, ...languages] = data;
  const added = assignTopicIds(source, languages);
  for (const [n, d] of data.entries()) {
    if (JSON.stringify(d) !== before[n]) await Bun.write(join(dir, names[n] ?? ""), toYaml(d, headerOf(texts[n] ?? "")));
  }
  console.log(`${dir}: ${added.length === 0 ? "every element has its id" : `gave ${added.join(", ")}`}`);
}
