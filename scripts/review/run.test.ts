// Gate 4b check 12: a review session is a headless Claude Code session with its model named, its environment holding
// no provider's key, and no module of the review calling a model's HTTP API. A stand-in `claude` on the PATH shows
// the arguments and the environment a session receives; a failed session runs once more and the second decides.
import { afterAll, expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request } from "./request.ts";
import { claudeAttempt, COMMAND, parseReply, runnerOf, type Session, sessionArgs, sessionEnv } from "./run.ts";

const REQUEST: Request = { kind: "source", topic: "en.letters", system: "Review.", prompt: "The text.", asked: {}, pending: [] };
const reply = (extra: object = {}): string =>
  JSON.stringify({
    session_id: "s1",
    structured_output: { findings: [] },
    modelUsage: { "claude-sonnet-5-5": {} },
    usage: { input_tokens: 2, output_tokens: 3, cache_read_input_tokens: 5, cache_creation_input_tokens: 7 },
    duration_ms: 900,
    ...extra,
  });

const bin = await mkdtemp(join(tmpdir(), "claude-"));
afterAll(async () => {
  await rm(bin, { recursive: true });
});

test("the session runs `claude -p` with the model named, no tools, no project settings and no MCP servers", () => {
  expect(COMMAND).toEqual(["claude", "-p", "--output-format", "json", "--tools", "", "--strict-mcp-config", "--setting-sources", ""]);
  const args = sessionArgs(REQUEST, "claude-sonnet-5-5");
  expect(args.slice(COMMAND.length, COMMAND.length + 2)).toEqual(["--model", "claude-sonnet-5-5"]);
  expect(args).toContain("--json-schema");
  expect(args.at(-2)).toBe("--system-prompt");
});

test("the session's environment holds no key of a model provider's API", () => {
  const env = sessionEnv({
    PATH: "/bin",
    HOME: "/home",
    ANTHROPIC_API_KEY: "k",
    ANTHROPIC_AUTH_TOKEN: "t",
    OPENAI_API_KEY: "k",
    GEMINI_API_KEY: "k",
    GOOGLE_CLOUD_PROJECT: "p",
    SOME_API_KEY: "k",
    UNSET: undefined,
  });
  expect(env).toEqual({ PATH: "/bin", HOME: "/home" });
});

test("no module of the review calls a model's HTTP API", async () => {
  const calls: string[] = [];
  for await (const path of new Bun.Glob("*.ts").scan({ cwd: import.meta.dir })) {
    if (path.endsWith(".test.ts")) continue;
    const text = await Bun.file(join(import.meta.dir, path)).text();
    if (/fetch\(|api\.anthropic\.com|openai\.com|googleapis\.com|@anthropic-ai\/sdk/.test(text)) calls.push(path);
  }
  expect(calls).toEqual([]);
});

test("a stand-in claude receives the prompt, and no provider's key", async () => {
  const script = `#!/bin/sh\nprompt=$(cat)\nkey=\${ANTHROPIC_API_KEY:-none}\nprintf '%s' '{"session_id":"stand-in","structured_output":{"findings":[{"rule":"SH-04","at":"def","text":"'"$prompt"' '"$key"'","fix":"x","confidence":"high"}]},"modelUsage":{"claude-sonnet-5-5":{}}}'\n`;
  await writeFile(join(bin, "claude"), script);
  await chmod(join(bin, "claude"), 0o755);
  const path = process.env["PATH"];
  process.env["PATH"] = `${bin}:${path ?? ""}`;
  process.env["ANTHROPIC_API_KEY"] = "secret";
  try {
    const session = (await claudeAttempt(REQUEST, "claude-sonnet-5-5")) as Session;
    expect(session.session).toBe("stand-in");
    expect(session.findings[0]?.text).toBe("The text. none");
  } finally {
    process.env["PATH"] = path;
    Reflect.deleteProperty(process.env, "ANTHROPIC_API_KEY");
  }
});

test("a reply gives its session, model, findings and tokens, or names why it holds none", () => {
  expect(parseReply(reply())).toEqual({
    session: "s1",
    model: "claude-sonnet-5-5",
    findings: [],
    tokens: { input: 2, output: 3, cacheRead: 5, cacheWrite: 7 },
    ms: 900,
  });
  expect(parseReply(JSON.stringify({ session_id: "s", structured_output: { findings: [] } }))).toMatchObject({
    model: "",
    tokens: { input: 0 },
    ms: 0,
  });
  expect(parseReply("not json")).toStartWith("the session's reply is no JSON");
  expect(parseReply(reply({ is_error: true }))).toStartWith("the session answered no findings");
});

test("a failed session runs once more, and the second attempt decides", async () => {
  let n = 0;
  const flaky = runnerOf(() => Promise.resolve(++n === 1 ? "failed" : (parseReply(reply()) as Session)));
  expect((await flaky(REQUEST, "m")).session).toBe("s1");
  const failing = runnerOf(() => Promise.resolve("failed"));
  expect(failing({ ...REQUEST, language: "uk" }, "m")).rejects.toThrow("en.letters (uk): failed; again: failed");
  expect(failing(REQUEST, "m")).rejects.toThrow("en.letters: failed");
});
