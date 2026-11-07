// The question rules of library/RULES.md as the review asks them (12.2): each rule's question, from the catalog, with
// the request that asks it (a topic's source, one of its language files, or a course's index), the part of that
// text it is asked of, and the input it waits on where M6 brings it, until when it stays unasked. CA-02 is asked of
// the catalog's own rules, outside a topic's review.
import type { Catalog } from "../rule-catalog.ts";
import { type Scope, scopeOf } from "../v1/scope.ts";

export type RequestKind = "source" | "language" | "index";

// The part of a text a question is asked of.
export type Target =
  | "definition"
  | "opening"
  | "explanations"
  | "sentences"
  | "examples"
  | "course text"
  | "essence"
  | "blocks"
  | "facts"
  | "whys"
  | "lists"
  | "errors"
  | "reasons"
  | "translations"
  | "example translations"
  | "own blocks"
  | "untagged blocks"
  | "tables"
  | "entries"
  // The entries of an index that carry a practical cluster, those that name no topic of today's library in replaces,
  // and those a source passage fed.
  | "practical entries"
  | "new entries"
  | "sourced entries";

interface Asks {
  kinds: RequestKind[];
  target: Target;
  // The answer that makes a finding, where a yes does: a question that sorts its elements, an element it sorts in
  // breaking its rule.
  fails?: { answer: "yes"; when: string };
  // The input the question waits on, which M6 brings.
  pending?: string;
}

const BOTH: RequestKind[] = ["source", "language"];
const VOCABULARY = "the vocabulary of each level";
const UNTAGGED = { answer: "yes", when: "the block carries no variety" } as const;

export const ASKS: Record<string, Asks> = {
  "SH-04": { kinds: BOTH, target: "definition" },
  "SH-05": { kinds: BOTH, target: "definition" },
  "SH-06": { kinds: ["source"], target: "definition" },
  "SH-07": { kinds: BOTH, target: "opening" },
  "SH-09": { kinds: ["source"], target: "opening", pending: VOCABULARY },
  "SH-10": { kinds: ["source"], target: "essence" },
  "SH-15": { kinds: ["source"], target: "blocks" },
  "SH-17": { kinds: ["source"], target: "blocks" },
  "SH-19": { kinds: ["source"], target: "whys" },
  "SH-20": { kinds: BOTH, target: "whys" },
  "SH-21": { kinds: BOTH, target: "facts" },
  "SH-22": { kinds: ["source"], target: "blocks" },
  "SH-23": { kinds: ["source"], target: "blocks" },
  "VO-02": { kinds: BOTH, target: "explanations" },
  "VO-03": { kinds: ["source"], target: "explanations", pending: VOCABULARY },
  "VO-06": { kinds: ["source"], target: "course text" },
  "VO-07": { kinds: ["source"], target: "examples" },
  "VO-08": { kinds: ["language"], target: "example translations" },
  "FT-01": { kinds: ["source"], target: "lists" },
  "FT-05": { kinds: BOTH, target: "explanations" },
  "FT-06": { kinds: ["source"], target: "blocks" },
  "FT-08": { kinds: ["source"], target: "sentences", pending: "the grammar, script and forms each step teaches" },
  "ER-03": { kinds: BOTH, target: "reasons" },
  "ER-07": { kinds: BOTH, target: "errors" },
  "ER-08": { kinds: ["language"], target: "own blocks" },
  "NO-04": { kinds: ["source"], target: "course text", pending: "the PCIC's entries" },
  "NO-06": { kinds: BOTH, target: "sentences" },
  "NO-07": { kinds: ["source"], target: "course text", pending: "the standard's extracts" },
  "NO-12": { kinds: ["source"], target: "errors" },
  "NO-13": { kinds: BOTH, target: "sentences" },
  "NO-14": { kinds: ["source"], target: "course text" },
  "NO-18": { kinds: ["source"], target: "blocks" },
  "NO-21": { kinds: BOTH, target: "sentences" },
  "NO-50": { kinds: ["source"], target: "untagged blocks", fails: UNTAGGED },
  "NO-30": { kinds: ["source"], target: "untagged blocks", fails: UNTAGGED },
  "NO-32": { kinds: ["source"], target: "untagged blocks", fails: UNTAGGED },
  "NO-49": { kinds: ["source"], target: "untagged blocks", fails: UNTAGGED },
  "NO-39": { kinds: BOTH, target: "explanations" },
  "NO-44": { kinds: BOTH, target: "explanations" },
  "IX-11": { kinds: ["index"], target: "sourced entries", pending: "the sources' passages" },
  "IX-14": { kinds: ["source"], target: "tables", pending: "the reference list" },
  "IX-15": { kinds: ["index"], target: "practical entries" },
  "IX-24": { kinds: ["index"], target: "new entries", fails: { answer: "yes", when: "the entry names no topic in replaces" } },
  "RV-11": { kinds: ["language"], target: "translations" },
  "ST-02": { kinds: BOTH, target: "facts" },
};

export interface Question {
  rule: string;
  // What the question is asked of: a block or a sentence.
  subject: "block" | "sentence";
  text: string;
  target: Target;
  scope: Scope;
  pending?: string;
  fails?: { answer: "yes"; when: string };
}

const SUBJECT = /^\[(block|sentence)\]\s+/;

// The questions a request of the kind asks, in the catalog's order.
export function questionsOf(catalog: Catalog, kind: RequestKind): Question[] {
  return catalog.rules.flatMap((r): Question[] => {
    const asks = ASKS[r.id];
    const question = r.fields.question ?? "";
    if (r.fields.check !== "question" || asks?.kinds.includes(kind) !== true) return [];
    const subject = (SUBJECT.exec(question)?.[1] ?? "sentence") as Question["subject"];
    return [
      {
        rule: r.id,
        subject,
        text: question.replace(SUBJECT, ""),
        target: asks.target,
        scope: scopeOf(catalog, r.id),
        ...(asks.pending !== undefined && { pending: asks.pending }),
        ...(asks.fails !== undefined && { fails: asks.fails }),
      },
    ];
  });
}
