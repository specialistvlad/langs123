import type { LIST_MARKS } from "./text.ts";

// What a list of pieces is joined with. Alternatives and examples whose pieces show a slash of their
// own, IPA included, are joined with a middle dot, so no joining slash stands next to theirs; a list
// that follows the form under discussion opens with its joiner.
export const JOINERS: Record<(typeof LIST_MARKS)[number], string> = {
  alternatives: " / ",
  examples: " / ",
  mapping: " → ",
  takes: " → ",
  exchange: " — ",
  pattern: " + ",
  equivalence: " = ",
  contrast: " ≠ ",
};
