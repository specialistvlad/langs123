# Samples

Four topics written to the new conventions ([../CONVENTIONS.md](../CONVENTIONS.md)) and the rule catalog
([../RULES.md](../RULES.md)), in a plain YAML shape that the library's schema converts once it exists:

| Folder | Topic | Shows | Written in |
|---|---|---|---|
| `en/alphabet/` | The English alphabet | an inventory, one letter per line | English, then Ukrainian and Japanese |
| `en/words-of-place/` | Words of place | a practical cluster, with its picture's data | English, then Ukrainian and Japanese |
| `en/present-simple/` | Present simple | a paradigm wide enough to split on a phone | English, then Ukrainian and Japanese |
| `es/subject-pronouns/` | Los pronombres personales de sujeto | a course written in its own language, with varieties | Spanish, then Ukrainian and English |

## Files

Each topic is a folder of one source file and one file per other explanation language:

- `source.yaml`: the topic's structure, its text in the language being learned, its explanations in the source
  language, its varieties, its levels, its errors with their speakers, and its status.
- `<language>.yaml`: that language's translations, keyed by the source's ids, and the blocks of its own.

### The source

| Field | Holds |
|---|---|
| `id`, `course`, `source` | the topic, its course and its source language |
| `status` | the topic's one status: `draft`, `in review` or `approved` |
| `nativeReview` | the source language's flag: reviewed by a native speaker, `true` or `false` |
| `title`, `definition` | the title and the one-sentence definition, each `{ id, text }` |
| `essence` | part 00: its lines, each with its `id`, the subtopic it points `to`, and its content |
| `subtopics` | parts 01 onward, each with its `id`, `level`, `title` and `blocks` |
| `errors` | the common errors, each with its `id`, the subtopic it sits `in`, `wrong`, `right`, `rule` and `speakers` |
| `picture` | the data of the topic's picture, where it has one |

A subtopic's blocks:

| `type` | Holds |
|---|---|
| `fact` | the rule: `text`, a list of sentences |
| `list` | `items`, one per line, each with its own example |
| `example` | `items`, each an example sentence |
| `table` | a true grid: the `axes` it crosses, its `columns` and its `rows`, each cell one form or a list of forms |
| `why` | the one reason that helps a learner remember the rule: `text`, a list of sentences |

An error's `speakers` maps each language whose speakers make it to the reason, `{ id, text }`: the source or the
contrast with that language that leads its speakers to the error.

Every block, sentence, item, example and reason has an `id`, unique in its topic and kept when its text changes.
Text in the language being learned is an example's `text`, a `word`, a `wrong` form, an item's form or a cell;
every other `text` is an explanation in the source language.

A block of one variety carries `variety`; a block without it serves every variety.

### Marks

Text marks its pieces inline, as `{mark content}`:

| Mark | Marks |
|---|---|
| `{target works}` | the form the topic teaches |
| `{term E}` | a word or a letter of the language being learned inside an explanation |
| `{ipa wɜːks}` | an IPA transcription, written without its slashes |
| `{variant en-US ziː}` | the form of one variety |

Where the varieties say one thing differently, the text holds a variant of each, side by side:
`{variant en-GB zed} {variant en-US ziː}`. Marks nest: `{target {variant en-GB opposite} {variant en-US across from}}`.

### The picture

A topic's `picture` names what it shows, and the design system draws it. Words of place hold a `scene-grid`: one
cell per essence line, each placing the `figure` against the `ground` in one `place`: `contained`, `on-surface`,
`under`, `under-covered`, `front`, `back`, `beside`, `near`, `between`, `above`, `below`, `across` or `outside`.
A cell's label is its line's word and its alt text the line's example, in each of the reader's languages.

### A language file

| Field | Holds |
|---|---|
| `language` | the explanation language |
| `nativeReview` | reviewed by a native speaker: `true` or `false` |
| `text` | each source id with its text in this language: an explanation, an example's translation, a reason |
| `blocks` | the blocks of its own: facts for its readers, each placed `in` a subtopic `after` a block, each sentence with its `id` |

A translation that splits a source sentence gives a list of sentences under its id; one that joins two is keyed
by both ids, `a + b`.
