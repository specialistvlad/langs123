// The owner's labels of the elements the calibration flagged (12.3): each element of flags.md labelled `breaks: true`,
// a defect the model found, or `breaks: false`, a false alarm, in library/review/labels.yaml or in a file given in its
// place. The recount reads the saved sessions again with them: a flag labelled true takes its elements out of the
// sound ones and the false alarms, so each question's rate of false alarms is its true one.
import type { Planted } from "./calibrate.ts";
import { flagsOf, mergeFlags } from "./flags.ts";
import type { Session } from "./run.ts";
import { tally, type Tally } from "./tally.ts";

export interface Label {
  rule: string;
  topic: string;
  // The language file the element stands in, or the source.
  language: string;
  at: string;
  breaks: boolean;
}

const KEYS = ["rule", "topic", "language", "at", "breaks"];

export async function readLabels(file: string): Promise<Label[]> {
  const data: unknown = Bun.YAML.parse(await Bun.file(file).text());
  if (!Array.isArray(data)) throw new Error(`${file} holds a list of labels`);
  return data.map((item: unknown, n): Label => {
    const node = (item ?? {}) as Record<string, unknown>;
    const missing = KEYS.filter((k) => node[k] === undefined);
    if (missing.length > 0 || typeof node["breaks"] !== "boolean") {
      throw new Error(`${file}: label ${String(n + 1)} lacks ${missing.length > 0 ? missing.join(", ") : "breaks true or false"}`);
    }
    return node as unknown as Label;
  });
}

const same = (l: Label, f: { rule: string; topic: string; language: string; at: string }): boolean =>
  l.rule === f.rule && l.topic === f.topic && l.language === f.language && l.at === f.at;

// The tallies of a planted request's session with the labels applied to the rules named: each flag a label marks as
// breaking takes its findings' elements out of the sound elements and the false alarms of its rule.
export function labelledTally(model: string, planted: Planted, session: Session, rules: string[], labels: Label[]): Tally[] {
  const breaking = mergeFlags(flagsOf(planted, model, session.findings, rules), rules).filter((f) =>
    labels.some((l) => l.breaks && same(l, f)),
  );
  return tally(model, planted, session).map((t) => {
    const elements = new Set(breaking.filter((f) => f.rule === t.rule).flatMap((f) => f.findings.map((m) => m.at)));
    return elements.size === 0 ? t : { ...t, sound: t.sound - elements.size, flagged: t.flagged - elements.size };
  });
}
