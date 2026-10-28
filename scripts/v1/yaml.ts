// Writes the new library's files in the samples' style, so a tool that rewrites a file keeps it as a writer reads
// it: a map or a list that fits its line stands in flow style, `{ id: x, text: "…" }`, every other one in block
// style, keys in their order, and a string quoted only where YAML would read it otherwise. Reading the text back
// gives the same value (scripts/v1/yaml.test.ts).

const WIDTH = 140;
// A string YAML reads as something else, or that a plain scalar can't hold.
const SPECIAL =
  /^(?:true|false|yes|no|on|off|null|~|[-+]?(?:\d[\d_]*(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?|0x[0-9a-f]+|0o[0-7]+|\.inf|\.nan|\d{4}-\d\d-\d\d.*)$/i;
const PLAIN_START = /^[^\s\-?:,[\]{}#&*!|>'"%@`]/;

function plain(text: string, flow: boolean): boolean {
  if (text === "" || SPECIAL.test(text) || !PLAIN_START.test(text) || /\s$/.test(text) || text.includes("\n")) return false;
  if (text.includes(": ") || text.includes(" #") || text.endsWith(":")) return false;
  return !flow || !/[,[\]{}]/.test(text);
}

const scalar = (value: unknown, flow: boolean): string => {
  if (typeof value === "string") return plain(value, flow) ? value : JSON.stringify(value);
  return typeof value === "number" || typeof value === "boolean" ? String(value) : "null";
};

const isMap = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isNode = (value: unknown): value is object => typeof value === "object" && value !== null;

// The value in flow style, on one line.
function flowOf(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(flowOf).join(", ")}]`;
  if (isMap(value)) {
    const entries = Object.entries(value).map(([k, v]) => `${scalar(k, true)}: ${flowOf(v)}`);
    return entries.length === 0 ? "{}" : `{ ${entries.join(", ")} }`;
  }
  return scalar(value, true);
}

// Flow style where it fits the line and is or holds no list of maps; an empty map or list always.
function fits(value: object, indent: number, prefix: number): string | undefined {
  const text = flowOf(value);
  if (Object.keys(value).length === 0) return text;
  const children: unknown[] = Object.values(value);
  const listOfMaps = [value, ...children].some((v) => Array.isArray(v) && v.some(isMap));
  return !listOfMaps && indent + prefix + text.length <= WIDTH ? text : undefined;
}

function block(value: object, indent: number): string[] {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) => {
      if (!isNode(item)) return [`${pad}- ${scalar(item, false)}`];
      const flow = fits(item, indent, 2);
      if (flow !== undefined) return [`${pad}- ${flow}`];
      const lines = block(item, indent + 2);
      return [`${pad}- ${(lines[0] ?? "").trimStart()}`, ...lines.slice(1)];
    });
  }
  return Object.entries(value).flatMap(([key, v]) => {
    const head = `${pad}${scalar(key, false)}:`;
    if (!isNode(v)) return [`${head} ${scalar(v, false)}`];
    const flow = fits(v, indent, head.length - indent + 1);
    return flow === undefined ? [head, ...block(v, indent + 2)] : [`${head} ${flow}`];
  });
}

// The text of a file holding the value, after its header comment.
export const toYaml = (value: object, header = ""): string => `${header}${block(value, 0).join("\n")}\n`;

// The comment lines a file opens with, kept when a tool rewrites it.
export const headerOf = (text: string): string => /^(?:#.*\n)*/.exec(text)?.[0] ?? "";
