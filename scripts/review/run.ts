// The runner of a review request: one headless Claude Code session on the owner's subscription (12.5). It runs
// `claude -p` with the model named, in a scratch folder, with no tools, no project settings and no MCP servers, and
// with every provider's key left out of its environment, so the session calls no paid API. Its answer is the
// structured output the request's schema holds; its record names the session, the model that answered and its
// tokens (12.4). A session that fails runs once more, and the second attempt decides.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ANSWER_SCHEMA, type Request } from "./request.ts";

export interface Finding {
  rule: string;
  at: string;
  text: string;
  fix: string;
  confidence: "high" | "low";
}

export interface Session {
  session: string;
  // The model version that answered, as the session reports it.
  model: string;
  findings: Finding[];
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number };
  ms: number;
}

export type Runner = (request: Request, model: string) => Promise<Session>;

export const COMMAND = ["claude", "-p", "--output-format", "json", "--tools", "", "--strict-mcp-config", "--setting-sources", ""];

// The session's environment: the caller's, without a key of any model provider's API.
export const sessionEnv = (env: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter(
      (e): e is [string, string] =>
        e[1] !== undefined &&
        !/(?:API_KEY|AUTH_TOKEN|_TOKEN_KEY)$/.test(e[0]) &&
        !/^(?:ANTHROPIC|OPENAI|GEMINI|GOOGLE|MISTRAL|COHERE)_/.test(e[0]),
    ),
  );

export const sessionArgs = (request: Request, model: string): string[] => [
  ...COMMAND,
  "--model",
  model,
  "--json-schema",
  JSON.stringify(ANSWER_SCHEMA),
  "--system-prompt",
  request.system,
];

interface Reply {
  is_error?: boolean;
  session_id?: string;
  structured_output?: { findings?: Finding[] };
  modelUsage?: Record<string, unknown>;
  usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
  duration_ms?: number;
}

// The session a reply reports, or why it holds none.
export function parseReply(text: string): Session | string {
  let reply: Reply;
  try {
    reply = JSON.parse(text) as Reply;
  } catch {
    return `the session's reply is no JSON: ${text.slice(0, 200)}`;
  }
  const findings = reply.structured_output?.findings;
  if (reply.is_error === true || findings === undefined || reply.session_id === undefined) {
    return `the session answered no findings: ${text.slice(0, 200)}`;
  }
  const u = reply.usage ?? {};
  return {
    session: reply.session_id,
    model: Object.keys(reply.modelUsage ?? {}).join(", "),
    findings,
    tokens: {
      input: u.input_tokens ?? 0,
      output: u.output_tokens ?? 0,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
    },
    ms: reply.duration_ms ?? 0,
  };
}

// One attempt: a session, or why it failed.
export type Attempt = (request: Request, model: string) => Promise<Session | string>;

export const claudeAttempt: Attempt = async (request, model) => {
  const cwd = await mkdtemp(join(tmpdir(), "review-"));
  try {
    const child = Bun.spawn(sessionArgs(request, model), {
      cwd,
      env: sessionEnv(process.env),
      stdin: new TextEncoder().encode(request.prompt),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    return parseReply(out === "" ? err : out);
  } finally {
    await rm(cwd, { recursive: true });
  }
};

// A runner from an attempt: a failed attempt runs once more, and the second decides.
export const runnerOf =
  (attempt: Attempt): Runner =>
  async (request, model) => {
    const first = await attempt(request, model);
    if (typeof first !== "string") return first;
    const second = await attempt(request, model);
    if (typeof second !== "string") return second;
    throw new Error(`${request.topic}${request.language === undefined ? "" : ` (${request.language})`}: ${first}; again: ${second}`);
  };
