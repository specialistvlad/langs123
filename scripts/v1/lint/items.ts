// Items, examples, tables and errors: an item that states a rule or a form has its example (FT-02); an example is
// written out in full (FT-03); a list follows the fact that governs it, each item a sentence (FT-04); a table is a
// true grid (ST-03) of forms, its sentences naming its rows (ST-04); a transcription holds its symbols alone
// (ST-07); every mark records why it exists (ST-05); an error names its subtopic (ST-13) and is written once (ER-01);
// a language's own error names its speakers and the error it follows (ER-05); and a fingerprint belongs to a
// sentence the file translates (LA-08).
import { translatedIds } from "../fingerprints.ts";
import type { Topic } from "../library.ts";
import { MARKS, marksOf, plain } from "../marks.ts";
import { type Problem, SCHEMA } from "../schema.ts";
import { type Lint, type LintRule, problem, textsIn } from "./lint.ts";

const topicsOf = (lint: Lint, courses: string[] | undefined): Topic[] =>
  lint.library.courses.filter((c) => courses?.includes(c.course) ?? true).flatMap((c) => c.topics);
const at = (rule: string, file: string, id: string, message: string): Problem => ({ rule, file, id, message });
// The values of a feature a table may cross, as its column keys write them.
const valuesOf = (feature: string): string[] => (SCHEMA.definitions["features"]?.properties?.[feature]?.enum ?? []).map(String);
const CUT = /(?<![\p{L}])etc\b|\.\.\.|…|\s\/\s/u;

