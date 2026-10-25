// Development server: builds the static site, serves it, rebuilds on every change and
// reloads open pages over server-sent events. Run: npm start → listens on every interface, port 47380.
// It builds the sample (sample.ts) in about a second, with every topic named after it and every topic whose
// file changes while it runs: npm start -- en.verbs.would. npm start -- --full builds the whole library.
import { watch } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { ROOT, SITE, topicId } from "../../scripts/lib.ts";
import { validate } from "../../scripts/validate/index.ts";
import { build } from "./build.ts";
import { served } from "./serve.ts";
import { SAMPLE } from "./sample.ts";

const HOST = process.env["HOST"] ?? "0.0.0.0";
const PORT = Number(process.env["PORT"] ?? 47380);
// Addresses other devices on the network can reach (phone on the same Wi-Fi).
const LAN = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i?.family === "IPv4" && !i.internal)
  .map((i) => i?.address ?? "");
const DEV_URL = `http://${HOST === "0.0.0.0" ? (LAN[0] ?? "127.0.0.1") : HOST}:${PORT}`;
// Its own output folder: `npm run build` writes build/web/ without the live-reload hook.
const OUT = join(ROOT, "build/dev");
const NO_STORE = { "Cache-Control": "no-store" };
const args = process.argv.slice(2);
const FULL = args.includes("--full");
// The topics the preview builds beyond the sample: those named on the command line, then those edited.
const shown = new Set([...SAMPLE.topics, ...args.filter((a) => !a.startsWith("--"))]);
const encoder = new TextEncoder();
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

function send(message: string): void {
  for (const client of clients) {
    try {
      client.enqueue(encoder.encode(message));
    } catch {
      clients.delete(client);
    }
  }
}

let queue = Promise.resolve();
function rebuild(reason: string): Promise<void> {
  queue = queue.then(async () => {
    const started = performance.now();
    try {
      const sample = FULL ? {} : { sample: { topics: [...shown], explain: SAMPLE.explain } };
      const count = (await build({ outDir: OUT, dev: true, siteUrl: DEV_URL, ...sample })).length;
      console.log(`built ${count} pages in ${Math.round(performance.now() - started)} ms (${reason})`);
      send("data: reload\n\n");
    } catch (error) {
      console.error(`build failed (${reason}):`, error instanceof Error ? error.message : error);
    }
    // The same validation as npm run check; problems are listed, the preview still updates.
    const problems = await validate().catch((error: unknown) => [{ where: "validation", message: String(error) }]);
    for (const p of problems) console.log(`  ✗ ${p.where}: ${p.message}`);
    if (problems.length > 0) console.log(`${problems.length} problem${problems.length === 1 ? "" : "s"}: npm run check lists the same`);
  });
  return queue;
}

await rebuild("start");

// Content and web assets trigger a rebuild; TypeScript changes restart the server (bun --watch).
let timer: ReturnType<typeof setTimeout> | undefined;
const changed = new Set<string>();
watch(ROOT, { recursive: true }, (_event, filename) => {
  if (filename === null) return;
  const file = filename;
  const relevant =
    (file.startsWith("languages/") && /\.(ya?ml|json)$/.test(file)) || /^apps\/web\/(styles\/[\w-]+\.css|client(-[\w-]+)?\.ts)$/.test(file);
  if (!relevant) return;
  const topic = /^languages\/(\w+)\/([\w-]+)\/([\w-]+)\/topic\.yaml$/.exec(file);
  if (topic) shown.add(topicId(topic[1] ?? "", topic[2] ?? "", topic[3] ?? ""));
  changed.add(file);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const reason = [...changed].join(", ");
    changed.clear();
    void rebuild(reason);
  }, 120);
});
setInterval(() => {
  send(": ping\n\n");
}, 25_000);

function fileResponse(path: string, status = 200): Response {
  return new Response(Bun.file(path), { status, headers: NO_STORE });
}

Bun.serve({
  hostname: HOST,
  port: PORT,
  idleTimeout: 0,
  async fetch(req) {
    const pathname = decodeURIComponent(new URL(req.url).pathname);

    if (pathname === "/events") {
      let self: ReadableStreamDefaultController<Uint8Array>;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          self = controller;
          clients.add(controller);
          controller.enqueue(encoder.encode(": connected\n\n"));
        },
        cancel() {
          clients.delete(self);
        },
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream", Connection: "keep-alive", ...NO_STORE } });
    }

    // As a static host serves it, the nearest missing page up the path included (serve.ts).
    const answer = await served(OUT, pathname);
    if (answer.status === 301) return new Response(null, { status: 301, headers: { Location: answer.location } });
    return fileResponse(answer.file, answer.status);
  },
});

if (HOST === "0.0.0.0") {
  console.log(`${SITE.name} → http://127.0.0.1:${PORT}/`);
  for (const address of LAN) console.log(`  on your network → http://${address}:${PORT}/`);
} else {
  console.log(`${SITE.name} → http://${HOST}:${PORT}/`);
}
