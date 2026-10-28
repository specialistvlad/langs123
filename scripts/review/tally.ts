// The tallies of the calibration (gate 4b check 13): per model and question, the planted cases a session caught and the
// sound elements it flagged, against the target the owner sets (12.3): 90% caught and at most 10% flagged until then.
import type { Pair, Plant, Planted } from "./calibrate.ts";
import type { Session } from "./run.ts";

export const TARGET = { caught: 0.9, flagged: 0.1 };

export interface Tally {
  model: string;
  rule: string;
  planted: number;
  caught: number;
  sound: number;
  flagged: number;
}

// Per rule a request asked: the planted cases the session caught, and the sound elements it flagged. A case planted for
// another rule may break this one too, so a finding on it counts as neither.
export function tally(model: string, planted: Planted, session: Session): Tally[] {
  return Object.entries(planted.request.asked).map(([rule, asked]) => {
    const cases = planted.plants.filter((p) => p.rule === rule);
    const found = session.findings.filter((f) => f.rule === rule);
    const names = (p: Plant, at: string): boolean => planted.ids.get(p)?.includes(at) ?? false;
    const caught = cases.filter((p) => found.some((f) => names(p, f.at))).length;
    const flagged = new Set(found.filter((f) => !planted.plants.some((p) => names(p, f.at))).map((f) => f.at)).size;
    return { model, rule, planted: cases.length, caught, sound: asked - cases.length, flagged };
  });
}

export function tallyPairs(model: string, pairs: Pair[], session: Session): Tally {
  const flaggedAt = new Set(session.findings.filter((f) => f.rule === "RV-11").map((f) => f.at));
  const at = (n: number): boolean => flaggedAt.has(`p${String(n + 1)}`);
  const planted = pairs.flatMap((p, n) => (p.faithful ? [] : [n]));
  const sound = pairs.flatMap((p, n) => (p.faithful ? [n] : []));
  return {
    model,
    rule: "RV-11",
    planted: planted.length,
    caught: planted.filter(at).length,
    sound: sound.length,
    flagged: sound.filter(at).length,
  };
}

// The tallies summed per model and rule, in the order met.
export function summed(tallies: Tally[]): Tally[] {
  const out = new Map<string, Tally>();
  for (const t of tallies) {
    const k = `${t.model} ${t.rule}`;
    const s = out.get(k);
    out.set(
      k,
      s === undefined
        ? { ...t }
        : { ...s, planted: s.planted + t.planted, caught: s.caught + t.caught, sound: s.sound + t.sound, flagged: s.flagged + t.flagged },
    );
  }
  return [...out.values()];
}

export const meets = (t: Tally): boolean =>
  (t.planted === 0 || t.caught / t.planted >= TARGET.caught) && (t.sound === 0 || t.flagged / t.sound <= TARGET.flagged);

const share = (a: number, b: number): string => (b === 0 ? "—" : `${String(a)}/${String(b)} (${String(Math.round((100 * a) / b))}%)`);

export function calibrationReport(tallies: Tally[], date: string): string {
  const rows = summed(tallies);
  const models = [...new Set(rows.map((t) => t.model))];
  return [
    `# Calibration of the review's questions, ${date}`,
    "",
    `Target: ${String(TARGET.caught * 100)}% of planted cases caught and at most ${String(TARGET.flagged * 100)}% of sound elements flagged, until the owner sets each question's rate (12.3). Sound elements are those of the samples the question reads, the owner's labels to come.`,
    ...models.flatMap((m) => [
      "",
      `## ${m}`,
      "",
      "| Rule | Planted caught | Sound flagged | Target |",
      "|---|---|---|---|",
      ...rows
        .filter((t) => t.model === m)
        .map((t) => `| ${t.rule} | ${share(t.caught, t.planted)} | ${share(t.flagged, t.sound)} | ${meets(t) ? "met" : "missed"} |`),
    ]),
    "",
  ].join("\n");
}
