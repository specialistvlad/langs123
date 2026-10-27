// Test stand-in for the languages page's readers (never built into the library, whose data never falls back): a Home,
// a course page and a topic page in Ukrainian, laid out as client-languages.ts describes, where one course and one topic lack a
// language. The reader the tests give ranks Українська, English, Polski.
const HEAD = `<!doctype html><html lang="uk" data-frame><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/levels.css"><link rel="stylesheet" href="/style.css"></head>`;
const TAIL = `<script src="/client.js" defer></script></body></html>`;
const line = (course: string, explains: string): string =>
  `<button type="button" class="xl-line" data-course="${course}" data-explains="${explains}" aria-haspopup="dialog">Explained in: <b>x</b></button>`;
const card = (course: string, name: string, explains: string): string =>
  `<article class="cr-card" data-xl-card style="padding:16px"><a href="/uk/${name}/" data-course="${course}">${name}</a>${line(course, explains)}</article>`;

// The Home: English (explained in uk, en), Spanish (en, es), French (en, pt: none of Ukrainian), Japanese (ja alone).
export const HOME = `${HEAD}<body data-fixture><main class="cr-main"><div id="hm-cards">
${card("en", "english", "en uk")}
${card("es", "spanish", "es en")}
${card("fr", "french", "pt en")}
${card("ja", "japanese", "ja")}
</div><section class="xl-other" data-xl-other hidden><h2>Other</h2><p>None</p><div data-xl-other-cards></div></section>
<span data-langs-list></span></main>${TAIL}`.replace("<html", '<html data-page="home"');

const row = (slug: string, has: string): string =>
  `<li data-topic-explains="${has}"><a href="/uk/fx/f/${slug}/">${slug}</a><span data-xl-tag hidden></span></li>`;
// A course page: its line, a topic in Ukrainian and English, one in English alone.
export const COURSE = `${HEAD}<body><main class="cr-main"><h1>English</h1>${line("en", "en uk")}
<ul class="cr-card">${row("alphabet", "uk en")}${row("days", "en")}</ul><span data-langs-list></span></main>${TAIL}`.replace(
  "<html",
  '<html data-page="track"',
);

// A topic page in English that lacks Ukrainian; its course is explained in Ukrainian and English.
export const TOPIC =
  `${HEAD.replace('lang="uk"', 'lang="en"')}<body><main class="cr-main"><header data-topic-explains="en" data-course="en" data-course-explains="uk en"><h1>Days<span data-xl-tag hidden></span></h1><div data-xl-note hidden></div></header></main>${TAIL}`.replace(
    "<html",
    '<html data-page="topic"',
  );
