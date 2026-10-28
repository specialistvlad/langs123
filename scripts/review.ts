// Reviews topics of the new library in Claude Code sessions (scripts/review/index.ts): each topic folder's source and
// language files, the records written beside them, the reports, sessions and flagged queue into build/review/.
// Run: npm run review -- <topic folder>… --writer <session> <model> [--model <version>] [--dry-run]
import { dirname, join, resolve } from "node:path";
import { catalog } from "./v1/check.ts";
import { typedLibrary } from "./v1/library.ts";
import { readLibrary } from "./v1/load.ts";
import { review } from "./review/index.ts";
import { requestsOf } from "./review/pipeline.ts";
import { claudeAttempt, runnerOf } from "./review/run.ts";

const args = process.argv.slice(2);
const flag = (name: string, n = 1): string[] => {
  const at = args.indexOf(name);
  return at < 0 ? [] : args.slice(at + 1, at + 1 + n);
};
const dirs = args
  .slice(
    0,
    Math.max(
      0,
      args.findIndex((a) => a.startsWith("--")),
    ) || args.length,
  )
  .map((d) => resolve(d));
const root = dirname(dirname(dirs[0] ?? "."));
const ids = dirs.map((d) => `${d.split("/").at(-2) ?? ""}.${d.split("/").at(-1) ?? ""}`);
const model = flag("--model")[0] ?? "claude-sonnet-5-5";

if (args.includes("--dry-run")) {
  const { library } = typedLibrary(await readLibrary(root));
  const rules = await catalog();
  for (const course of library.courses) {
    for (const topic of course.topics.filter((t) => ids.includes(t.source.data.id))) {
      for (const r of requestsOf(topic, course, rules)) {
        const asked = Object.values(r.asked).reduce((a, b) => a + b, 0);
        console.log(
          `${r.topic} ${r.language ?? "source"}: ${String(asked)} questions, ${String(Object.keys(r.asked).length)} rules, ${String(r.prompt.length)} characters; pending ${r.pending.join(", ") || "none"}`,
        );
      }
    }
  }
} else {
  const [session, writerModel] = flag("--writer", 2);
  if (session === undefined || writerModel === undefined) {
    throw new Error("--writer <session> <model> names the writer a topic's first record holds");
  }
  const done = await review(root, ids, {
    runner: runnerOf(claudeAttempt),
    writer: { session, model: writerModel },
    model,
    date: new Date().toISOString().slice(0, 10),
  });
  for (const d of done) {
    console.log(
      `${d.topic}: ${d.requests.map((r) => `${r.request.language ?? "source"} ${String(r.standing.length)} standing, ${String(r.disputed.length)} disputed`).join("; ")}`,
    );
  }
  console.log(`reports: ${join("build", "review")}`);
}
