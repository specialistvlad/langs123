// The review of a library's root, from the command line or through api.ts: each topic named whose files pass the
// checks is reviewed (pipeline.ts), its record's open findings aside, and so is the index of each course named. A
// record joins its folder as review.yaml, beside the topic's source or the course's index; the report and the run's
// sessions go to build/review/, and the flagged queue is written again from every record of the root.
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import { ROOT } from "../lib.ts";
import { catalog, checkRoot } from "../v1/check.ts";
import type { Problem } from "../v1/schema.ts";
import { toYaml } from "../v1/yaml.ts";
import { todayTopics } from "./index-request.ts";
import { type Policy, reviewIndex, reviewTopic, type TopicReview } from "./pipeline.ts";
import { queueOf } from "./queue.ts";
import { reportOf, withReview, type Writer } from "./record.ts";
import type { Runner } from "./run.ts";

export const REVIEW_DIR = join(ROOT, "build", "review");

export interface ReviewOptions extends Policy {
  runner: Runner;
  // The writer a topic's first record names.
  writer: Writer;
  // Where the reports, the sessions and the queue go: build/review/ when none is given.
  out?: string;
}

// Keeps a review: its record at the path given from core's root, where a session ran, its report at the path given
// from the output folder, and its sessions appended to sessions.jsonl.
async function keep(
  done: TopicReview,
  before: TopicReviewRecord | undefined,
  at: { record: string; report: string },
  options: ReviewOptions,
  out: string,
): Promise<void> {
  if (done.requests.some((r) => r.runs.length > 0)) {
    await Bun.write(join(ROOT, at.record), toYaml(withReview(before, done, options.writer)));
  }
  await mkdir(dirname(join(out, at.report)), { recursive: true });
  await Bun.write(join(out, at.report), reportOf(done, before));
  const sessions = done.requests.flatMap((r) =>
    r.runs.map((s, i) => ({
      date: done.date,
      topic: done.topic,
      kind: r.request.kind,
      language: r.request.language ?? null,
      ...(r.request.only !== undefined && { only: r.request.only }),
      run: i + 1,
      ...s,
      findings: s.findings.length,
    })),
  );
  await appendFile(join(out, "sessions.jsonl"), sessions.map((s) => `${JSON.stringify(s)}\n`).join(""));
}

const clean = (own: Problem[], what: string): void => {
  if (own.length > 0) throw new Error(`${what} enters review once the checks pass: ${String(own.length)} problems`);
};

// Reviews the topics and the indexes given by their ids (a course's code names its index), of the library at the
// root, and gives each review.
export async function review(root: string, ids: string[], options: ReviewOptions): Promise<TopicReview[]> {
  const out = options.out ?? REVIEW_DIR;
  const { library, problems } = await checkRoot(root);
  const rules = await catalog();
  const reviews: TopicReview[] = [];
  for (const course of library.courses) {
    if (ids.includes(course.course)) {
      const index = course.index;
      if (index === undefined) throw new Error(`${course.course} has no index.yaml to review`);
      clean(
        problems.filter((p) => p.file === index.file),
        `the index of ${course.course}`,
      );
      const done = await reviewIndex(
        { ...course, index },
        rules,
        await todayTopics(course.course, index.data.source),
        options.runner,
        options,
      );
      const at = { record: index.file.replace(/index\.yaml$/, "review.yaml"), report: join(course.course, "index.md") };
      await keep(done, course.review?.data, at, options, out);
      reviews.push(done);
    }
    for (const topic of course.topics.filter((t) => ids.includes(t.source.data.id))) {
      clean(
        problems.filter((p) => p.file.includes(`/${topic.course}/${topic.slug}/`) && !p.file.endsWith("/review.yaml")),
        topic.source.data.id,
      );
      const done = await reviewTopic(topic, course, rules, options.runner, options);
      const at = { record: topic.source.file.replace(/source\.yaml$/, "review.yaml"), report: join(topic.course, `${topic.slug}.md`) };
      await keep(done, topic.review?.data, at, options, out);
      reviews.push(done);
    }
  }
  await Bun.write(join(out, "queue.json"), JSON.stringify(queueOf((await checkRoot(root)).library), null, 2));
  return reviews;
}

// The flagged queue of a library's root.
export const reviewQueue = async (root: string): Promise<ReturnType<typeof queueOf>> => queueOf((await checkRoot(root)).library);
