# langs123

The foundations of languages as open data: sounds, writing, numbers, dates, time and grammar, every
line marked with its CEFR level. Each language being learned is explained in the explanation
languages it lists, so the library grows toward N languages, each explained in N languages. It holds
English, Spanish and Ukrainian from A0 to C2, each explained in English, Ukrainian, Spanish, Portuguese,
French, German, Italian, Polish, Turkish, Indonesian and Vietnamese. English follows the CEFR, with the
English Grammar Profile setting the level of each grammar point; Spanish follows the Instituto
Cervantes curriculum, written in Spanish, Latin American by default with Spain a switch away; Ukrainian
follows the 2024 state standard for Ukrainian as a foreign language, written in Ukrainian with every
example stress-marked. It holds French and Japanese from A0 to A2, explained in the same eleven
languages. French follows the Council of Europe reference level descriptions for French, written in
French, France by default with Québec a switch away; Japanese follows the JF Standard and the Reference
Framework for Japanese Language Education, written in English with Japanese examples in kana and kanji.

**Site:** https://langs123.com

## The library

- **Tracks.** A track is one language being learned, explained in one explanation language. One
  topic file holds a topic for each explanation language of its language, and concept keys pair the same subject
  across languages ([languages/CONVENTIONS.md](languages/CONVENTIONS.md) §1, §9).
- **Topics.** Each topic explains one part of the language system: a lead, a summary of the whole
  topic, then rules, examples and typical errors (§5, §8).
- **Levels on every line.** Each row, list item and paragraph carries its level from A0 to C2, and
  everything above it takes its range from them (§3).
- **Semantic data.** Each field names what a piece of content is, such as a paradigm, a helper verb or
  a typical error, with grammar features after UniMorph; the renderer decides how it looks (§12).
- **Checked.** JSON Schemas define every file, and `npm run check` validates the data against them and
  the conventions.
- **The new library.** `library/` is the library written again beside this one, to the rules of
  [library/RULES.md](library/RULES.md): seven courses, English, Spanish, Ukrainian, French, Japanese,
  Italian and German, each written first in its own language (English for Japanese) and explained in
  twelve explanation languages, today's eleven and Japanese; English, Spanish and Ukrainian from A0 to
  C2, French, Japanese, Italian and German from A0 to A2, each growing to C2 after that. A course's
  index draws its topics and levels from several CEFR-aligned sources for its language and names each
  with its licence; every topic is reviewed in Claude Code sessions against the catalog's questions
  (`npm run review`) before the owner approves it. It takes this library's place at its release.

The web app in `apps/web/` renders the library as a static site.

## Quick start

