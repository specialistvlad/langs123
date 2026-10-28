// Every rule of the linter, in the catalog's order of families: the topic's shape, its voice, its items and tables,
// the index, the review, each language's writing, each course's norms and the words of each language.
import { COURSE_NORMS } from "./course-norms.ts";
import { indexRules, type Needs } from "./index-rules.ts";
import { ITEMS } from "./items.ts";
import type { LintRule } from "./lint.ts";
import { ORTHOGRAPHY } from "./orthography.ts";
import { REVIEW } from "./review.ts";
import { SHAPE } from "./shape.ts";
import { VOICE } from "./voice.ts";
import { WORDING } from "./wording.ts";

export const lintRules = (needs: Needs[] = []): LintRule[] => [
  ...SHAPE,
  ...VOICE,
  ...ITEMS,
  ...indexRules(needs),
  ...REVIEW,
  ...ORTHOGRAPHY,
  ...COURSE_NORMS,
  ...WORDING,
];
