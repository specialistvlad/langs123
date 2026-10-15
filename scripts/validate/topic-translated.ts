// Translations follow the source text, written in the track's source language (the language being learned):
// each other explanation language of the topic carries, in `translated`, the fingerprint of the source text it
// was written from, and a part whose source text changed since is named until the translation catches up and is
// stamped again.
import { changedParts, sourceOf } from "../fingerprint.ts";
import { EXPLAIN_CODES, type Explain, type Topic } from "../lib.ts";
import type { Report } from "./report.ts";

export function checkTranslated(topic: Topic, where: string, report: Report, explain: readonly Explain[] = EXPLAIN_CODES): void {
  const stamp = `npm run translated -- ${topic.id}`;
  const source = sourceOf(explain);
  for (const l of Object.keys(topic.translated ?? {})) {
    if (!(explain as string[]).includes(l)) report(where, `translated has "${l}", which the topic's language is not written for`);
    if (l === source) report(where, `translated has "${l}", the source the other languages follow`);
  }
  for (const l of explain.filter((e) => e !== source)) {
    const own = topic.translated?.[l];
    if (own === undefined) {
      report(where, `translated has no "${l}" fingerprint: once the ${l} text is written, run ${stamp} ${l}`);
      continue;
    }
    const changed = changedParts(topic, own, source);
    if (changed.length > 0) {
      report(where, `the ${l} text predates the ${source} text in ${changed.join(", ")}: bring it up to date, then run ${stamp} ${l}`);
    }
  }
}