[Bun](https://bun.sh) runs every script.

```
bun install
npm start          # the site at http://127.0.0.1:47380, rebuilt and reloaded on every change
npm run verify     # every check CI runs
```

## Layout

```
langs123/
├── languages/                 the library: the CC BY 4.0 part of the project
│   ├── CONVENTIONS.md         rules for the data
│   ├── site.yaml              name, URLs, credit and licences, explanation languages
│   ├── levels.yaml            level scale: names, descriptions, colours
│   ├── interface.yaml         the wording every app built on the library shares, carried by the export
│   ├── curriculum.yaml        languages being learned: topics by category, and the study path
│   ├── concepts.yaml          concept keys that pair topics across languages
│   ├── schema/                JSON Schemas
│   ├── templates/topic.yaml   skeleton for a new topic
│   └── {lang}/                topics of a language being learned: {NN-section}/{topic}/topic.yaml
├── library/                   the new library, written beside languages/ until it takes its place
│   ├── RULES.md               the rule catalog every topic, index and review follows
│   ├── CONVENTIONS.md         the rules restated for writers
│   ├── schema/                the JSON Schema of its files
│   ├── samples/               four topics written to the rules
│   └── {course}/              a course: index.yaml, and {topic}/ with source.yaml and one file per language
├── api.ts                     what programs built on the library import: the build, the export, the readers
├── apps/web/                  the web app; tokens.json holds its look, the default design, and each tokens.<name>.json another
├── scripts/                   shared tooling: data loading, schema types, checks
├── ROADMAP.md                 project phases
└── build/                     generated output
```

## Commands

| Command | What it does |
|---|---|
| `npm start` | serves the sample site (`apps/web/sample.ts`) from `build/dev/` on port 47380 on every interface (open the printed network address on a phone), rebuilds it in about a second and reloads on every change, and lists the problems `npm run check` finds; a topic whose file changes joins the sample, `npm start -- <topic id>` adds one, `npm start -- --full` serves the whole library, `npm start -- --design <name>` serves it in that design, and `npm start -- --library v1 [--root library/samples]` adds the new library's topic pages at `/<explain>/<course>/v1/<topic>/` and its export in `data/v1/`, its drafts among them, and rebuilds when `library/` changes; `BUILD_DIR=build/<name> PORT=<port>` runs a second preview beside the first |
| `npm run build` | builds the whole static site into `build/web/` and stops on any page that shows unrendered text (`**`, a topic link, `undefined`); `SITE_URL=https://…` sets the public URL, `-- --design <name>` builds it in that design, and `-- --library v1 [--root <folder>]` adds the new library's pages and its export of its approved topics in `data/v1/`, from `library/` or the folder |
| `npm run export` | writes the library as one JSON file, `build/data/library.json`, described by `languages/schema/library.schema.json`: every language, topic and block with its levels, text as inline Markdown per explanation language, and the level colours of the default design, or of the one `-- --design <name>` names |
| `npm run export -- --library v1 [root] [--drafts] [--design <name>]` | writes the new library's export into `build/data/v1/`, described by `library/schema/export.schema.json` at version 0.3.0: `library.json` with the colours in each theme and the type styles of the default design, or of the one `--design` names, every course with its sections, its topics' titles, definitions, levels and reading minutes, and its study path, one file per course with its approved topics, every topic with `--drafts`, and one layer file per topic and language, `<course>/<slug>.<language>.json`, holding that language's text, example translations, own blocks and reading minutes alone, for a page built in one language to load the reader's other languages on top (7.4); text keeps the library's inline marks |
| `npm run check` | validates all data against the schemas and conventions, and names the parts of a topic whose English changed since its translations |
| `npm run check -- --library v1 [root] [--reach]` | checks the new library at `library/`, or at the root given: each file against `library/schema/`, its layout, the marks and varieties of its text, each language file's alignment with its source sentence by sentence, with the fingerprint each translation was written from, and every rule of the linter, reading the word lists of `library/words/` and `library/ja/kanji.yaml`; each problem names its rule in `library/RULES.md`; `--reach` adds the rules the whole library holds at its gates: every course, its levels and its practical clusters |
| `npm run ids -- <topic folder>…` | gives each element of a topic of the new library that lacks an id one, from its parent's id and its kind, and keeps every id already written |
| `npm run review -- <topic or course folder>… --writer <session> <model> [--model <version>] [--dry-run]` | reviews each topic of the new library that passes the check, and the index of each course folder named, in headless Claude Code sessions, with no API key in their environment: the source and the index asked twice, each language file once and again where it finds something, every question rule of the catalog asked of its part of the text; writes the review record beside the topic's source or the course's index, its report, the sessions and the flagged queue into `build/review/`; `--sources <folder>` names the sources' text, one folder per course with a file per source (its passages, each naming the index entries it fed, or a reference list) and each level's vocabulary, which the questions that read them wait on, the vocabulary questions asked of the elements whose words the lists to their level lack, each word looked up by its lemma; `--dry-run` lists each request's questions and size |
| `npm run calibrate -- [--models …] [--per-day 150] [--budget-only]` | calibrates the review's questions in Claude Code sessions on each model named: every planted case of `library/calibration/questions.yaml` in a copy of its sample, and the pairs of `library/calibration/translations/`; writes `build/review/calibration.md` with each question's cases caught and sound elements flagged, and `build/review/budget.md` from every session run |
| `npm run stamp -- <topic folder>… [--languages uk ja] [--ids …]` | records in each language file the fingerprint of every source sentence it translates, once its translations follow the source again |
| `npm run translated -- <id> [uk es]` | stamps a topic's translations as up to date with its English; `--all` stamps every topic |
| `npm test` | unit tests, and checks on the pages of the sample site, side by side; the sample uses every feature the library uses (`apps/web/sample.test.ts` names a topic to add when it does not); fails below full line and function coverage of the modules `bunfig.toml` holds to it; `bun test <file>` runs one file |
| `npm run e2e` | drives the sample's topic and track pages in one Chromium: the level filter at every level and view, the bars, sheets and panels, the variety switch and the study path; `bunx playwright install chromium` installs the browser |
| `npm run typecheck` | strict TypeScript |
| `npm run lint` | typescript-eslint's strict and stylistic type-checked rules |
| `npm run format` | Prettier; `npm run format:check` only reports |
| `npm run verify` | all of the checks above, side by side, each in a process of its own (`scripts/verify.ts`), in about 15 s; it fails when it takes longer than 60 s outside CI; CI runs it on every push and pull request |

## Writing a topic of the new library

A writer session takes a topic of `library/` from its first file to its record in this order, each step a command
of the table above:

1. The course's index places the topic first: its entry in `library/<course>/index.yaml`, with its subject, what it
   covers and its planned levels, in an index the owner has approved.
2. Write `library/<course>/<slug>/source.yaml` in the course's source language, then `npm run ids -- library/<course>/<slug>`
   gives every element without an id one and keeps those written.
3. Write one file per explanation language beside it, each translation under the source's ids, then
   `npm run stamp -- library/<course>/<slug>` records the fingerprint of each source sentence a translation follows;
   run it again for the files whose source sentences change.
4. `npm run check -- --library v1` holds the files to the schema, the layout, the marks, the alignment and every
   rule of the linter; a topic enters review once it reports no problem of its own.
5. `npm run review -- library/<course>/<slug> --writer <session> <model> [--sources <folder>]` asks the catalog's
   questions in Claude Code sessions and writes `review.yaml` beside the source, with its report in
   `build/review/<course>/<slug>.md`; `npm run review -- library/<course>` reviews the course's index the same way.
6. Answer every finding in `review.yaml`: `answer: fixed` once the text is changed (and stamped again where a source
   sentence changed), or `answer: declined` with a `reason`; a finding the record marks `again` waits for the owner.
   `npm run check` holds that each finding has its answer, and a topic with open findings can enter review again.
7. The topic's `status` moves from `draft` to `in-review` to `approved`, one step at a time, in `source.yaml` and in
   the record's `statuses` with the date and who moved it; the export and the site carry the approved topics alone.

## Contributing

Teachers, learners and native speakers keep the library correct and growing: report a mistake from
the [credits page](https://langs123.com/credits/), or change a topic in its file under `languages/` on
GitHub. [CONTRIBUTING.md](CONTRIBUTING.md) holds the rules;
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) holds the rules for the community.

## Licence

| Part | Licence |
|---|---|
| Content: everything in `languages/` | [CC BY 4.0](languages/LICENSE) |
| Content: everything in `library/` | [CC BY 4.0](languages/LICENSE) |
| Code: everything else | [MIT](LICENSE) |

Anyone may copy, adapt and sell the content, with this credit, naming any changes:

> langs123 contributors, https://langs123.com — CC BY 4.0

The site's [credits page](https://langs123.com/credits/) holds the same. The name langs123 and its
logo stay with the project, outside both licences.
