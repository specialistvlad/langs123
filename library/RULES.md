# Rules

Every rule a v1 topic, index and review follows, each with its check: the schema, the linter, one typed question about one block or one sentence, or a test of the apps, the build or the pipeline.

## Covers

| Requirement | Name |
| --- | --- |
| 2.1 | New conventions replace `core/languages/CONVENTIONS.md` at v1 |
| 2.2 | Their brief is the owner's review of today's topics |
| 2.3 | One set of conventions holds for every course and every explanation language |
| 2.4 | A topic states facts clearly |
| 2.5 | A topic adds a short note on why a rule is so where the reason helps a learner remember it, at most one per subtopic |
| 2.6 | Errors belong to their speakers |
| 2.7 | The opening defines the subject |
| 2.8 | One shape for every topic |
| 2.9 | Written for a first-time reader |
| 2.10 | Each language keeps its norms |
| 3.1 | First each topic is defined |
| 3.2 | The index is built from several international, CEFR-aligned sources for that language, merged and adapted to langs123 |
| 3.3 | The index also holds practical topics |
| 3.4 | The index is reviewed with the owner and approved before its topics are written |
| 3.5 | Levels stay on the CEFR scale, A0 to C2 (owner, 27 Oct) |
| 3.6 | The rework builds seven courses |
| 3.7 | One index file per course |
| 5.1 | An index and a topic each move from draft to in review to approved |
| 5.2 | A reviewer from another model family than the writer's checks each draft against the conventions and the sources, and the writer fixes what it finds |
| 5.3 | The owner approves the conventions, every index, the samples and each level wave |
| 5.4 | A topic carries a flag for each language it is written in |
| 6.1 | Adding a course, or an explanation language, takes data and text alone, with no code change, and the checks name every gap |
| 6.2 | The content session leads the writing; parallel writers, one per course, work under it (owner, 27 Oct) |
| 6.3 | Every explanation language stays aligned with the course's source block by block, and inside each block sentence by sentence |
| 6.4 | Each course is written first in its own language, Japanese in English, and the other explanation languages translate it (owner, 27 Oct) |
| 9.5 blocks | Blocks follow the topic's shape |
| 9.5 marks | A mark exists where the reader sees or hears the text differently, or where a planned feature (Lens, interactive explanations) reads it |
| 9.5 roles | A subtopic role exists only where it changes the order or the layout |
| 9.5 levels | A level sits on the subtopic, so a chosen level shows or hides whole subtopics |

## The catalog