export const ITEMS: LintRule[] = [
  {
    id: "FT-02",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap(({ source: { file, data } }) =>
        data.subtopics
          .flatMap((s) => s.blocks.flatMap((b) => (b.type === "list" ? b.items.filter((i) => i.ex === undefined) : [])))
          .map((i) => at("FT-02", file, i.id, "the item has no example of its own")),
      ),
  },
  {
    id: "FT-03",
    check: (lint, scope) =>
      textsIn(lint, scope)
        .filter((t) => t.kind === "course" && CUT.test(plain(t.runs)))
        .map((t) => problem("FT-03", t, "the example is written out in full, with no etc., … or / between forms")),
  },
  {
    id: "FT-04",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap(({ source: { file, data } }) =>
        data.subtopics.flatMap((s) =>
          s.blocks.flatMap((b, n) => {
            if (b.type !== "list") return [];
            const ruled = s.blocks.slice(0, n).some((x) => x.type === "fact")
              ? []
              : [at("FT-04", file, b.id, "the list follows the fact that governs its items")];
            const fragments = b.items.filter((i) => i.text !== undefined && !/[.!?。]["»”’)]?$/u.test(i.text));
            return [...ruled, ...fragments.map((i) => at("FT-04", file, i.id, "the item's rule is a sentence of its own"))];
          }),
        ),
      ),
  },
  {
    id: "ST-03",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap(({ source: { file, data } }) =>
        data.subtopics.flatMap((s) =>
          s.blocks.flatMap((b) => {
            if (b.type !== "table") return [];
            const { rows, columns } = b.axes;
            const values = valuesOf(columns);
            const [head, ...rest] = b.columns.map((c) => c.key);
            const found: Problem[] = [];
            if (head !== rows) found.push(at("ST-03", file, b.id, `the first column names the rows' axis, ${rows}`));
            for (const key of rest.filter((k) => !values.includes(k))) {
              found.push(at("ST-03", file, b.id, `${key} is no value of ${columns}`));
            }
            for (const r of b.rows) {
              const features = new Map<string, string | number>(Object.entries(r.features));
              const own = features.get(columns);
              if (features.get(rows) === undefined) {
                found.push(at("ST-03", file, r.id, `the row names its ${rows}`));
              }
              for (const key of Object.keys(r.cells)) {
                if (!b.columns.some((c) => c.key === key)) found.push(at("ST-03", file, r.id, `no column is ${key}`));
                else if (key !== head && own !== undefined && String(own) !== key) {
                  found.push(at("ST-03", file, r.id, `a ${String(own)} row holds no ${key} cell`));
                }
              }
            }
            return found;
          }),
        ),
      ),
  },
  {
    id: "ST-04",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap(({ source: { file, data } }) =>
        data.subtopics.flatMap((s) =>
          s.blocks.flatMap((b) =>
            b.type !== "table"
              ? []
              : b.rows.flatMap((r) =>
                  Object.entries(r.cells)
                    .filter(([key, cell]) => key !== b.columns[0]?.key && typeof cell === "object" && !Array.isArray(cell))
                    .map(([key]) => at("ST-04", file, r.id, `the ${key} cell holds forms; a sentence names its row alone`)),
                ),
          ),
        ),
      ),
  },
  {
    id: "ST-05",
    check: () =>
      Object.entries(MARKS)
        .filter(([, info]) => !/^(?:seen|heard|read)\b/.test(info.why))
        .map(([name]) => ({
          rule: "ST-05",
          file: "scripts/v1/marks.ts",
          id: name,
          message: "the mark records why it exists: what the reader sees or hears, or what reads it",
        })),
  },
  {
    id: "ST-07",
    check: (lint, scope) =>
      textsIn(lint, scope).flatMap((t) =>
        (t.ipa
          ? [plain(t.runs)]
          : marksOf(t.runs)
              .filter(({ mark }) => mark.name === "ipa")
              .map(({ mark }) => plain(mark.content))
        )
          .filter((ipa) => /[/[\]()0-9A-Z]/.test(ipa))
          .map((ipa) => problem("ST-07", t, `the ipa mark holds its symbols alone, not "${ipa}"`)),
      ),
  },
  {
    id: "ST-13",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap((t) => {
        const subtopics = t.source.data.subtopics.map((s) => s.id);
        const errors = [
          ...t.source.data.errors.map((e) => ({ e, file: t.source.file })),
          ...t.languages.flatMap((l) => (l.data.errors ?? []).map((e) => ({ e, file: l.file }))),
        ];
        return errors.filter(({ e }) => !subtopics.includes(e.in)).map(({ e, file }) => at("ST-13", file, e.id, `no subtopic is ${e.in}`));
      }),
  },
  {
    id: "ER-01",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap((t) => {
        const seen = new Map<string, string>();
        const all = [
          ...t.source.data.errors.map((e) => ({ e, file: t.source.file })),
          ...t.languages.flatMap((l) => (l.data.errors ?? []).map((e) => ({ e, file: l.file }))),
        ];
        return all.flatMap(({ e, file }) => {
          const key = e.wrong.normalize("NFC").toLowerCase().trim();
          const first = seen.get(key);
          seen.set(key, first ?? e.id);
          return first === undefined
            ? []
            : [at("ER-01", file, e.id, `the error is written once, as ${first}, with every language whose speakers make it`)];
        });
      }),
  },
  {
    id: "ER-05",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap((t) =>
        t.languages.flatMap(({ file, data }) =>
          (data.errors ?? []).flatMap((e) => [
            ...(e.speakers[data.language] === undefined
              ? [at("ER-05", file, e.id, `the error names ${data.language} among its speakers`)]
              : []),
            ...(e.after === undefined ? [at("ER-05", file, e.id, "the error names the source error it follows in after:")] : []),
          ]),
        ),
      ),
  },
  {
    id: "LA-08",
    check: (lint, scope) =>
      topicsOf(lint, scope.courses).flatMap((t) =>
        t.languages.flatMap(({ file, data }) => {
          const ids = translatedIds(data);
          return Object.keys(data.fingerprints ?? {})
            .filter((id) => !ids.includes(id))
            .map((id) => at("LA-08", file, id, "a fingerprint belongs to a sentence the file translates"));
        }),
      ),
  },
];
