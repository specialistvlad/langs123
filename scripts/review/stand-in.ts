// A stand-in for the review's sessions in tests: a finding, a session holding findings, and a runner that answers each
// request's runs from a list, by its language, or by its kind for the index.
import type { Finding, Runner, Session } from "./run.ts";

export const finding = (rule: string, at: string, confidence: Finding["confidence"] = "high"): Finding => ({
  rule,
  at,
  text: "It breaks.",
  fix: "Fixed.",
  confidence,
});
export const session = (findings: Finding[], n = 1): Session => ({
  session: `s${String(n)}`,
  model: "claude-sonnet-5-5",
  findings,
  tokens: { input: 10, output: 5, cacheRead: 20, cacheWrite: 0 },
  ms: 2000,
});
export const scripted = (answers: Record<string, Finding[][]>): Runner => {
  const seen: Record<string, number> = {};
  return (request) => {
    const k = request.kind === "index" ? "index" : (request.language ?? "source");
    seen[k] = (seen[k] ?? 0) + 1;
    return Promise.resolve(session(answers[k]?.[(seen[k] ?? 1) - 1] ?? [], seen[k]));
  };
};
