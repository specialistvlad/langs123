// The elements the calibration flagged outside its planted cases, for the owner to label (12.3): each element a model
// flagged against one of the rules named, with its sample and language, its text as the request showed it and each
// model's finding. The owner writes each label in library/review/labels.yaml; flagsReport names that file's shape.
import type { Catalog } from "../rule-catalog.ts";
import type { Topic } from "../v1/library.ts";
import { languagePieces, sourcePieces } from "../v1/texts.ts";
import type { Planted } from "./calibrate.ts";
import type { Finding } from "./run.ts";

export interface Flag {
  rule: string;
  topic: string;
  // The language file the element stands in, or the source.
  language: string;
  at: string;
  text: string[];
  // Each model's finding, with the request it came from and the id it named.
  findings: { model: string; request: string; at: string; text: string }[];
}

// The text of an element in a request: the source's pieces it holds, or, in a language's request, their translations
// and the language's own pieces it holds.
export function elementText(topic: Topic, language: string | undefined, at: string): string[] {
  const source = sourcePieces(topic.source.data).filter((p) => p.id === at || p.of === at || p.block === at);
  const file = topic.languages.find((l) => l.data.language === language)?.data;
  if (file === undefined) return source.map((p) => p.text);
  const ids = new Set(source.flatMap((p) => (p.id === undefined ? [] : [p.id])));
  return languagePieces(file)
    .filter((p) => p.id === at || p.block === at || (p.id !== undefined && ids.has(p.id)))
    .map((p) => p.text);
}

// The flags of one session: its findings of the rules named on no planted case. A language's finding on an element the
// language holds no text of is a finding on the source's text.
export function flagsOf(planted: Planted, model: string, findings: Finding[], rules: string[]): Flag[] {
  const plantedIds = new Set([...planted.ids.values()].flat());
  return findings
    .filter((f) => rules.includes(f.rule) && !plantedIds.has(f.at))
    .map((f) => {
      const own = elementText(planted.topic, planted.request.language, f.at);
      const language = own.length === 0 ? undefined : planted.request.language;
      return {
        rule: f.rule,
        topic: planted.request.topic,
        language: language ?? "source",
        at: f.at,
        text: language === undefined ? elementText(planted.topic, undefined, f.at) : own,
        findings: [{ model, request: planted.request.language ?? "source", at: f.at, text: f.text }],
      };
    });
}

// One flag per rule and passage, with every model's finding, in the order of the rules named: the findings on one
// element join, and a flag whose text stands inside another's, or whose id another's holds, joins that one: a
// sentence's flag goes to its block's.
export function mergeFlags(flags: Flag[], rules: string[]): Flag[] {
  const out = new Map<string, Flag>();
  for (const f of flags) {
    const k = [f.rule, f.topic, f.language, f.at].join(" ");
    const seen = out.get(k);
    if (seen === undefined) out.set(k, { ...f, findings: [...f.findings] });
    else seen.findings.push(...f.findings);
  }
  const all = [...out.values()];
  const within = (a: Flag, b: Flag): boolean =>
    a !== b &&
    [a.rule, a.topic, a.language].join(" ") === [b.rule, b.topic, b.language].join(" ") &&
    a.text.length > 0 &&
    a.text.every((t) => b.text.includes(t)) &&
    (b.text.length > a.text.length || a.at.startsWith(`${b.at}.`));
  const kept = all.filter((a) => !all.some((b) => within(a, b)));
  for (const a of all.filter((x) => !kept.includes(x))) kept.find((b) => within(a, b))?.findings.push(...a.findings);
  return kept.sort((a, b) => rules.indexOf(a.rule) - rules.indexOf(b.rule));
}

const line = (f: Flag, breaks?: boolean): string =>
  `- { rule: ${f.rule}, topic: ${f.topic}, language: ${f.language}, at: ${f.at}, breaks:${breaks === undefined ? "" : ` ${String(breaks)}`} }`;

export function flagsReport(flags: Flag[], catalog: Catalog, date: string): string {
  const rules = [...new Set(flags.map((f) => f.rule))];
  const example = flags[0];
  return [
    `# Elements the calibration flagged, ${date}`,
    "",
    "Each element below was flagged against a rule outside the planted cases. The owner labels each one in `library/review/labels.yaml`, one line per element, copied from under its findings:",
    "",
    "```yaml",
    example === undefined
      ? "- { rule: ST-02, topic: es.subject-pronouns, language: source, at: cosas.fact.1, breaks: true }"
      : line(example, true),
    "```",
    "",
    "`breaks: true` where the element breaks the rule and the finding stands; `breaks: false` where the element holds and the finding is a false alarm. The labels give each question its true rate of false alarms.",
    ...rules.flatMap((id) => {
      const rule = catalog.rules.find((r) => r.id === id);
      return [
        "",
        `## ${id} ${rule?.name ?? ""}`.trimEnd(),
        "",
        `Rule: ${rule?.fields.rule ?? ""}`,
        ...flags
          .filter((f) => f.rule === id)
          .flatMap((f) => [
            "",
            `### ${f.topic}, ${f.language}: \`${f.at}\``,
            "",
            ...(f.text.length === 0 ? ["> (the request holds no element of this id)"] : f.text.map((t) => `> ${t}`)),
            "",
            ...f.findings.map((m) => {
              const where = [m.request === f.language ? "" : `${m.request} request`, m.at === f.at ? "" : `at \`${m.at}\``].filter(
                (w) => w !== "",
              );
              return `- ${m.model}${where.length === 0 ? "" : ` (${where.join(", ")})`}: ${m.text}`;
            }),
            "",
            "```yaml",
            line(f),
            "```",
          ]),
      ];
    }),
    "",
  ].join("\n");
}
