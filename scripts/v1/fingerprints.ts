// A fingerprint belongs to one source sentence: the first 8 hex digits of the SHA-256 of its text in NFC, marks
// included (LA-08). A language file records, under `fingerprints`, the fingerprint of each source sentence its
// translation was written from; a translation whose recorded fingerprint differs from its sentence's own is stale,
// and a changed sentence makes only its own translations stale (LA-10). The stamp tool writes the record.
import { createHash } from "node:crypto";
import type { TopicLanguageFile, TopicSource } from "../generated/library-v1.ts";
import { translated } from "./texts.ts";
import { toYaml } from "./yaml.ts";

export const fingerprint = (text: string): string => createHash("sha256").update(text.normalize("NFC")).digest("hex").slice(0, 8);

// The fingerprint of every sentence and example of the source that a language file translates.
export const sourceFingerprints = (source: TopicSource): Map<string, string> =>
  new Map(translated(source).map((p) => [p.id ?? "", fingerprint(p.text)]));

// The source ids a language file translates: each key of its text, a join's ids each.
export const translatedIds = (file: TopicLanguageFile): string[] => Object.keys(file.text).flatMap((key) => key.split(" + "));

export interface Stale {
  id: string;
  message: string;
}

// The translations of the file whose fingerprint is missing or differs from their source sentence's own.
export function staleIn(source: TopicSource, file: TopicLanguageFile): Stale[] {
  const now = sourceFingerprints(source);
  return translatedIds(file).flatMap((id): Stale[] => {
    const current = now.get(id);
    const recorded = file.fingerprints?.[id];
    if (current === undefined) return [];
    if (recorded === undefined) {
      return [{ id, message: "the translation records no fingerprint of its source sentence: run npm run stamp" }];
    }
    return recorded === current ? [] : [{ id, message: `the source sentence changed since its translation (${recorded}, now ${current})` }];
  });
}

// The file's fingerprints after stamping the ids given, or every id it translates: each takes its sentence's own.
export function stamped(source: TopicSource, file: TopicLanguageFile, ids?: string[]): Record<string, string> {
  const now = sourceFingerprints(source);
  const record = { ...file.fingerprints };
  for (const id of ids ?? translatedIds(file)) {
    const current = now.get(id);
    if (current !== undefined) record[id] = current;
  }
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

// A language file's text with its fingerprints block in place of the one it had, at its end; the rest of the
// file keeps its layout.
export function withFingerprints(text: string, record: Record<string, string>): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("fingerprints:"));
  let end = start + 1;
  while (start >= 0 && end < lines.length && /^(?:\s|$)/.test(lines[end] ?? "")) end++;
  const kept = start < 0 ? lines : [...lines.slice(0, start), ...lines.slice(end)];
  return `${kept.join("\n").trimEnd()}\n${toYaml({ fingerprints: record })}`;
}
