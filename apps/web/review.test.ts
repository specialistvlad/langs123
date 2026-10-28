// The review preview over the samples: every finding's element is one the reading draws, so each view pins all it shows;
// a finding's card reads fixed, declined or open; the entries carry each draft's status, reviews, flags and problems; and
// the pages hold the queue by wave with every draft under it and a draft per topic with its head and its pins.
import { expect, test } from "bun:test";
import { exportLibrary } from "../../scripts/export.ts";
import { queueOf } from "../../scripts/review/queue.ts";
import { checkRoot } from "../../scripts/v1/check.ts";
import { SAMPLES_ROOT } from "../../scripts/v1/load.ts";
import type { Context } from "./context.ts";
import { REVIEW, reviewPages } from "./pages/review.ts";
import { anchorsOf, card, type ReviewEntry, type ReviewFinding, shown } from "./review.ts";
import { reviewEntries } from "./review-data.ts";
import { draft, languagesOf, summary } from "./review-view.ts";
import { Words } from "./reading-words.ts";

const v1 = await exportLibrary({ library: "v1", root: SAMPLES_ROOT, drafts: true });
const { library, problems } = await checkRoot(SAMPLES_ROOT);
const entries = reviewEntries(library, problems, queueOf(library));
const words = Words.of(v1.library, "en");
// A draft outside the queue, with no topic the export holds.
const outside: ReviewEntry = {
  topic: "en.nowhere",
  course: "en",
  slug: "nowhere",
  wave: "A1",
  status: "draft",
  writer: { session: "s", model: "m" },
  reviews: [],
  flagged: [],
  reads: [],
  problems: [],
  findings: [],
};
const topicOf = (id: string) => v1.courses.flatMap((c) => c.topics).find((t) => t.id === id);

test("the entries carry each draft's status, writer, reviews by model, flagged rules, queue and findings", () => {
  expect(entries.map((e) => e.topic).sort()).toEqual(v1.courses.flatMap((c) => c.topics.map((t) => t.id)).sort());
  for (const e of entries) {
    expect(e.status).toBe("draft");
    expect(e.writer.model).not.toBe("");
    expect(e.reviews.reduce((n, r) => n + r.runs, 0)).toBeGreaterThan(0);
    expect(e.findings.every((f) => f.model !== "" && f.run >= 1)).toBe(true);
    if (e.flagged.length > 0) expect(e.why).toBe("flagged");
  }
});

test("a draft carries the check's problems in its folder alone, each with its rule and element where it names them", () => {
  const found = [
    { file: "library/samples/en/present-simple/uk.yaml", rule: "XX-01", id: "forms.fact", message: "m" },
    { file: "library/samples/en/present-simple/source.yaml", message: "n" },
    { file: "library/samples/en/alphabet/source.yaml", message: "o" },
  ];
  const present = reviewEntries(library, found, []).find((x) => x.topic === "en.present-simple");
  expect(present?.problems).toEqual([{ rule: "XX-01", id: "forms.fact", message: "m" }, { message: "n" }]);
  expect(present?.reads).toEqual([]);
});

test("every finding's element is one the reading draws, so a view of each language pins all it shows", () => {
  for (const e of entries) {
    const topic = topicOf(e.topic);
    if (topic === undefined) throw new Error(e.topic);
    const anchors = anchorsOf(topic);
    expect(e.findings.filter((f) => !anchors.has(f.at)).map((f) => f.at)).toEqual([]);
    const source = v1.library.courses.find((c) => c.code === e.course)?.source ?? e.course;
    const data = { topic, source, varieties: [], entry: e, text: words.text, names: words.names };
    for (const language of languagesOf(topic, source)) {
      const html = draft(data, language);
      expect(html.match(/<aside class="rv-card/g)?.length ?? 0).toBe(shown(e.findings, language).length);
    }
  }
});

test("a finding's card reads fixed and declined quietly, open in its own tint, with its fix, reason, model and run", () => {
  const f: ReviewFinding = { id: "f", at: "x", rule: "SH-19", text: "A {term why}.", fix: "Fix it.", model: "m", run: 2 };
  expect(card(f)).toContain('<aside class="rv-card rv-open" data-finding="f">');
  expect(card({ ...f, answer: "fixed", reason: "Done." })).toContain('class="rv-card rv-fixed"');
  expect(card({ ...f, answer: "declined", reason: "Kept." })).toContain('<p class="rv-reason">Kept.</p>');
  expect(card({ id: "g", at: "x", text: "t", model: "m", run: 1 })).not.toContain("rv-fix");
  expect(shown([f, { ...f, id: "u", language: "uk" }, { ...f, id: "j", language: "ja" }], "uk").map((x) => x.id)).toEqual(["f", "u"]);
});

test("a finding whose element the reading does not draw stands at the end, and the head names the problems", () => {
  const e = entries[0];
  const topic = e === undefined ? undefined : topicOf(e.topic);
  if (e === undefined || topic === undefined) throw new Error("no entry");
  const lost: ReviewEntry = {
    ...e,
    findings: [{ id: "lost", at: "nowhere", text: "t", model: "m", run: 1 }],
    problems: [{ rule: "XX-01", id: "a.b", message: "m" }, { message: "n" }],
    reads: ["uk"],
    why: "sampled",
  };
  const html = draft({ topic, source: "en", varieties: [], entry: lost, text: words.text, names: words.names }, "en");
  expect(html).toContain('<section class="rv-rest">');
  expect(summary(lost)).toContain("<code>a.b</code>");
  expect(summary(lost)).toContain("Sampled");
  expect(summary(outside)).toContain("No problems");
  const ownError = {
    id: "own.e",
    in: "x",
    level: "A1" as const,
    wrong: "w",
    right: "r",
    rule: { id: "own.rule", text: "t" },
    speakers: { uk: { id: "own.s", text: "t" } },
  };
  const withOwn = { ...topic, own: { uk: { blocks: [], errors: [ownError], speakers: {} } } };
  expect([anchorsOf(withOwn).get("own.rule"), anchorsOf(withOwn).get("own.s")]).toEqual(["own.e", "own.e"]);
});

test("the pages hold the queue by wave with every draft under it, and a draft per topic", () => {
  const pages: { path: string; body: string }[] = [];
  const ctx = { add: (input: { path: string; body: string }) => pages.push(input) } as unknown as Context;
  reviewPages(ctx, v1, [...entries, outside]);
  const queue = pages.find((p) => p.path === REVIEW)?.body ?? "";
  expect(queue).toContain('<h2 class="rv-wave">Wave A0</h2>');
  expect(queue).toContain('<h2 class="rv-wave">Every draft</h2>');
  expect(
    pages
      .map((p) => p.path)
      .filter((p) => p !== REVIEW)
      .sort(),
  ).toEqual(entries.map((e) => `${REVIEW}${e.topic}/`).sort());
  expect(pages.find((p) => p.path === `${REVIEW}en.present-simple/`)?.body).toContain('<script src="/review.js" defer></script>');
});