### CA-01 Every rule reaches the writer
Requirements: 2.1
Rule: The conventions text restates every rule of this catalog by its id, in the order a writer meets them: what a topic is, how an explanation sounds, where it takes the reader.
Not this: The intro, cheatsheet and section-menu rules of §5, §7 and §8, with no id and no named check (today's CONVENTIONS.md).
Check: lint

### CA-02 A rule says what to do
Requirements: 2.2
Rule: A rule statement says what holds, what a thing is or does; its contrast stands in Not this.
Not this: "A topic is a short path through its sections, not a set of overlapping views" (§7 of today's CONVENTIONS.md).
Check: question
Question: [sentence] Yes or no: does this rule statement say what holds, without defining by contrast or by prohibition?

### CA-03 A rule carries a negative example
Requirements: 2.2
Rule: Every rule quotes a Not this from today's pages, short and exact, with its file in parentheses.
Not this: "Tables first. Use text only for a rule that a table cannot hold." (§7 of today's CONVENTIONS.md), a rule with no page that breaks it.
Check: lint

### CA-04 A rule names one check
Requirements: 2.2
Rule: Every rule names exactly one check: schema, lint, question or test; a question asks one typed question about one block or one sentence, and a test names a test of the apps, the build or the pipeline.
Not this: "`npm run check` enforces them." (the opening of today's CONVENTIONS.md), one line for every rule at once.
Check: lint

### CA-05 One set for every course
Requirements: 2.3
Rule: A rule holds for every course and every explanation language, or for the courses its Courses line and the languages its Languages line list, and the catalog is the one place that sets rules.
Not this: "# Written in English, its source, and translated for the ten languages after it." (a course's rule in a comment of curriculum.yaml).
Check: lint

## Topic shape

### SH-01 The title names the subject
Requirements: 2.8
Rule: The title is the name of the subject, in one phrase of at most six words; Japanese is measured in characters, at most 12.
Not this: "Modal Verbs in the Past: must have, should have" (en/06-modals/modal-perfect).
Check: lint

### SH-02 The topic reads in one order
Requirements: 2.8
Rule: A topic holds, in this order, its title, its definition, the essence as part 00, its subtopics as parts 01 onward, and its common errors.
Not this: A lead, then "A letter's name differs from its sound in a word: A is said /eɪ/, but apple starts with /æ/." as a rule to get right, then a Summary table, then the sections (en/01-foundations/alphabet-spelling).
Check: schema

### SH-03 The definition is one sentence
Requirements: 2.7, 2.8
Rule: The definition is one sentence under the title, of at most 160 characters (80 in Japanese), ending with a full stop (。 in Japanese) and starting with a capital letter where the language has capitals; Japanese has none.
Not this: "The 26 letters of the English alphabet and their names, used to spell words aloud." followed by a second sentence of the intro (en/01-foundations/alphabet-spelling).
Check: lint
Source: §5 Topic structure (the lead)

### SH-04 The definition has a verb
Requirements: 2.7
Rule: The definition is a complete sentence with a main verb.
Not this: "Numbers from 0 to a million, and the ordinals first, second, third." (en/01-foundations/numbers).
Check: question
Question: [sentence] Yes or no: does this sentence have a main verb?
Source: §5 Topic structure (the lead is one sentence with a verb)

### SH-05 The definition says what the subject is
Requirements: 2.7
Rule: The definition says what the subject is.
Not this: "The 26 letters of the English alphabet and their names, used to spell words aloud." (en/01-foundations/alphabet-spelling), which says what the page covers.
Check: question
Question: [sentence] Yes or no: does this sentence say what the subject is, rather than what the page covers?

### SH-06 The definition names the key characteristics
Requirements: 2.7
Rule: The definition names the characteristics that set the subject apart from its neighbours.
Not this: "The six vowel sounds, hard and soft, voiced and voiceless consonants, and the sounds дж and дз." (uk/01-foundations/vowels-consonants), a list of parts with no characteristic named.
Check: question
Question: [sentence] Yes or no: does this sentence name at least one characteristic that sets the subject apart from related subjects?

### SH-07 Every opening sentence speaks about the subject
Requirements: 2.7
Rule: Every sentence of the opening speaks about the subject itself.
Not this: "A letter's name differs from its sound in a word: A is said /eɪ/, but apple starts with /æ/." (en/01-foundations/alphabet-spelling), a detail of letter names after a sentence about the page.
Check: question
Question: [sentence] Yes or no: does this sentence speak about the subject itself?

### SH-08 The opening speaks of the subject
Requirements: 2.7
Rule: The opening states what the subject is and does, and every word of it concerns the subject.
Not this: "Every tense on one page, placed by time and aspect, with form, main use, example and time words." (en/05-tenses/tense-map).
Check: lint
Source: §5 Topic structure (sentences free of page tours)

### SH-09 The opening uses the words of the topic's lowest level
Requirements: 2.7, 2.9
Rule: The definition uses words and terms a reader at the topic's lowest level knows, apart from the term it defines.
Not this: "Telling the time: hours are feminine ordinal numbers, minutes are cardinal numbers, and о says when something happens." (uk/01-foundations/telling-time).
Check: question
Question: [sentence] Yes or no: does this sentence use only words and terms a reader at the topic's lowest level knows, apart from the term it defines?
Source: §5 Topic structure (words at the topic's lowest level)

### SH-10 The essence shows the subject
Requirements: 2.8
Rule: Part 00 is the essence: the subject at a glance, in its shortest complete form, set out as the subject itself (the alphabet's essence sets out the alphabet, one letter per line).
Not this: Part 00 "Summary" of the alphabet, with the row "Trap | the name's vowel tells G from J and E from I" (en/01-foundations/alphabet-spelling).
Check: question
Question: [block] Yes or no: does this block set out the subject itself in its shortest complete form?

### SH-11 The essence is a list
Requirements: 2.8, 9.5 blocks
Rule: The essence block holds one line per point of the subject.
Not this: The alphabet's `usage` table of Point, Rule and Example under `cheatsheet:` (en/01-foundations/alphabet-spelling).
Check: schema
Source: §8 Cheatsheets

### SH-12 Each essence line points to a subtopic
Requirements: 2.8
Rule: Each essence line points to the one subtopic that expands it, and every subtopic is pointed to by at least one essence line.
Not this: The Summary row "B C D E G P T V · names end in /iː/" with no pointer to a section (en/01-foundations/alphabet-spelling).
Check: lint

### SH-13 An essence line takes its subtopic's level
Requirements: 2.8, 9.5 levels
Rule: An essence line carries the level of the subtopic it points to, and shows or hides with it.
Not this: The cheatsheet row `{ level: A0, point: { letter: B C D E G P T V }` with a level of its own (en/01-foundations/alphabet-spelling).
Check: lint

### SH-14 Subtopics are numbered from 01
Requirements: 2.8
Rule: The subtopics carry the numbers 01, 02 and so on, in reading order, after part 00.
Not this: The sections of a topic with no number, ordered by their place in the file and tagged `role: own` (en/01-foundations/alphabet-spelling).
Check: schema

### SH-15 A subtopic expands one point
Requirements: 2.8
Rule: A subtopic expands one point of the essence.
Not this: "Punctuation and Capital Letters" (en/01-foundations/punctuation), one topic carrying two subjects.
Check: question
Question: [block] Yes or no: does this block state the one point of the essence that its subtopic expands?

### SH-16 A subtopic states the fact, then an example
Requirements: 2.8, 2.4
Rule: A subtopic gives its fact in one block and its example in the block after it.
Not this: "A letter's name and its sound in a word can differ: A is /eɪ/, but apple starts with /æ/." (en/01-foundations/alphabet-spelling), the fact and its example in one sentence.
Check: lint
Source: §7 Tables and writing style (an example is a sentence someone says)

### SH-17 A why is a block of its own
Requirements: 2.5
Rule: A reason stands in a why block after the example, and the fact is stated in its own block.
Not this: "An asserted reason is a real fact, so the verb is in the indicative." (es/12-oracion/causales), the reason welded to the rule.
Check: schema
Source: §5 Topic structure (Sections teach)

### SH-18 A subtopic holds at most one why
Requirements: 2.5
Rule: A subtopic holds at most one why block.
Not this: "A rule gives its reason in a clause wherever the language has one" (§5 of today's CONVENTIONS.md), a reason on every rule.
Check: lint
Source: §5 Topic structure (Sections teach)

### SH-19 A why helps a learner remember
Requirements: 2.5
Rule: A why block gives the reason that makes the fact easy to remember, such as how the form is built or what it literally means.
Not this: (written case) A reason that restates the rule in other words, such as a why block saying a form is used because it is the form for that use.
Check: question
Question: [block] Yes or no: does this why block give a reason that helps a learner remember the fact it follows?
Source: §5 Topic structure (Sections teach)

### SH-20 A why is neutral
Requirements: 2.5
Rule: A why block states its reason in a neutral voice, and the facts carry the topic.
Not this: "In informal Latin American speech you will hear cuál before a noun, as in ¿Cuál libro quieres?; the rule is qué:" (es/12-oracion/preguntas-negacion), a note that addresses the reader.
Check: question
Question: [block] Yes or no: does this why block state its reason without addressing the reader, advising or judging?

### SH-21 A subtopic states facts
Requirements: 2.4
Rule: A subtopic states the rule, the forms and the use of its point as facts.
Not this: "Everyday writing uses digits (1, 2, 3); kanji numerals appear later in this topic." (ja/01-foundations/numbers), a tour in place of a fact.
Check: question
Question: [block] Yes or no: does this block state a rule, a form or a use of the subject as a fact?

### SH-22 One subject per topic
Requirements: 2.8
Rule: Every block of a topic belongs to the subject its title names.
Not this: "Punctuation and Capital Letters" (en/01-foundations/punctuation), a title naming two subjects.
Check: question
Question: [block] Yes or no: does this block belong to the subject its topic's title names?
Source: §5 Topic structure (One subject per topic)

### SH-23 Each fact appears once
Requirements: 2.8
Rule: A fact appears in one subtopic; the essence points to it and the common errors name it.
Not this: "a letter's name can differ from its sound in a word" in the alphabet's Summary, its rule to get right and its list (en/01-foundations/alphabet-spelling).
Check: question
Question: [block] Yes or no: does this block state a fact that no other subtopic of its topic states?
Source: §7 Tables and writing style (Each fact appears once)

### SH-24 Common errors close the topic
Requirements: 2.8
Rule: The topic ends with its part named Common errors, which holds the errors of the reader's languages.
Not this: The section titled "Typical errors" with `role: errors` (en/07-sentence-building/participle-clauses).
Check: schema

## Voice

### VO-01 A sentence holds at most 20 words
Requirements: 2.4
Rule: A sentence of explanation holds at most 20 words; Japanese is measured in characters, at most 50.
Not this: "In most of Latin America, an action finished earlier today takes the preterite; Andean Spanish (Peru, Bolivia, highland Ecuador) takes the perfect, as Spain does:" (es/07-pasados/preterito-perfecto).
Check: lint
Source: §7 Tables and writing style (One rule per list item, at most 20 words)

### VO-02 An explanation is in the present tense
Requirements: 2.4
Rule: The sentences of an explanation are in the present tense.
Not this: "In informal Latin American speech you will hear cuál before a noun" (es/12-oracion/preguntas-negacion).
Check: question
Question: [sentence] Yes or no: is the verb of this explanation sentence in the present tense?
Source: §1 Languages and variants (short sentences, present tense and plain words)

### VO-03 An explanation uses plain words
Requirements: 2.4, 2.9
Rule: An explanation sentence uses words a reader at its subtopic's level knows, apart from the term it explains.
Not this: "School grammar sorts nouns into four declensions." (uk/02-nouns-cases/declension-alternations).
Check: question
Question: [sentence] Yes or no: does this sentence use only words a reader at its subtopic's level knows, apart from the term it explains?
Source: §1 Languages and variants (short sentences, present tense and plain words)

### VO-04 A subtopic speaks of the subject
Requirements: 2.4
Rule: The sentences of a subtopic speak about the subject.
Not this: "Romaji spells Japanese in Latin letters; this guide uses modified Hepburn, which writes し as shi." (ja/01-foundations/hiragana).
Check: lint
Source: §5 Topic structure (sentences free of page tours)

### VO-05 A level lives in the level field
Requirements: 2.4
Rule: A level appears in the subtopic's level field, and explanation sentences speak in the words of the subject.
Not this: "The Level column shows when a verb is usually met: A1 first, C2 last." (en/04-verbs/irregular-verbs-table).
Check: lint
Source: §5 Topic structure (sentences free of level codes)

### VO-06 The correct form is the one stated
Requirements: 2.4, 2.6
Rule: A fact, a form and an example state the correct form; wrong forms stand in the common errors.
Not this: (written case) A wrong form shown among the examples of a rule instead of in the errors block.
Check: question
Question: [sentence] Yes or no: is every form in this sentence correct in the language it belongs to?
Source: §7 Tables and writing style (State the correct form)

### VO-07 An example is something a speaker says
Requirements: 2.4, 2.9
Rule: An example is a sentence someone says in a situation it makes plain, in words at or below the subtopic's level.
Not this: "The colour of the centre is grey." (en/01-foundations/spelling-rules), a sentence built to carry spelling pairs.
Check: question
Question: [sentence] Yes or no: is this example a sentence someone says in a situation it makes plain?
Source: §7 Tables and writing style (An example is a sentence someone says)

### VO-08 A translation says what a speaker would say
Requirements: 2.4, 2.9
Rule: The translation of an example is what a speaker of the reader's language says in the same situation.
Not this: (written case) A word-for-word translation of an idiom, such as a gloss that keeps the source's word order where the reader's language puts the words elsewhere.
Check: question
Question: [sentence] Yes or no: is this translation what a speaker of its language would say in the situation of the example?
Source: §7 Tables and writing style (An example is a sentence someone says)

## The first-time reader

### FT-01 One item per line
Requirements: 2.9
Rule: Every item stands on a line of its own; a line holds one item.
Not this: "B C D E G P T V · names end in /iː/ · B /biː/ · C /siː/ · T /tiː/" (en/01-foundations/alphabet-spelling), eight letters, a rule and three transcriptions in one row.
Check: question
Question: [block] Yes or no: does each line of this block hold one item?

### FT-02 Every item has its own example
Requirements: 2.9
Rule: Every item that states a rule or a form comes with an example of its own.
Not this: "and, or and because usually have no comma before them." (en/07-sentence-building/conjunctions-linkers), a rule with no example.
Check: lint

### FT-03 An example is written out in full
Requirements: 2.9
Rule: An example is the whole word or the whole sentence, written out in full.
Not this: "B /biː/ / C /siː/ / T /tiː/" (en/01-foundations/alphabet-spelling), three examples for eight letters.
Check: lint

### FT-04 A group's rule is a sentence ahead of its items
Requirements: 2.9
Rule: A group's rule is a sentence of its own, placed before the items it governs.
Not this: The fragment "names end in /iː/" in a cell beside the letters it governs (en/01-foundations/alphabet-spelling).
Check: lint

### FT-05 Notation sits beside its word
Requirements: 2.9
Rule: A notation such as IPA sits beside the one word it belongs to.
Not this: "names start with /e/" for F L M N S X (en/01-foundations/alphabet-spelling), one transcription for six letters.
Check: question
Question: [sentence] Yes or no: does each notation in this sentence sit beside the one word it belongs to?

### FT-06 An item stands on its own
Requirements: 2.9
Rule: A reader who meets the subject for the first time understands each item as it stands.
Not this: The Summary row "Trap | the name's vowel tells G from J and E from I | G /dʒiː/ / J /dʒeɪ/ / E /iː/ / I /aɪ/" (en/01-foundations/alphabet-spelling).
Check: question
Question: [block] Yes or no: can a reader who meets the subject for the first time understand this item without reading another item?

### FT-07 An example comes with each of the reader's languages
Requirements: 2.9
Rule: An example is in the language being learned and carries its translation in each of the reader's languages; where the reader's language is the language being learned, the example stands alone.
Not this: "¿Hay alguien en casa?" with a translation into English alone, none into the other explanation languages (es/02-sustantivo-determinantes/indefinidos).
Check: lint
Source: §6 Translations and readers

### FT-08 Each step builds on the steps before it
Requirements: 2.9
Rule: An example, an explanation and a table use only the grammar, script and forms that earlier steps of the study path teach or that earlier parts of the same topic teach; a set phrase a learner needs earlier stands as a fixed phrase with its meaning.
Not this: (written case) An A0 example in a tense or construction that a later topic of the path teaches.
Check: question
Question: [sentence] Yes or no: does this sentence use only grammar, script and forms that earlier steps of the study path teach?
Source: §2 Data files (Each step builds on the steps before it)

## Errors

### ER-01 An error is written once
Requirements: 2.6
Rule: An error is one case, written once, with every language whose speakers make it listed in it.
Not this: "I don't know nothing." as two rows, one for Ukrainian speakers and one for Spanish speakers (en/07-sentence-building/questions-negatives).
Check: lint

### ER-02 An error names its speakers
Requirements: 2.6
Rule: Every error names, at least once, the languages whose speakers make it, each with its reason.
Not this: `{ level: B2, wrong: "Surprising by the news, she sat down."` with no `speakers` (en/07-sentence-building/participle-clauses); 452 of 2,233 error rows name theirs.
Check: schema

### ER-03 An error names every language whose speakers make it
Requirements: 2.6
Rule: An error lists exactly the explanation languages whose speakers make it, each with its reason: a source that documents the error or a known contrast with that language.
Not this: "I like very much football." in one row for Ukrainian speakers and another for Spanish speakers (en/07-sentence-building/word-order).
Check: question
Question: [block] Yes or no: do speakers of {language} make the error in this block?

### ER-04 A reader sees the errors of each of their languages
Requirements: 2.6
Rule: A reader sees the errors whose speakers include any of the reader's languages, and a reader with several languages sees the errors of each.
Not this: "Rows without `speakers` serve all." (§6 of today's CONVENTIONS.md), generic errors shown to every reader.
Check: test
Source: §6 Translations and readers (Typical errors match the readers)

### ER-05 A language's file holds its speakers' errors
Requirements: 2.6
Rule: The errors of a new explanation language's speakers arrive as blocks in that language's own file, each naming that language among its speakers.
Not this: `speakers: [uk]` rows inside the English course's topic file beside the other ten languages (en/07-sentence-building/questions-negatives).
Check: lint

### ER-06 An error is a wrong form, its correction and its rule
Requirements: 2.6
Rule: An error holds the wrong form, its correct form and the rule it breaks.
Not this: (written case) An error row with its correction and no rule, so the reader learns what is wrong and not why.
Check: schema
Source: §5 Topic structure (errors)

### ER-07 The wrong form is wrong in the language
Requirements: 2.6
Rule: The wrong form of an error is wrong in the language; a choice of register or style belongs to the subtopic on use or comparison.
Not this: (written case) A row in the errors block that corrects a polite form into a casual form.
Check: question
Question: [block] Yes or no: is the wrong form in this error wrong in the language, rather than a choice of register or style?
Source: §5 Topic structure (Sections teach)

### ER-08 A block for a language's readers names where their language misleads
Requirements: 2.6
Rule: Where a language has a close counterpart that misleads, a block of that language's own, in its file, states the difference for its readers.
Not this: (written case) A Ukrainian explanation of てはいけない that gives «не можна» as its plain translation.
Check: question
Question: [block] Yes or no: does this note state how the readers' language differs from the language being learned?
Source: §6 Translations and readers (Each explanation language explains from its readers' language)

## Language norms

### NO-01 English spells in the British way
Requirements: 2.10
Rule: Text of the English course uses British spelling; en-GB is the default variety.
Not this: (written case) A US-only spelling such as color standing alone in an English example.
Check: lint
Languages: en
Courses: en
Source: §1 Languages and variants (English)

### NO-02 English IPA is British
Requirements: 2.10
Rule: IPA in the English course transcribes the British pronunciation; a US value stands in an en-US variant.
Not this: (written case) The US vowel oʊ written where the British əʊ is meant, outside a US swap.
Check: lint
Languages: en
Courses: en
Source: §1 Languages and variants (English)

### NO-03 A US form stands beside its British form
Requirements: 2.10
Rule: Each US form stands beside its British form as a swap, for example at the weekend and on the weekend.
Not this: "Z is /ziː/ (zee) and R is /ɑːr/." as a note of its own, apart from the letters it replaces (en/01-foundations/alphabet-spelling).
Check: schema
Languages: en-US
Courses: en
Source: §1 Languages and variants (English)

### NO-04 Spanish forms follow the reference norm
Requirements: 2.10
Rule: Spanish forms follow the reference norm of the Plan Curricular del Instituto Cervantes.
Not this: (written case) A form that the norm does not give, written as the Spanish form.
Check: question
Question: [sentence] Yes or no: does every Spanish form in this sentence belong to the reference norm of the Plan Curricular del Instituto Cervantes?
Languages: es
Courses: es
Source: §1 Languages and variants (Spanish)

### NO-05 Spanish opens questions and exclamations
Requirements: 2.10
Rule: Spanish text opens a question with ¿ and an exclamation with ¡.
Not this: (written case) A Spanish question written as "¿Estás bien?" without its ¿, as "Estás bien?".
Check: lint
Languages: es
Source: §1 Languages and variants (Spanish)

### NO-06 Spanish writes every accent
Requirements: 2.10
Rule: Spanish text writes every accent its words need.
Not this: (written case) "¿Estas bien?" for "¿Estás bien?".
Check: question
Question: [sentence] Yes or no: does this Spanish sentence write every accent its words need?
Languages: es
Source: §1 Languages and variants (Spanish)

### NO-07 Ukrainian forms follow the state standard
Requirements: 2.10
Rule: Ukrainian forms follow the examples of the state standard «Українська мова як іноземна. Рівні загального володіння А1–С2» (2024).
Not this: (written case) A form that the standard does not give, written as the Ukrainian form.
Check: question
Question: [sentence] Yes or no: does every Ukrainian form in this sentence belong to the examples of the state standard?
Languages: uk
Courses: uk
Source: §1 Languages and variants (Ukrainian)

### NO-08 Ukrainian writes the apostrophe as ’
Requirements: 2.10
Rule: Ukrainian text writes the apostrophe as ’, as in п’ять.
Not this: (written case) п'ять with a straight apostrophe.
Check: lint
Languages: uk
Source: §1 Languages and variants (Ukrainian)

### NO-09 Ukrainian marks stress in examples
Requirements: 2.10
Rule: In the Ukrainian course, Ukrainian text marks the stress of every word of more than one syllable with an acute accent (U+0301) in examples, table cells and the forms an explanation discusses: Я чита́ю кни́жку.
Not this: (written case) A word of two syllables in an example, written without its mark, such as лікар for лі́кар.
Check: lint
Languages: uk
Courses: uk
Source: §1 Languages and variants (Ukrainian)

### NO-10 Ukrainian titles and prose are written in plain letters
Requirements: 2.10
Rule: Ukrainian titles and explanation prose are written in plain letters, and the acute accent marks stress in examples, table cells and discussed forms.
Not this: (written case) A title or an explanation sentence with U+0301 on an ordinary word.
Check: lint
Languages: uk
Source: §1 Languages and variants (Ukrainian)

### NO-11 Ukrainian transliteration appears in three A0 topics
Requirements: 2.10
Rule: A Latin transliteration after the national system of 2010 appears beside the IPA in exactly three A0 topics: the alphabet, the sounds and the soft sign.
Not this: (written case) A Latin transliteration in a topic on cases or verbs.
Check: lint
Languages: uk
Courses: uk
Source: §1 Languages and variants (Ukrainian)

### NO-12 A form carried over from Russian is an error of Ukrainian speakers
Requirements: 2.10, 2.6
Rule: A form carried over from Russian is a common error whose speakers are Ukrainian.
Not this: "Я живу́ на Украї́ні." as a row with no speakers (uk/02-nouns-cases/locative).
Check: question
Question: [block] Yes or no: is the wrong form of this error a form that Ukrainian carries over from Russian?
Languages: uk
Courses: uk
Source: §1 Languages and variants (Ukrainian)

### NO-13 Ukrainian writes the dash before a noun predicate
Requirements: 2.10
Rule: The dash between a subject and its noun predicate stands in Ukrainian examples: Ма́ма — лі́кар.
Not this: (written case) "Ма́ма лі́кар." with no dash.
Check: question
Question: [sentence] Yes or no: does this Ukrainian sentence with a noun predicate write the dash between subject and predicate?
Languages: uk
Courses: uk
Source: §1 Languages and variants (Ukrainian)

### NO-14 French forms follow the norm of France
Requirements: 2.10
Rule: French forms follow the norm of France, as the Council of Europe reference level descriptions give them.
Not this: (written case) A form of another norm written as the French form.
Check: question
Question: [sentence] Yes or no: does every French form in this sentence belong to the norm of France?
Languages: fr
Courses: fr
Source: §1 Languages and variants (French)

### NO-15 French writes the apostrophe as ’
Requirements: 2.10
Rule: French text writes the apostrophe as ’, as in l’école.
Not this: (written case) l'école with a straight apostrophe.
Check: lint
Languages: fr
Source: §1 Languages and variants (French)

### NO-16 French quotes in « »
Requirements: 2.10
Rule: French text quotes in « », with a no-break space inside each guillemet.
Not this: (written case) A French explanation that quotes with straight double quotes.
Check: lint
Languages: fr
Source: §1 Languages and variants (French)

### NO-17 French sets a no-break space before : ; ? !
Requirements: 2.10
Rule: French text sets a no-break space (U+00A0) before : ; ? ! and » and after «, as in Tu viens ?
Not this: "Devant p, b, m: /m/." (ja/01-foundations/pronunciation), a colon with no space before it.
Check: lint
Languages: fr
Source: §1 Languages and variants (French)

### NO-18 French IPA follows France, Québec in fr-CA
Requirements: 2.10
Rule: French IPA follows the pronunciation of France; the vowels and affricates of Québec stand in elements of fr-CA.
Not this: (written case) The Québec affricates [tsy] and [dzi] written in a note that serves every variety.
Check: question
Question: [block] Yes or no: does every IPA transcription in this block follow the pronunciation of France, apart from those in a fr-CA element?
Languages: fr, fr-CA
Courses: fr
Source: §1 Languages and variants (French)

### NO-19 Japanese is written in kana and kanji without spaces
Requirements: 2.10
Rule: Japanese text runs kana and kanji together, each word following the last as Japan writes it.
Not this: (written case) A Japanese sentence with a space between words, such as あした 学校に 行きます。
Check: lint
Languages: ja
Source: §1 Languages and variants (Japanese)

### NO-20 Japanese punctuation is 。 and 、
Requirements: 2.10
Rule: Japanese text ends a sentence with 。 and separates clauses with 、.
Not this: (written case) A Japanese example ending in a Latin full stop or comma.
Check: lint
Languages: ja
Source: §1 Languages and variants (Japanese)

### NO-21 Japanese is polite unless a topic teaches plain forms
Requirements: 2.10
Rule: Japanese text is in the polite です/ます style, except where a topic teaches plain forms.
Not this: (written case) A plain-form sentence in a topic on です and ます.
Check: question
Question: [sentence] Yes or no: is this Japanese sentence in the polite です/ます style?
Languages: ja
Source: §1 Languages and variants (Japanese)

### NO-22 Japanese kana topics give romaji
Requirements: 2.10
Rule: The A0 topics on hiragana, katakana and kana sounds teach the kana and give each kana and each example its romaji, in modified Hepburn (shi, tsu, Tōkyō), beside its IPA.
Not this: (written case) A kana row of the hiragana topic with no romaji beside it.
Check: lint
Languages: ja
Courses: ja
Source: §1 Languages and variants (Japanese)

### NO-23 Japanese topics beyond the kana topics are written in Japanese script
Requirements: 2.10
Rule: Every Japanese topic but the three kana topics is written in Japanese script.
Not this: (written case) Latin letters spelling a Japanese word in a topic on particles.
Check: lint
Languages: ja
Courses: ja
Source: §1 Languages and variants (Japanese)

### NO-24 A kanji carries its reading
Requirements: 2.10
Rule: A kanji in an example, a table cell or a form an explanation discusses carries its reading in hiragana, `{ kanji: 食, reading: た }`.
Not this: (written case) 食べる with 食 bare, outside a kanji mark.
Check: lint
Languages: ja
Courses: ja
Source: §1 Languages and variants (Japanese)

### NO-25 Japanese A0 examples are in kana
Requirements: 2.10
Rule: Japanese examples at A0 are written in kana.
Not this: (written case) An A0 example that writes 学生 where がくせい is meant.
Check: lint
Languages: ja
Courses: ja
Source: §1 Languages and variants (Japanese)

### NO-26 Japanese A1 and A2 examples use the kanji of their level
Requirements: 2.10
Rule: Japanese examples at A1 and A2 write in kanji the words learners read in kanji at their level (日, 月, 人, 本, 何, 時, 食べる, 行く…) and every other word in kana.
Not this: (written case) An A1 example that writes a word of a later level in kanji.
Check: lint
Languages: ja
Courses: ja
Source: §1 Languages and variants (Japanese)

### NO-27 A course lists its varieties, default first
Requirements: 2.10
Rule: A course with varieties lists them with the default first: en-GB then en-US, es-419 then es-ES, fr-FR then fr-CA.
Not this: (written case) A course with varieties and no `varieties` list, or a list with the default second, such as `varieties: [es-ES, es-419]`.
Check: schema
Courses: en, es, fr
Source: §1 Languages and variants (Varieties)

### NO-28 An element of a variety carries its tag
Requirements: 2.10
Rule: The `variety` of an element is one of the varieties its course lists, and an element without it serves every variety.
Not this: (written case) `variety: en-AU` on an element of a course that lists en-GB and en-US.
Check: schema
Languages: en, es, fr
Courses: en, es, fr
Source: §1 Languages and variants (Varieties)

### NO-50 A block of one variety carries its tag
Requirements: 2.10
Rule: A block that holds a form of one variety alone carries that variety's tag.
Not this: (written case) A US-only note without `en-US`, so that British readers see it.
Check: question
Question: [block] Yes or no: does this block hold a form that only one variety of its language uses?
Languages: en, es, fr
Courses: en, es, fr
Source: §1 Languages and variants (Varieties)

### NO-29 Spanish vosotros belongs to es-ES
Requirements: 2.10
Rule: The vosotros forms and the rules about them carry es-ES.
Not this: (written case) A vosotros row with no variety.
Check: lint
Languages: es-ES
Courses: es
Source: §1 Languages and variants (Varieties)

### NO-30 Spanish ustedes as the one plural belongs to es-419
Requirements: 2.10
Rule: A rule that holds in Latin America alone, such as ustedes as the one plural of tú, carries es-419.
Not this: (written case) A note on ustedes as the plural of tú with no variety.
Check: question
Question: [block] Yes or no: does this block state a rule that holds in Latin America alone?
Languages: es-419
Courses: es
Source: §1 Languages and variants (Varieties)

### NO-31 Voseo appears in an es-419 note
Requirements: 2.10
Rule: Voseo appears in a note that carries es-419.
Not this: (written case) Voseo forms in a table row serving every variety.
Check: lint
Languages: es-419
Courses: es
Source: §1 Languages and variants (Varieties)

### NO-32 French meals carry their variety
Requirements: 2.10
Rule: The meals petit-déjeuner, déjeuner, dîner carry fr-FR, and déjeuner, dîner, souper carry fr-CA.
Not this: (written case) The meals written as one list that serves both varieties.
Check: question
Question: [block] Yes or no: does this block name a meal whose word differs between France and Canada?
Languages: fr-FR, fr-CA
Courses: fr
Source: §1 Languages and variants (Varieties)

### NO-33 The affricates of tu and dis carry fr-CA
Requirements: 2.10
Rule: The affricates of tu and dis, [tsy] and [dzi], appear in elements that carry fr-CA.
Not this: (written case) The transcription [tsy] in a note that serves every variety.
Check: lint
Languages: fr-CA
Courses: fr
Source: §1 Languages and variants (Varieties)

### NO-49 The question particle -tu appears in fr-CA notes
Requirements: 2.10
Rule: The question particle -tu of speech (Tu viens-tu ?) appears in notes that carry fr-CA.
Not this: (written case) The question particle -tu in a note that serves every variety.
Check: question
Question: [block] Yes or no: does this block hold a speech form used in Québec alone, such as the question particle -tu?
Languages: fr-CA
Courses: fr
Source: §1 Languages and variants (Varieties)

### NO-34 A swap holds both forms side by side
Requirements: 2.10
Rule: Where varieties say one thing differently, the text holds a `variant` of each, side by side.
Not this: (written case) Both forms in one string, such as "at the weekend / on the weekend".
Check: schema
Languages: en, es, fr
Courses: en, es, fr
Source: §1 Languages and variants (Swaps)

### NO-51 A form both varieties share stays plain text
Requirements: 2.10
Rule: A form both varieties share stays plain text: the two `variant` forms of a swap differ.
Not this: (written case) A swap whose two variants read the same, such as at the weekend for en-GB and at the weekend for en-US.
Check: lint
Languages: en, es, fr
Courses: en, es, fr
Source: §1 Languages and variants (Swaps)

### NO-35 Ukrainian addresses the reader with ви
Requirements: 2.10
Rule: Ukrainian explanation text addresses the reader with ви.
Not this: (written case) A Ukrainian explanation sentence that addresses the reader with ти.
Check: lint
Languages: uk

### NO-36 Spanish addresses the reader with tú
Requirements: 2.10
Rule: Spanish explanation text addresses the reader with tú.
Not this: (written case) A Spanish explanation sentence that addresses the reader with usted.
Check: lint
Languages: es

### NO-37 Portuguese addresses the reader with você
Requirements: 2.10
Rule: Portuguese explanation text is Brazilian and addresses the reader with você.
Not this: (written case) A Portuguese explanation sentence that addresses the reader with tu.
Check: lint
Languages: pt

### NO-38 French addresses the reader with vous
Requirements: 2.10
Rule: French explanation text addresses the reader with vous.
Not this: (written case) A French explanation sentence that addresses the reader with tu.
Check: lint
Languages: fr

### NO-39 German addresses the reader with du
Requirements: 2.10
Rule: German explanation text addresses the reader with du.
Not this: (written case) A German explanation sentence that addresses the reader with Sie.
Check: question
Question: [sentence] Yes or no: does this German sentence address the reader as du, or leave the reader unaddressed?
Languages: de

### NO-40 Italian addresses the reader with tu
Requirements: 2.10
Rule: Italian explanation text addresses the reader with tu.
Not this: (written case) An Italian explanation sentence that addresses the reader with Lei.
Check: lint
Languages: it

### NO-41 Polish addresses the reader with ty and twój
Requirements: 2.10
Rule: Polish explanation text addresses the reader with ty and writes twój with a lowercase letter.
Not this: (written case) A Polish explanation sentence that addresses the reader with Pan or Twój.
Check: lint
Languages: pl

### NO-42 Turkish addresses the reader with siz
Requirements: 2.10
Rule: Turkish explanation text addresses the reader with siz.
Not this: "Este bana yakın olanı, ese sana yakın olanı" (es/02-sustantivo-determinantes/demostrativos), sana for size.
Check: lint
Languages: tr

### NO-43 Indonesian addresses the reader with Anda
Requirements: 2.10
Rule: Indonesian explanation text addresses the reader with Anda.
Not this: "ese yang dekat dengan kamu" (es/02-sustantivo-determinantes/demostrativos), kamu for Anda.
Check: lint
Languages: id

### NO-44 Vietnamese addresses the reader with bạn
Requirements: 2.10
Rule: Vietnamese explanation text addresses the reader with bạn.
Not this: (written case) A Vietnamese explanation sentence that addresses the reader with em or anh.
Check: question
Question: [sentence] Yes or no: does this Vietnamese sentence address the reader as bạn, or leave the reader unaddressed?
Languages: vi

### NO-45 A topic is named in the reader's language
Requirements: 2.10
Rule: Every language names a topic with its own word: topic (en), тема (uk), tema (es), tópico (pt), thème (fr), Thema (de), argomento (it), temat (pl), konu (tr), topik (id), chủ đề (vi), トピック (ja).
Not this: (written case) A Spanish text that calls a topic a lección or a Portuguese text that calls it a tema.
Check: lint
Languages: en, uk, es, pt, fr, de, it, pl, tr, id, vi, ja

### NO-46 Italian and Turkish write the apostrophe as ’
Requirements: 2.10
Rule: Italian and Turkish text writes the apostrophe as ’, as Ukrainian and French do (NO-08, NO-15).
Not this: it: "L'alfabeto" (en/01-foundations/alphabet-spelling) and tr: "Japonya'ya gidiyorum." (ja/01-foundations/kanji).
Check: lint
Languages: it, tr

### NO-47 English writes the apostrophe as '
Requirements: 2.10
Rule: English text writes the apostrophe as the straight '.
Not this: "Which one is Tanaka-san’s bag?" (ja/02-sentence-basics/ko-so-a-do).
Check: lint
Languages: en

### NO-48 An ellipsis is U+2026
Requirements: 2.10
Rule: An ellipsis is the single character U+2026, set close to the word before it.
Not this: "If I had arrived earlier..." with three full stops (es/13-escritura/puntuacion).
Check: lint

## The index

### IX-01 One index file per course
Requirements: 3.7
Rule: Each course has one index file, and every course has one.
Not this: One file of 1,410 lines holding every course: `languages:` with `- code: en` and `- code: ja` in it (curriculum.yaml).
Check: lint
Source: §2 Data files

### IX-02 A section has its own id and a name in every language
Requirements: 3.7
Rule: The index lists the course's sections in order; each section has its own id, free of any order number, and its name in all 12 explanation languages.
Not this: `dir: 01-foundations` with `title: { en: Foundations, uk: Основи, es: Fundamentos, pt: "Fundamentos", fr: "Bases", de: "Grundlagen", it: "Fondamenti", pl: "Podstawy", tr: "Temeller", id: "Dasar-dasar", vi: "Nền tảng" }` (curriculum.yaml), an order number in the id and no Japanese name.
Check: schema
Source: §2 Data files (NN-section)

### IX-03 A section lists its topics in order
Requirements: 3.7
Rule: Each section lists its topics in the order a reader meets them.
Not this: `- { slug: alphabet-spelling }` listed in the order of a separate `path:` list that repeats the same ids (curriculum.yaml).
Check: schema

### IX-04 A topic's section comes from the index alone
Requirements: 3.7
Rule: A topic's section is named once, in the index; the topic's file and path carry the topic's slug.
Not this: `en/01-foundations/alphabet-spelling` with `id: en.foundations.alphabet-spelling` (en/01-foundations/alphabet-spelling), the section written in the path and again in the id.
Check: lint
Source: §2 Data files (ID)

### IX-05 A topic names its concepts from one registry
Requirements: 3.7
Rule: Each topic in the index names its concepts, and every concept comes from the one registry shared by every course.
Not this: `concepts: [alphabet]` inside the topic file (en/01-foundations/alphabet-spelling), apart from the index.
Check: lint
Source: §9 Concepts

### IX-06 A topic names its place in the study path
Requirements: 3.7
Rule: Each topic in the index names its place in the study path, level by level.
Not this: The `path:` block, where `A0:` lists topic ids again after the sections have listed them (curriculum.yaml).
Check: schema
Source: §2 Data files (The study path)

### IX-07 A replaces entry names a topic of today's library
Requirements: 3.7
Rule: Each `replaces` entry in the index names a topic that exists in today's library.
Not this: (written case) A `replaces` entry that names a topic today's library lacks.
Check: lint

### IX-24 A topic that continues one of today's names it
Requirements: 3.7
Rule: A topic in the index that treats the subject of a topic of today's library names that topic in `replaces`.
Not this: (written case) A new topic that continues one of today's 288 with no `replaces` entry.
Check: question
Question: [block] Yes or no: does the topic this entry defines treat the subject of a topic of today's library?

### IX-08 A topic is defined first
Requirements: 3.1
Rule: Each topic in the index states its subject, what it covers and its planned levels before any text of the topic is written.
Not this: `- { slug: alphabet-spelling }` (curriculum.yaml), a topic listed by its slug alone.
Check: schema

### IX-09 The index holds its sources
Requirements: 3.1, 3.2
Rule: A course's index lists the sources it was drawn from, each with its name, the licence it is published under and what the index took from it.
Not this: "# for Japanese-Language Education and its coursebooks Marugoto and Irodori (A1, A2)" (curriculum.yaml), sources in a comment.
Check: schema

### IX-10 The index draws on several sources
Requirements: 3.2
Rule: A course's index draws on at least two international, CEFR-aligned sources for its language.
Not this: "# The study path follows the levels of the Plan Curricular del Instituto Cervantes (PCIC)." (curriculum.yaml), one source for the Spanish course.
Check: lint
Source: §1 Languages and variants (each language's standard)

### IX-11 The index takes facts from its sources, never text
Requirements: 3.2
Rule: The index takes topics and levels from its sources, and its own sentences are worded independently of them.
Not this: (written case) A topic definition that copies the wording of a syllabus entry.
Check: question
Question: [sentence] Yes or no: is this sentence worded independently of the source it draws its fact from?

### IX-12 Practical topics are marked
Requirements: 3.3
Rule: A practical topic carries the mark `practical` in the index, so that the clusters real life needs are listed apart from the standard syllabus.
Not this: A practical cluster in today's English course, such as place-movement (en/09-prepositions/place-movement), filed among the grammar topics with nothing to mark it.
Check: schema

### IX-13 Every practical cluster has a topic in each course
Requirements: 3.3
Rule: Each course's index holds a topic for each practical cluster: question words, words of place, of movement and of time, how often, how much, linking words, comparing, numbers in daily life, polite words, asking the way, small talk, and full reference tables.
Not this: None of the 66 topics of today's English course covers polite words or small talk (curriculum.yaml).
Check: lint

### IX-14 A reference table is complete
Requirements: 3.3
Rule: A full reference table topic holds the whole set, such as every irregular verb in one table.
Not this: "The most common irregular verbs: base form, past simple and past participle, grouped by the pattern each verb follows." (en/04-verbs/irregular-verbs-table).
Check: question
Question: [block] Yes or no: does this block set out the whole set its topic names, such as every irregular verb?

### IX-15 A practical topic is adapted to its language
Requirements: 3.3
Rule: A practical topic lists the words and forms of its course's language.
Not this: (written case) A Spanish topic of words of place that lists the English prepositions in, on, under in the same order.
Check: question
Question: [block] Yes or no: does this block list the words and forms of its course's language rather than a translation of another language's list?

### IX-16 Search needs become topics
Requirements: 3.3
Rule: For each explanation language, the search needs of its readers are listed with the query behind each, and each real need is a topic written for that public.
Not this: None of today's 288 topics records the query behind it (any topic.yaml).
Check: lint

### IX-17 Levels are the CEFR scale
Requirements: 3.5
Rule: A level is one of A0, A1, A2, B1, B2, C1, C2.
Not this: A level written as a range in an entry, such as `levels: A1-B1` (§3 of today's CONVENTIONS.md).
Check: schema
Source: §3 Levels

### IX-18 A course's levels reach its v1 reach
Requirements: 3.6, 3.5
Rule: The English, Spanish and Ukrainian courses hold topics at every level from A0 to C2.
Not this: (written case) An English index whose topics stop at B2.
Check: lint
Courses: en, es, uk

### IX-19 The other courses reach A2
Requirements: 3.6, 3.5
Rule: The French, Japanese, Italian and German courses hold topics at the levels A0, A1 and A2 at v1.
Not this: (written case) A French index with a topic at B1 before the A0 to A2 waves are approved.
Check: lint
Courses: fr, ja, it, de

### IX-20 Seven courses, 12 explanation languages
Requirements: 3.6
Rule: The library holds the courses English, French, Spanish, Italian, German, Ukrainian and Japanese, and each is explained in all 12 explanation languages.
Not this: Five courses (en, es, uk, fr, ja) explained in 11 languages, with no Italian or German course and no Japanese explanations (curriculum.yaml).
Check: lint

### IX-21 An index entry has a status
Requirements: 3.1, 5.1
Rule: Each index entry carries a status of draft, in review or approved.
Not this: `- { slug: alphabet-spelling }` (curriculum.yaml), an entry with no status.
Check: schema

### IX-25 An unapproved index holds drafts only
Requirements: 3.1, 5.1
Rule: While its course's index is a draft, every entry in it is a draft.
Not this: (written case) An entry with the status approved inside an index that is still a draft.
Check: lint

### IX-22 The index is approved before its topics are written
Requirements: 3.4
Rule: A topic of a course receives its text once the course's index has the status approved.
Not this: (written case) A topic written while its course's index is still a draft.
Check: lint

### IX-23 Ids are kebab-case
Requirements: 3.7
Rule: A section id and a topic id are lowercase letters, digits and hyphens.
Not this: (written case) A topic id with an underscore or a capital letter.
Check: schema
Source: §2 Data files (topic)

### IX-26 Ids are unique where they are read
Requirements: 3.7
Rule: A section id is unique within a course, and a topic id within a section.
Not this: (written case) Two sections of one course with the id tenses.
Check: lint
Source: §10 URLs (Section slugs are unique within a language)

## Review

### RV-01 An index and a topic have one status
Requirements: 5.1
Rule: An index and a topic each carry one status: draft, in review or approved.
Not this: `status: { en: draft, uk: draft, es: draft, pt: draft, fr: draft, de: draft, it: draft, pl: draft, tr: draft, id: draft, vi: draft }` (en/01-foundations/alphabet-spelling), eleven statuses and no "in review".
Check: schema
Source: §5 Topic structure (status)

### RV-02 A status moves in order
Requirements: 5.1
Rule: A status moves from draft to in review to approved, one step at a time.
Not this: (written case) A topic set from draft to approved without a review record.
Check: lint
Source: §11 Workflow per topic

### RV-03 Only approved topics reach the site
Requirements: 5.1
Rule: Drafts and work in review stay off the published site; a topic reaches it once it is approved.
Not this: `status: draft` on every topic file, all of which the site serves (en/01-foundations/alphabet-spelling).
Check: test

### RV-04 Each topic keeps a review record
Requirements: 5.2
Rule: Each topic's review record holds each finding, its decision and what the writer changed.
Not this: `translated` fingerprints in the topic file and no record of any review (en/01-foundations/alphabet-spelling).
Check: schema

### RV-16 A topic in review or approved has a review record
Requirements: 5.2
Rule: A topic in review or approved has a review record.
Not this: (written case) A topic in review whose record is missing.
Check: lint

### RV-05 The reviewer is from another model family
Requirements: 5.2
Rule: The review record names the writer's model family and the reviewer's, and the two differ.
Not this: (written case) A review record whose reviewer is the writer's own model.
Check: lint

### RV-06 A finding cites a rule or a source
Requirements: 5.2
Rule: Each finding of the review cites the rule id of this catalog or the source it rests on.
Not this: (written case) A finding that says a topic reads badly and cites nothing.
Check: lint

### RV-07 The writer answers every finding
Requirements: 5.2
Rule: Every finding in the review record has the writer's answer: fixed, or declined with a reason.
Not this: (written case) A finding left open when the topic is set to approved.
Check: lint

### RV-08 The owner approves the gates of the work
Requirements: 5.3
Rule: The conventions, every index, the samples and each level wave carry the owner's approval with its date.
Not this: (written case) A level wave written before the previous wave has the owner's approval.
Check: lint

### RV-09 The owner reads the flagged topics in Ukrainian and English
Requirements: 5.3
Rule: Within a wave, the owner reads the Ukrainian and the English of every topic the checks flag.
Not this: (written case) A flagged topic that reaches approved with no owner reading recorded.
Check: lint

### RV-10 The owner reads one topic in ten of the rest
Requirements: 5.3
Rule: Within a wave, the owner reads the Ukrainian and the English of one topic in ten of the topics the checks leave unflagged, drawn at random.
Not this: (written case) A wave approved with fewer owner readings than one in ten.
Check: lint

### RV-11 A translation says what its source says
Requirements: 5.3, 6.3
Rule: Each sentence of a translation says exactly what its source sentence says.
Not this: (written case) A translated sentence that adds a condition the source lacks.
Check: question
Question: [sentence] Yes or no: does this sentence say what its source sentence says, no more and no less?

### RV-12 A language's own errors and norms are checked twice
Requirements: 5.3
Rule: Each language's own errors and norms are checked by two models whose verdicts agree.
Not this: (written case) A language's norms checked by one model.
Check: test

### RV-13 A topic carries a native-review flag per language
Requirements: 5.4
Rule: A topic carries one flag for each language it is written in: reviewed by a native speaker, yes or no.
Not this: Today's topic files, which carry a status per language and no flag of native review (en/01-foundations/alphabet-spelling).
Check: schema

### RV-14 Only the owner's reading sets the Ukrainian flag
Requirements: 5.4
Rule: The Ukrainian flag is yes on the topics the owner read in Ukrainian; every other flag is no until native contributors join.
Not this: (written case) A flag set to yes for a language with no native reviewer recorded.
Check: lint

### RV-15 Every language shows in the same form
Requirements: 5.4
Rule: Every language shows on the site in the same form, reviewed or not.
Not this: (written case) A page that marks one language as unreviewed.
Check: test

## Languages and translations

### LA-01 Every topic has a file for each explanation language
Requirements: 6.1, 6.3
Rule: Every topic of a course has a source file and one file for each explanation language of the course; the check names each missing file.
Not this: One `topic.yaml` holding every explanation language inline, up to 336 KB (es/01-fundamentos/alfabeto-ortografia).
Check: lint
Source: §2 Data files

### LA-02 A new course or language is data and text alone
Requirements: 6.1
Rule: Adding a course or an explanation language is an entry in the data and its text; every list of languages in the build and the checks is read from that data.
Not this: (written case) A language list written into a script, so that adding a language needs a code change.
Check: test
Source: §1 Languages and variants (An explanation language is data alone)

### LA-03 The checks name every gap
Requirements: 6.1
Rule: For each course and each explanation language, the checks name every missing file, id, name and string with its path.
Not this: (written case) A check that reports "a translation is missing" without naming the topic and the language.
Check: test

### LA-04 One writer leads, one writer per course works under it
Requirements: 6.2
Rule: Each topic's record names its writer; the content session leads, and each course has one writer working under it.
Not this: (written case) A topic with no writer recorded.
Check: lint

### LA-05 Blocks align one to one
Requirements: 6.3
Rule: Each block of an explanation language's file pairs with one block of the source, by the block's id.
Not this: `en:` and `uk:` under one key (en/01-foundations/alphabet-spelling), aligned by position in one record and by no id.
Check: lint
Source: §6 Translations and readers

### LA-06 Sentences align inside a block
Requirements: 6.3
Rule: Inside a block, each sentence of a translation pairs with a sentence of the source, by the sentence's id.
Not this: (written case) A translated block of three sentences set against a source block of two, with no sentence pairing.
Check: lint

### LA-07 A join or a split is recorded
Requirements: 6.3
Rule: A translation that joins or splits sentences where its language needs it records the pairing: which source sentences make which translated sentence.
Not this: "В англійському алфавіті 26 літер; за їхніми назвами слова диктують по літерах." for "The 26 letters of the English alphabet and their names, used to spell words aloud." (en/01-foundations/alphabet-spelling), a recast with no pairing.
Check: schema

### LA-08 A fingerprint belongs to a sentence
Requirements: 6.3
Rule: A fingerprint belongs to one source sentence, and a changed source sentence flags exactly that sentence.
Not this: `translated: { uk: "fd79db 3383ac fcd2f2", ... }` (en/01-foundations/alphabet-spelling), three hashes for a whole topic.
Check: lint
Source: §6 Translations and readers

### LA-09 A course is written first in its source language
Requirements: 6.4
Rule: A course's explanations are written first in its source language, which is the course's own language and, for Japanese, English; the index names the source.
Not this: `explain: [en, uk, es, pt, fr, de, it, pl, tr, id, vi]` on the Japanese course (curriculum.yaml), a source named by its place in a list.
Check: schema
Source: §1 Languages and variants (explain)

### LA-10 A translation carries the current fingerprint
Requirements: 6.4
Rule: A translated sentence carries the current fingerprint of its source sentence.
Not this: (written case) A translated sentence whose fingerprint is older than the current fingerprint of its source sentence.
Check: lint
Source: §6 Translations and readers

## Structure

### ST-01 A block is one of seven kinds
Requirements: 9.5 blocks
Rule: A block is an essence, a fact, an example, a list, a table, a why or errors; the essence is the block of part 00 and errors are the block of the common errors.
Not this: `type: inventory` for the 26 letters of the alphabet, one of four table types among today's seven block types (en/01-foundations/alphabet-spelling).
Check: schema
Source: §5 Topic structure (Block types)

### ST-02 A list holds one item per line
Requirements: 9.5 blocks
Rule: A list holds its items one per line, and each item is one entry.
Not this: The paragraph "26 letters. Vowels: a, e, i, o, u. The other 21 are consonants; y works as both (yes, my)." (en/01-foundations/alphabet-spelling), a list run into a paragraph.
Check: schema

### ST-03 A table is a true grid
Requirements: 9.5 blocks
Rule: A table declares the two axes it crosses, such as person and tense, and every cell sits at one crossing.
Not this: The alphabet's `usage` table of Point, Rule and Example, a list set in columns (en/01-foundations/alphabet-spelling).
Check: lint

### ST-04 A table of forms holds forms and its examples stand below
Requirements: 9.5 blocks
Rule: A table of forms holds the forms; its examples stand below it, each with its translation.
Not this: A paradigm row that carries a `tr` of its own (§6 of today's CONVENTIONS.md: "A paradigm stands alone in every track").
Check: lint
Source: §6 Translations and readers

### ST-05 A mark names why it exists
Requirements: 9.5 marks
Rule: Each mark in the vocabulary records why it exists: the way the reader sees it, the way the reader hears it, or the planned feature that reads it.
Not this: `{ aux: Will }` (en/05-tenses/simple-tenses), a mark that exports as plain bold; about 30 marks collapse to bold and italic.
Check: lint
Source: §12 Semantic data (Inline marks)

### ST-06 Marked text uses the vocabulary's marks
Requirements: 9.5 marks
Rule: Marked text uses the marks of the vocabulary, each wrapping the part of the text it concerns.
Not this: (written case) A mark invented for one topic and absent from the vocabulary, such as `{ tip: use the base verb }`.
Check: lint
Source: §12 Semantic data (Rules)

### ST-07 An ipa mark holds symbols alone
Requirements: 9.5 marks, 2.10
Rule: An `ipa` mark holds the IPA symbols of one transcription, and the reader sees them between slashes.
Not this: (written case) `{ ipa: "/eɪ/" }` with the slashes written in the mark.
Check: lint
Source: §7 Tables and writing style (Pronunciation is IPA in an ipa mark)

### ST-08 A value mark carries its value
Requirements: 9.5 marks
Rule: A `date`, `weekday`, `time`, `numeral` or `ordinal` mark carries its value in ISO form: 2026-07-03, Monday as 1, 09:30, 200, 3.
Not this: (written case) A date written in words with no value, so that no program can read it.
Check: lint
Source: §12 Semantic data (Inline marks)

### ST-09 A role is registered with what it changes
Requirements: 9.5 roles
Rule: Each subtopic role in the schema names the order or the layout it changes.
Not this: The nine roles overview, form, spelling, pronunciation, use, signals, own, compare, errors (§12 of today's CONVENTIONS.md), of which `own` names no change.
Check: schema
Source: §5 Topic structure (Sections are a menu)

### ST-10 A role marks a change of order or layout
Requirements: 9.5 roles
Rule: A subtopic carries a role where the role changes the order or the layout.
Not this: `role: own` on 907 of 2,276 parts, as on the alphabet's only section (en/01-foundations/alphabet-spelling).
Check: lint

### ST-11 A level sits on the subtopic
Requirements: 9.5 levels
Rule: Each subtopic carries exactly one level.
Not this: `level: A0` on each of the alphabet's 26 inventory rows (en/01-foundations/alphabet-spelling).
Check: schema
Source: §3 Levels

### ST-12 Rows and items take the level of their subtopic
Requirements: 9.5 levels
Rule: Rows, items, paragraphs and errors inside a subtopic take the level of the subtopic.
Not this: `{ level: B2, wrong: "Surprising by the news, she sat down."` (en/07-sentence-building/participle-clauses), a level on an error row.
Check: lint
Source: §3 Levels (Levels live on the leaves)

### ST-13 An error names its subtopic
Requirements: 9.5 levels, 2.6
Rule: Each error names its subtopic in `in:` and takes that subtopic's level.
Not this: The Typical errors section holding rows of B2, C1 and C2 in one block (en/07-sentence-building/participle-clauses).
Check: lint

### ST-14 A topic's levels are planned in the index
Requirements: 9.5 levels
Rule: The index states each topic's planned levels, and the levels of the topic's subtopics equal them.
Not this: "A written topic's range comes from its data." (§3 of today's CONVENTIONS.md), the range known once the text exists.
Check: lint
Source: §3 Levels

## Replaced

- Tracks, one language explained in one explanation language (§1 Languages and variants): replaced by 0.3, the tracks become layers of a course.
- The `explain` list with the source first, and the count of eleven tracks per course (§1): replaced by 6.4 and 3.6, the source language and the 12 explanation languages named in the index.
- The standard that sets a course's topics and the level of each rule (PCIC, the Ukrainian state standard, the Council of Europe descriptions, the JF Standard; §1): replaced by 3.2, an index built from several CEFR-aligned sources; the forms each standard sets stay in NO-04, NO-07, NO-14.
- The Variety chip, the hiding of whole lists and tables of another variety, and the fixed column widths on a switch (§1 Varieties): replaced by 8.2, the reading keeps the behaviour of the rebuilt screens, and by 9.3, which leaves presentation to the screen.
- Japanese as an explanation language of the interface alone, with its tracks joining as written (§1): replaced by 3.6, every course explained in all 12 explanation languages.
- The file tree with one `topic.yaml` per topic, `curriculum.yaml`, `concepts.yaml` and the schema files (§2 Data files): replaced by 9.4 and 3.7, one source file per topic, one file per explanation language and one index file per course.
- The `NN-section` folder number and the id `{lang}.{section}.{topic}` (§2): replaced by 3.7, the index alone says where a topic belongs.
- The study path as a list of topic ids per level, and a step as a topic at a level (§2 The study path): replaced by 3.7, the place in the study path sits on each topic of the index.
- `enabled: false` on a language or an explanation language (§2): replaced by 5.1, the status decides what reaches the site.
- Levels live on the leaves, and the range of every block, section and cheatsheet taken from them (§3 Levels): replaced by 9.5 levels, a level sits on the subtopic.
- The level colours, the level mark of seven bars, the popover, the menu and the filter behaviour (§3 Levels on the page): replaced by 8.2 and 8.5, the reading keeps the behaviour of the rebuilt screens and the web takes the look of its own design.
- Text values: text, localized and example forms, and `readers` limiting an element to listed languages (§4 Text values): replaced by 9.4, translations keyed by ids and an explanation language's own blocks in its own file.
- `status` of draft or approved per explanation language (§5): replaced by 5.1, one status of draft, in review or approved per topic.
- `translated`, one fingerprint per part (§5, §6): replaced by 9.4, fingerprints per sentence.
- The intro of lead, rule to get right and examples, at most 50 words (§5 The intro): replaced by 2.7 and 2.8, the definition under the title and the essence as part 00; the lead's length and form stay in SH-03 and SH-04.
- The intro that starts from the reader's counterpart language, with its own wording in each explanation language (§5): replaced by 6.4, the other languages translate the source; ER-08 keeps the note for readers whose language misleads.
- A language reference where words appear as examples of a rule (§5 A language reference): replaced by 3.3, practical topics that set out the words themselves.
- The section menu of overview, form, spelling, pronunciation, use, signals, own, compare and errors, the order of the grammar sections, and `features` on a tense section (§5 Sections are a menu): replaced by 2.8 and 9.5 roles, one shape for every topic.
- A rule gives its reason in a clause wherever the language has one (§5 Sections teach): replaced by 2.5, at most one why note per subtopic where the reason helps.
- The overview holding the rules that span the sections, and the cheatsheet as the one summary (§5 Sections teach, §8 Cheatsheets): replaced by 2.8, the essence at part 00.
- `related` listing related topics (§5): replaced by 3.7, the index names each topic's concepts.
- The seven block types prose, list, paradigm, usage, comparison, inventory, errors (§5, §12 Blocks): replaced by 9.5 blocks.
- The `tr` column and the translation shown after an example (§6): replaced by 9.3, the data names the translation and each screen decides how it shows.
- A page names the language of each piece for screen readers (§6): replaced by 9.4, every block and sentence belongs to one language file.
- Rows without `speakers` serve all readers (§6): replaced by 2.6, every error names its speakers.
- At most 4 columns in a rendered table, and 10 in a slot paradigm (§7): replaced by 8.8, a table wider than the screen splits into column groups that fit.
- Slot paradigms with their slot and sentence titles, merges and centring (§7): replaced by 9.3 and 9.5 blocks, the data names the grid and the screen lays it out.
- Tables first; use text only for a rule that a table cannot hold (§7): replaced by 9.5 blocks, a table only for a true grid.
- The symbols the renderer writes for each structure and mark (§7): replaced by 9.6, one designed component per data type on the board.
- The cheatsheet: its rows in order of form, use, rules and traps, its 4 to 12 rows, its shape by topic and its place as section 00 Summary (§8): replaced by 2.8, 00 Essence.
- The URL scheme with `{language}`, the toolbars, the first-visit redirect, the query parameters and the stable slug (§10 URLs): replaced by 1.4, 1.5 and 7.4, the v1 URLs, no moves after v1 and the page language.
- The workflow of one topic at a time, `draft` to `approved` after the owner's review (§11 Workflow per topic): replaced by 4.1 and 5.1 to 5.3, waves by level and a review by another model family.
- The data vocabulary: the feature list, about 30 marks, the structures alternatives, examples, mapping, takes, exchange, pattern, equivalence and contrast, the fields and the attributes (§12 Semantic data): replaced by 9.1 and 9.5 marks, a schema redesigned from these conventions with a mark only where the reader sees or hears the text differently.
- The data names meaning and the renderer decides how it looks (opening of CONVENTIONS.md): replaced by 9.3, a schema requirement outside this catalog.
