// The study path of a track (curriculum.yaml `path`): per level, the steps to study, each a topic at a
// level. A step links to the place its level starts on its topic page: the top at the topic's lowest
// level, else the first guide section holding that level, under the anchor the topic page gives it.
// The link names its level in data-path-step; client-path.ts adds it to the address as ?step=a1 when
// the reader follows the link, so the page marks the step being read and every href stays canonical.
import { type CurriculumLanguage, type Explain, type Level, LEVELS, type TopicRef } from "../../scripts/lib.ts";
import { leaves, topicLevels } from "../../scripts/levels.ts";
import { guideParts } from "./guide.ts";
import { anchorIds } from "./parts.ts";
import { topicUrl } from "./urls.ts";

export interface Step {
  level: Level;
  ref: TopicRef;
  href: string;
}

// A link to a step: its address and its level, which the reader's click adds as ?step=a1.
export const stepLink = (href: string, level: Level): string => `href="${href}" data-path-step="${level.toLowerCase()}"`;

export interface Stage {
  level: Level;
  steps: Step[];
}

function stepHref(ref: TopicRef, level: Level, explain: Explain, lang: CurriculumLanguage): string | null {
  const topic = ref.topic;
  if (!topic) return null;
  const held = topicLevels(topic, explain);
  if (!held.includes(level)) return null;
  const url = topicUrl(explain, lang, ref);
  if (level === held[0]) return url;
  const parts = guideParts(topic, explain);
  const ids = anchorIds(parts.map((p) => p.title));
  const at = parts.findIndex((p) => p.kind === "body" && p.content.some((b) => leaves(b, explain).some((l) => l.level === level)));
  return at < 0 ? url : `${url}#${ids[at] ?? ""}`;
}

// The path's levels, lowest first, with the steps a reader of this explanation language can take.
export function studyPath(lang: CurriculumLanguage, explain: Explain, refs: TopicRef[]): Stage[] {
  const byId = new Map(refs.map((r) => [r.id, r]));
  return LEVELS.flatMap((level) => {
    const steps = (lang.path[level] ?? []).flatMap((id): Step[] => {
      const ref = byId.get(id);
      const href = ref ? stepHref(ref, level, explain, lang) : null;
      return ref && href !== null ? [{ level, ref, href }] : [];
    });
    return steps.length > 0 ? [{ level, steps }] : [];
  });
}
