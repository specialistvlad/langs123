# langs123

The foundations of languages as open data: sounds, writing, numbers, dates, time and grammar, every
line marked with its CEFR level. Each language being learned is explained in the explanation
languages it lists, so the library grows toward N languages, each explained in N languages. It holds
English, Spanish and Ukrainian from A0 to C2, each explained in English, Ukrainian, Spanish, Portuguese,
French, German, Italian, Polish, Turkish, Indonesian and Vietnamese. English follows the CEFR, with the
English Grammar Profile setting the level of each grammar point; Spanish follows the Instituto
Cervantes curriculum, written in Spanish, Latin American by default with Spain a switch away; Ukrainian
follows the 2024 state standard for Ukrainian as a foreign language, written in Ukrainian with every
example stress-marked.

**Site:** https://langs123.com

## The library

- **Tracks.** A track is one language being learned, explained in one explanation language. One
  topic file holds a topic for each explanation language of its language, and concept keys pair the same subject
  across languages ([languages/CONVENTIONS.md](languages/CONVENTIONS.md) §1, §9).
- **Topics.** Each topic explains one part of the language system: a summary, a cheatsheet of the
  whole topic, then rules, examples and typical errors (§5, §8).
- **Levels on every line.** Each row, list item and paragraph carries its level from A0 to C2, and
  everything above it takes its range from them (§3).
- **Semantic data.** Each field names what a piece of content is, such as a paradigm, a helper verb or
  a typical error, with grammar features after UniMorph; the renderer decides how it looks (§12).
- **Checked.** JSON Schemas define every file, and `npm run check` validates the data against them and
  the conventions.

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
│   ├── interface.yaml         interface wording
│   ├── curriculum.yaml        languages being learned: topics by category, and the study path
│   ├── concepts.yaml          concept keys that pair topics across languages
│   ├── schema/                JSON Schemas
│   ├── templates/topic.yaml   skeleton for a new topic
│   └── {lang}/                topics of a language being learned: {NN-section}/{topic}/topic.yaml
├── apps/web/                  the web app
├── scripts/                   shared tooling: data loading, schema types, checks
├── ROADMAP.md                 project phases
└── build/                     generated output
```

## Commands

| Command | What it does |
|---|---|
| `npm start` | serves the sample site (`apps/web/sample.ts`) from `build/dev/` on port 47380 on every interface (open the printed network address on a phone), rebuilds it in about a second and reloads on every change, and lists the problems `npm run check` finds; a topic whose file changes joins the sample, `npm start -- <topic id>` adds one, and `npm start -- --full` serves the whole library |
| `npm run build` | builds the whole static site into `build/web/` and stops on any page that shows unrendered text (`**`, a topic link, `undefined`); `SITE_URL=https://…` sets the public URL, `UMAMI_WEBSITE_ID` adds Umami analytics |
| `npm run check` | validates all data against the schemas and conventions, and names the parts of a topic whose English changed since its translations |
| `npm run translated -- <id> [uk es]` | stamps a topic's translations as up to date with its English; `--all` stamps every topic |
| `npm test` | unit tests, and checks on the pages of the sample site, side by side; the sample uses every feature the library uses (`apps/web/sample.test.ts` names a topic to add when it does not); fails below full line and function coverage of the modules `bunfig.toml` holds to it; `bun test <file>` runs one file |
| `npm run e2e` | drives the sample's topic and track pages in one Chromium: the level filter at every level and view, the bars, sheets and panels, the variety switch and the study path; `bunx playwright install chromium` installs the browser |
| `npm run typecheck` | strict TypeScript |
| `npm run lint` | typescript-eslint's strict and stylistic type-checked rules |
| `npm run format` | Prettier; `npm run format:check` only reports |
| `npm run verify` | all of the checks above, side by side, each in a process of its own (`scripts/verify.ts`), in about 15 s; it fails when it takes longer than 60 s outside CI; CI runs it on every push and pull request |

## Contributing

Teachers, learners and native speakers keep the library correct and growing: report a mistake from
the [credits page](https://langs123.com/credits/), or change a topic with *Edit on GitHub* at the top
of its page. [CONTRIBUTING.md](CONTRIBUTING.md) holds the rules;
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) holds the rules for the community.

## Licence

| Part | Licence |
|---|---|
| Content: everything in `languages/` | [CC BY 4.0](languages/LICENSE) |
| Code: everything else | [MIT](LICENSE) |

Anyone may copy, adapt and sell the content, with this credit, naming any changes:

> langs123 contributors, https://langs123.com — CC BY 4.0

The site's [credits page](https://langs123.com/credits/) holds the same. The name langs123 and its
logo stay with the project, outside both licences.
