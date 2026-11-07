// Reviews topics and indexes of the new library in Claude Code sessions (scripts/review/index.ts): each topic folder's
// source and language files, and each course folder's index, the records written beside them, the reports, sessions
// and flagged queue into build/review/. The rules --stronger names leave each request that asks them for a request
// of their own on its model; the review's models (pipeline.ts) stand where neither --model nor --stronger is given.
// --source-only runs the source requests alone. --sources names the folder of the sources' text, one folder per
// course (scripts/review/sources.ts), which the questions that read a source passage, a reference list or each
// level's vocabulary wait on.
// Run: npm run review -- <topic or course folder>… --writer <session> <model> [--model <version>]
//      [--stronger <model> <rule>…] [--source-only] [--sources <folder>] [--dry-run]
import { basename, dirname, join, resolve } from "node:path";
import { todayTopics } from "./review/index-request.ts";
import { review } from "./review/index.ts";
import { indexRequestsOf, modelOf, type Policy, requestsOf, REVIEW_MODELS } from "./review/pipeline.ts";
import type { Request } from "./review/request.ts";
import { claudeAttempt, runnerOf } from "./review/run.ts";
import { readSources } from "./review/sources.ts";
import { catalog } from "./v1/check.ts";
import { typedLibrary } from "./v1/library.ts";
import { readLibrary } from "./v1/load.ts";

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
// A course folder, which holds index.yaml, names its index; a topic folder names its topic.
const isCourse = await Promise.all(dirs.map((d) => Bun.file(join(d, "index.yaml")).exists()));
const first = dirs[0] ?? ".";
const root = isCourse[0] === true ? dirname(first) : dirname(dirname(first));
const ids = dirs.map((d, n) => (isCourse[n] === true ? basename(d) : `${basename(dirname(d))}.${basename(d)}`));
const model = flag("--model")[0] ?? REVIEW_MODELS.model;
const [strongerModel, ...strongerRules] = flag("--stronger", args.length).filter(
  (_, n, rest) => !rest.slice(0, n + 1).some((a) => a.startsWith("--")),
);
const policy: Omit<Policy, "date"> = {
  model,
  ...(strongerModel !== undefined
    ? { stronger: { model: strongerModel, rules: strongerRules } }
    : flag("--model").length === 0 && REVIEW_MODELS.stronger !== undefined && { stronger: REVIEW_MODELS.stronger }),
  ...(args.includes("--source-only") && { kinds: ["source" as const] }),
};
const what = (r: Request): string => (r.kind === "index" ? "index" : (r.language ?? "source"));
const sourcesDir = flag("--sources")[0];

if (args.includes("--dry-run")) {
  const { library } = typedLibrary(await readLibrary(root));
  const rules = await catalog();
  for (const course of library.courses) {
    const index = course.index;
    const sources = await readSources(sourcesDir, course.course);
    const ofIndex =
      ids.includes(course.course) && index !== undefined
        ? indexRequestsOf({ ...course, index }, rules, await todayTopics(course.course, index.data.source), policy.stronger?.rules, sources)
        : [];
    const ofTopics = course.topics
      .filter((t) => ids.includes(t.source.data.id))
      .flatMap((topic) => requestsOf(topic, course, rules, policy.stronger?.rules, sources));
    for (const r of [...ofIndex, ...ofTopics].filter((q) => policy.kinds?.includes(q.kind) ?? true)) {
      const asked = Object.values(r.asked).reduce((a, b) => a + b, 0);
      console.log(
        `${r.topic} ${what(r)}${r.only === undefined ? "" : ` (${r.only.join(", ")} alone)`} on ${modelOf(r, { ...policy, date: "" })}: ${String(asked)} questions, ${String(Object.keys(r.asked).length)} rules, ${String(r.prompt.length)} characters; pending ${r.pending.join(", ") || "none"}`,
      );
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
    ...policy,
    ...(sourcesDir !== undefined && { sources: sourcesDir }),
    date: new Date().toISOString().slice(0, 10),
  });
  for (const d of done) {
    console.log(
      `${d.topic}: ${d.requests.map((r) => `${what(r.request)} ${String(r.standing.length)} standing, ${String(r.disputed.length)} disputed`).join("; ")}`,
    );
  }
  console.log(`reports: ${join("build", "review")}`);
}
