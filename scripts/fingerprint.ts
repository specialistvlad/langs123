// The text a topic's translations follow: its explanations in the source language, the first explanation
// language of site.yaml, and its text in the language being learned. A fingerprint holds one short hash per
// part — the title and summary, the cheatsheet, then each section — so a change names the parts it touched.
import { createHash } from "node:crypto";
import { topicTexts } from "./content.ts";
import { EXPLAIN_CODES, type Explain, type Topic } from "./lib.ts";
import { isLocalized, plainText, reading, textIn } from "./text.ts";

export const SOURCE: Explain = EXPLAIN_CODES[0] ?? "en";

// Text with each localized piece inside it, such as a slot's name in an example, in the source language
// alone: a translation added there leaves the source as it is.
function sourceOnly(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sourceOnly);
  if (typeof v !== "object" || v === null) return v;
  if (isLocalized(v)) return (v as Record<string, unknown>)[SOURCE];
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sourceOnly(x)]));
}

const hash = (texts: string[]): string => createHash("sha256").update(texts.join("\n")).digest("hex").slice(0, 6);

// One hash per part of the source text, in page order.
export function sourceParts(topic: Topic): string[] {
  const parts: string[][] = [[], [], ...topic.sections.map((): string[] => [])];
  for (const t of topicTexts(topic, [SOURCE])) {
    // Text that serves no reader of the source language, such as an error row for other speakers, is left out.
    if (t.langs.length === 0) continue;
    const section = /^sections\[(\d+)\]/.exec(t.path)?.[1];
    const n = t.path.startsWith("cheatsheet") ? 1 : section === undefined ? 0 : Number(section) + 2;
    parts[n]?.push(JSON.stringify(sourceOnly(t.text)));
  }
  return parts.map(hash);
}

export const fingerprint = (topic: Topic): string => sourceParts(topic).join(" ");

// The parts whose source text differs from a fingerprint, named as the page numbers them: the title and
// summary, 00 Cheatsheet, 01 and on with their source titles.
export function changedParts(topic: Topic, stamp: string): string[] {
  const now = sourceParts(topic);
  const then = stamp.split(" ");
  const name = (n: number): string => {
    if (n === 0) return "the title and summary";
    if (n === 1) return "00 Cheatsheet";
    const section = topic.sections[n - 2];
    const title = section === undefined ? "" : ` ${plainText(textIn(section.title, SOURCE), reading(SOURCE, false))}`;
    return `${String(n - 1).padStart(2, "0")}${title}`;
  };
  const changed: string[] = [];
  for (let n = 0; n < now.length; n++) if (now[n] !== then[n]) changed.push(name(n));
  if (then.length > now.length) changed.push(`${then.length - now.length} section(s) removed`);
  return changed;
}
