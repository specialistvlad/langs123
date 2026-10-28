// The inline marks of the new library's text: `{name content}`, or `{name attribute content}` for a mark that takes
// one, nestable, with `\{`, `\}` and `\\` writing a brace or a backslash. Each mark of the vocabulary records why it
// exists (ST-05): what the reader sees or hears, or the planned feature that reads it; and the text it stands in:
// the course language's, an explanation's, or any. parseMarks reads a text into runs and names each break of the
// grammar (ST-06) and each attribute out of its form (ST-08).

export type MarkName =
  "target" | "term" | "ipa" | "variant" | "l1" | "kanji" | "romaji" | "translit" | "date" | "weekday" | "time" | "numeral" | "ordinal";

export interface MarkInfo {
  why: string;
  where: "course" | "explanation" | "any";
  // The attribute a mark takes first, where it takes one: its form, and the rule an attribute out of it breaks.
  attribute?: { form: RegExp; rule: string };
}

const VALUE = "read by Lens and interactive explanations";
export const MARKS: Record<MarkName, MarkInfo> = {
  target: { why: "seen: the form the topic teaches, set apart; Lens reads it", where: "course" },
  term: { why: "seen: a word of the course language inside an explanation, in its language", where: "explanation" },
  ipa: { why: "seen between slashes and heard as IPA", where: "any" },
  variant: {
    why: "seen: the form of the reader's variety, which the Variety control chooses",
    where: "any",
    attribute: { form: /^[a-z]{2}-(?:[A-Z]{2}|\d{3})$/, rule: "NO-28" },
  },
  l1: {
    why: "seen in its language's quotes and font, and heard in its language",
    where: "explanation",
    attribute: { form: /^[a-z]{2}$/, rule: "ST-06" },
  },
  kanji: {
    why: "seen as ruby: the kanji with its reading above it",
    where: "course",
    attribute: { form: /^[\u3041-\u309f]+$/, rule: "NO-24" },
  },
  romaji: { why: "seen beside the IPA of a kana topic", where: "any" },
  translit: { why: "seen beside the IPA of a Ukrainian A0 topic", where: "any" },
  date: {
    why: `${VALUE}: its ISO date`,
    where: "course",
    attribute: { form: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/, rule: "ST-08" },
  },
  weekday: { why: `${VALUE}: its ISO weekday, Monday as 1`, where: "course", attribute: { form: /^[1-7]$/, rule: "ST-08" } },
  time: { why: `${VALUE}: its time of day`, where: "course", attribute: { form: /^(?:[01]\d|2[0-3]):[0-5]\d$/, rule: "ST-08" } },
  numeral: { why: `${VALUE}: its number`, where: "course", attribute: { form: /^-?\d+(?:\.\d+)?$/, rule: "ST-08" } },
  ordinal: { why: `${VALUE}: its number`, where: "course", attribute: { form: /^\d+$/, rule: "ST-08" } },
};

const isMarkName = (name: string): name is MarkName => Object.hasOwn(MARKS, name);

export interface Mark {
  name: MarkName;
  attribute?: string;
  content: Run[];
}
export type Run = string | Mark;

export interface MarkProblem {
  rule: string;
  message: string;
}

export interface Parsed {
  runs: Run[];
  problems: MarkProblem[];
}

export function parseMarks(text: string): Parsed {
  const problems: MarkProblem[] = [];
  const problem = (rule: string, message: string): void => {
    problems.push({ rule, message });
  };
  let at = 0;

  // Runs up to the end of the text, or up to the brace that closes the mark they stand in.
  function runs(inside: boolean): Run[] {
    const out: Run[] = [];
    let plain = "";
    const flush = (): void => {
      if (plain !== "") out.push(plain);
      plain = "";
    };
    while (at < text.length) {
      const c = text.charAt(at);
      const next = text.charAt(at + 1);
      if (c === "\\" && "{}\\".includes(next) && next !== "") {
        plain += next;
        at += 2;
      } else if (c === "}" && inside) {
        flush();
        at++;
        return out;
      } else if (c === "}") {
        problem("ST-06", `a } at ${at} closes no mark`);
        at++;
      } else if (c === "{") {
        flush();
        out.push(...mark());
      } else {
        plain += c;
        at++;
      }
    }
    flush();
    if (inside) problem("ST-06", "a mark is never closed with }");
    return out;
  }

  // One mark from its opening brace; a mark the vocabulary lacks keeps its content as plain runs.
  function mark(): Run[] {
    const name = /^[a-z0-9]*/.exec(text.slice(at + 1))?.[0] ?? "";
    at += 1 + name.length;
    if (text.charAt(at) === " ") at++;
    const takes = isMarkName(name) ? MARKS[name].attribute : undefined;
    let attribute: string | undefined;
    if (takes !== undefined) {
      attribute = /^[^\s{}]*/.exec(text.slice(at))?.[0] ?? "";
      at += attribute.length;
      if (text.charAt(at) === " ") at++;
      if (!takes.form.test(attribute)) problem(takes.rule, `{${name}} takes ${String(takes.form)} first, not "${attribute}"`);
    }
    const content = runs(true);
    if (!isMarkName(name)) {
      problem("ST-06", `{${name}} is no mark of the vocabulary`);
      return content;
    }
    if (content.length === 0) problem("ST-06", `{${name}} marks no text`);
    return [{ name, ...(attribute !== undefined && { attribute }), content }];
  }

  return { runs: runs(false), problems };
}

// The text a reader sees, without the marks: each mark's content in place.
export const plain = (runs: Run[]): string => runs.map((r) => (typeof r === "string" ? r : plain(r.content))).join("");

// Every mark of the runs, outermost first, each with the marks it stands inside.
export function marksOf(runs: Run[], inside: Mark[] = []): { mark: Mark; inside: Mark[] }[] {
  return runs.flatMap((r) => (typeof r === "string" ? [] : [{ mark: r, inside }, ...marksOf(r.content, [...inside, r])]));
}

// The swaps of the runs: each run of variant marks side by side, joined by one space.
export function swapsOf(runs: Run[]): Mark[][] {
  const swaps: Mark[][] = [];
  let current: Mark[] = [];
  runs.forEach((r, n) => {
    if (typeof r !== "string" && r.name === "variant") current.push(r);
    else if (r !== " " || typeof runs[n + 1] === "string" || current.length === 0) {
      if (current.length > 0) swaps.push(current);
      current = [];
    }
  });
  if (current.length > 0) swaps.push(current);
  return [...swaps, ...runs.flatMap((r) => (typeof r === "string" ? [] : swapsOf(r.content)))];
}
