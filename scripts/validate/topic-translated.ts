// Translations follow the source text: each explanation language but the source carries, in `translated`,
// the fingerprint of the source text it was written from, and a part whose source text changed since is
// named until the translation catches up and is stamped again.
import { changedParts, SOURCE } from "../fingerprint.ts";
import { EXPLAIN_CODES, type Topic } from "../lib.ts";
import type { Report } from "./report.ts";

export function checkTranslated(topic: Topic, where: string, report: Report): void {
  const stamp = `npm run translated -- ${topic.id}`;
  for (const l of EXPLAIN_CODES.filter((e) => e !== SOURCE)) {
    const own = topic.translated?.[l];
    if (own === undefined) {
      report(where, `translated has no "${l}" fingerprint: once the ${l} text is written, run ${stamp} ${l}`);
      continue;
    }
    const changed = changedParts(topic, own);
    if (changed.length > 0) {
      report(where, `the ${l} text predates the ${SOURCE} text in ${changed.join(", ")}: bring it up to date, then run ${stamp} ${l}`);
    }
  }
}
