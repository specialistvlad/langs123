// The review of the topics of a library's root, from the command line or through api.ts: each topic that passes the
// checks is reviewed (pipeline.ts); its record joins its folder as review.yaml, its report and the run's sessions go
// to build/review/, and the flagged queue is written again from every record of the root.
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { TopicReviewRecord } from "../generated/library-v1.ts";
import { ROOT } from "../lib.ts";
import { catalog, checkRoot } from "../v1/check.ts";
import { toYaml } from "../v1/yaml.ts";
import { reviewTopic, type Policy, type TopicReview } from "./pipeline.ts";
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

// Reviews the topics given by their ids, of the library at the root, and gives each review.
export async function review(root: string, ids: string[], options: ReviewOptions): Promise<TopicReview[]> {
  const out = options.out ?? REVIEW_DIR;
  const { library, problems } = await checkRoot(root);
  const rules = await catalog();
  const reviews: TopicReview[] = [];
  for (const course of library.courses) {
    for (const topic of course.topics.filter((t) => ids.includes(t.source.data.id))) {
      const own = problems.filter((p) => p.file.includes(`/${topic.course}/${topic.slug}/`));
      if (own.length > 0) throw new Error(`${topic.source.data.id} enters review once the checks pass: ${String(own.length)} problems`);
      const done = await reviewTopic(topic, course, rules, options.runner, options);
      const record: TopicReviewRecord = withReview(topic.review?.data, done, options.writer);
      await Bun.write(join(ROOT, topic.source.file.replace(/source\.yaml$/, "review.yaml")), toYaml(record));
      await mkdir(join(out, topic.course), { recursive: true });
      await Bun.write(join(out, topic.course, `${topic.slug}.md`), reportOf(done));
      const sessions = done.requests.flatMap((r) =>
        r.runs.map((s, i) => ({
          date: done.date,
          topic: done.topic,
          kind: r.request.kind,
          language: r.request.language ?? null,
          run: i + 1,
          ...s,
          findings: s.findings.length,
        })),
      );
      await appendFile(join(out, "sessions.jsonl"), sessions.map((s) => `${JSON.stringify(s)}\n`).join(""));
      reviews.push(done);
    }
  }
  await Bun.write(join(out, "queue.json"), JSON.stringify(queueOf((await checkRoot(root)).library), null, 2));
  return reviews;
}

// The flagged queue of a library's root.
export const reviewQueue = async (root: string): Promise<ReturnType<typeof queueOf>> => queueOf((await checkRoot(root)).library);
