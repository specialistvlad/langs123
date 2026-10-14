// One topic against the curriculum and the other data files.
import type { Concepts, Explain, Topic, TopicRef } from "../lib.ts";
import type { Report } from "./report.ts";
import { checkLevels } from "./topic-levels.ts";
import { checkSummary } from "./topic-summary.ts";
import { links } from "./notation.ts";
import { checkText } from "./topic-text.ts";
import { checkTranslated } from "./topic-translated.ts";

export function checkTopic(ref: TopicRef, topic: Topic, ids: Set<string>, concepts: Concepts, report: Report): void {
  const where = ref.path;
  if (topic.id !== ref.id) report(where, `id ${topic.id} differs from path id ${ref.id}`);
  if (topic.lang !== ref.lang) report(where, `lang ${topic.lang} differs from folder ${ref.lang}`);
  checkLevels(ref, topic, where, report);

  for (const c of topic.concepts) if (!(c in concepts)) report(where, `concept "${c}" missing from concepts.yaml`);
  for (const id of topic.related) if (!ids.has(id)) report(where, `related "${id}" missing from curriculum.yaml`);
  for (const id of links(topic)) {
    if (!ids.has(id)) report(where, `link to ${id} missing from curriculum.yaml`);
    if (id === topic.id) report(where, `link to ${id} points to the topic itself`);
  }
  // Each explanation language of the topic's language has a status, and only those.
  const status = topic.status as Partial<Record<Explain, string>>;
  for (const l of ref.explain) if (status[l] === undefined) report(where, `status has no "${l}"`);
  for (const l of Object.keys(status)) {
    if (!(ref.explain as string[]).includes(l)) report(where, `status has "${l}", which the topic's language is not written for`);
  }
  checkText(topic, where, report, ref.explain);
  checkSummary(topic, where, report, ref.explain);
  checkTranslated(topic, where, report, ref.explain);
}
