# Conventions

How a topic of the library is written: what a topic is, how an explanation sounds, and where a topic takes its
reader. One set of conventions holds for every course and every explanation language. Until the new library
replaces today's, both live side by side: this file and the rule catalog describe `library/`, and
`languages/CONVENTIONS.md` describes `languages/`.

The rule catalog, [RULES.md](RULES.md), holds each rule with its id, a negative example and its check. This text
restates every rule of the catalog by its id, in the order a writer meets them (CA-01). A rule says what holds;
its contrast stands in the catalog's Not this (CA-02), which quotes today's pages with the file in parentheses
(CA-03). Each rule names one check: the schema, the linter, one typed question about one block or one sentence, or
a test of the apps, the build or the pipeline (CA-04). A rule holds for every course and every explanation
language, or for the courses and languages its Courses and Languages lines list, and the catalog is the one place
that sets rules (CA-05).

## 1. The library

- **A course** is one language being learned with all its topics. The library holds seven: English, French,
  Spanish, Italian, German, Ukrainian and Japanese, each explained in all twelve explanation languages (IX-20).
- **An explanation language** is a language a course is explained in: English (`en`), Ukrainian (`uk`), Spanish
  (`es`), Portuguese (`pt`, Brazilian), French (`fr`), German (`de`), Italian (`it`), Polish (`pl`), Turkish
  (`tr`), Indonesian (`id`), Vietnamese (`vi`) and Japanese (`ja`).
- **Explanation languages are layers of a course.** A reader reads a topic in one, two or three of their own
  languages at once, in their own order, so every layer says the same thing, sentence by sentence (§8).
- **The source language** of a course is the language its explanations are written in first: the course's own
  language, and English for Japanese; the index names it (LA-09).
- **Levels** are the CEFR scale: A0, A1, A2, B1, B2, C1, C2 (IX-17). English, Spanish and Ukrainian hold topics at
  every level from A0 to C2 (IX-18); French, Japanese, Italian and German hold A0, A1 and A2 at v1 (IX-19).
- **A course is defined through its topics:** its index first (§9), then the text of each topic.

## 2. One shape for every topic

A topic holds, in this order: its title, its definition, the essence as part 00, its subtopics as parts 01
onward, and its common errors (SH-02).

### 2.1 Title

The title is the name of the subject, in one phrase of at most six words, or at most 12 characters in Japanese
(SH-01): *The English alphabet*, *Present simple*, *Words of place*, 現在形.

### 2.2 Definition

- The definition is one sentence under the title, of at most 160 characters (80 in Japanese), ending with a full
  stop (。 in Japanese) and starting with a capital letter where the language has capitals (SH-03).
- It is a complete sentence with a main verb (SH-04).
- It says what the subject is (SH-05) and names the characteristics that set the subject apart from its
  neighbours (SH-06).
- Every sentence of the opening speaks about the subject itself (SH-07): the opening states what the subject is
  and does, and every word of it concerns the subject (SH-08).
- It uses words and terms a reader at the topic's lowest level knows, apart from the term it defines (SH-09).

> The English alphabet is 26 Latin letters, each with a capital form, a small form and its own name.

> Words of place are prepositions, such as *in* and *under*, that go before a noun and say where something is.

### 2.3 00 Essence

- Part 00 is the essence: the subject at a glance, in its shortest complete form, set out as the subject itself
  (SH-10). The alphabet's essence sets out the alphabet, one letter per line; the present simple's sets out its
  forms, one sentence per line; the words of place set out each word with its example.
- The essence block holds one line per point of the subject (SH-11).
- Each essence line points to the one subtopic that expands it, and every subtopic is pointed to by at least one
  line (SH-12).
- An essence line carries the level of the subtopic it points to, and shows or hides with it (SH-13).

### 2.4 Subtopics

- The subtopics carry the numbers 01, 02 and so on, in reading order, after part 00 (SH-14).
- A subtopic expands one point of the essence (SH-15) and states the rule, the forms and the use of that point as
  facts (SH-21).
- It gives its fact in one block and its example in the block after it (SH-16): a fact, then a list whose items
  each carry their example, or a fact, then an example block.
- Every block of a topic belongs to the subject its title names (SH-22).
- A fact appears in one subtopic; the essence points to it and the common errors name it (SH-23).

### 2.5 Why

- A reason stands in a why block after the example, and the fact is stated in its own block (SH-17).
- A subtopic holds at most one why block (SH-18).
- A why block gives the reason that makes the fact easy to remember, such as how the form is built or what it
  literally means (SH-19), and states it in a neutral voice; the facts carry the topic (SH-20).

> *B*, *D*, *P* and *T* stand for sounds that stop at once. Their names put the vowel after them: /biː/, /diː/,
> /piː/, /tiː/.

> *Usted* viene de *vuestra merced*, una forma antigua de respeto. Por eso va con el verbo de *él* y *ella*.

### 2.6 Common errors

The topic ends with its part named Common errors, which holds the errors of the reader's languages (SH-24); §5
says how an error is written.

## 3. The voice

- A sentence of explanation holds at most 20 words; Japanese is measured in characters, at most 50 (VO-01).
- The sentences of an explanation are in the present tense (VO-02). A why block tells history in the present
  too: *Usted viene de vuestra merced.*
- An explanation sentence uses words a reader at its subtopic's level knows, apart from the term it explains
  (VO-03).
- The sentences of a subtopic speak about the subject (VO-04). A level appears in the subtopic's level field, and
  explanation sentences speak in the words of the subject (VO-05).
- A fact, a form and an example state the correct form; wrong forms stand in the common errors (VO-06).
- An example is a sentence someone says in a situation it makes plain, in words at or below the subtopic's level
  (VO-07).
- The translation of an example is what a speaker of the reader's language says in the same situation (VO-08):
  *Ellos llegan hoy, y ellas, mañana* is in Ukrainian «Хлопці приїжджають сьогодні, а дівчата — завтра».

## 4. Written for a first-time reader

- Every item stands on a line of its own; a line holds one item (FT-01).
- Every item that states a rule or a form comes with an example of its own (FT-02), the whole word or the whole
  sentence, written out in full (FT-03).
- A group's rule is a sentence of its own, placed before the items it governs (FT-04):

  > Eight letters have names that end in the vowel /iː/, as in *see*.
  >
  > B /biː/ *book*
  >
  > C /siː/ *cat*

- A notation such as IPA sits beside the one word it belongs to (FT-05): *works* /wɜːks/.
- A reader who meets the subject for the first time understands each item as it stands (FT-06).
- An example is in the language being learned and carries its translation in each of the reader's languages;
  where the reader's language is the language being learned, the example stands alone (FT-07).
- An example, an explanation and a table use only the grammar, script and forms that earlier steps of the study
  path teach, or that earlier parts of the same topic teach; a set phrase a learner needs earlier stands as a
  fixed phrase with its meaning (FT-08): *bonjour*, *¿Cómo te llamas?*, はじめまして.

## 5. Common errors

- An error is one case, written once, with every language whose speakers make it listed in it (ER-01).
- Every error names the languages whose speakers make it, each with its reason (ER-02). It lists exactly the
  explanation languages whose speakers make it, each with its reason: a source that documents the error, or a
  known contrast with that language, where it lacks the form, builds it another way or names it with a word that
  sounds alike (ER-03). Each name is a claim about that language's speakers, made for that language alone.
- A reader sees the errors whose speakers include any of the reader's languages, and a reader with several
  languages sees the errors of each (ER-04).
- The errors of a new explanation language's speakers arrive as blocks in that language's own file, each naming
  that language among its speakers (ER-05).
- An error holds the wrong form, its correct form and the rule it breaks (ER-06).
- The wrong form is wrong in the language; a choice of register or style belongs to the subtopic on use or
  comparison (ER-07).
- Where a language has a close counterpart that misleads, a block of that language's own, in its file, states
  the difference for its readers (ER-08): for Ukrainian readers, «ви» covers both *usted* and *ustedes*.
- Each error names its subtopic in `in:` and takes that subtopic's level (ST-13).

> *She work in a bank.* → *She **works** in a bank.* After *he*, *she* and *it*, the verb adds *-s*.
> Speakers: Japanese, Indonesian and Vietnamese, whose verbs have one form for every person.

## 6. Structure

### 6.1 Blocks

- A block is an essence, a fact, an example, a list, a table, a why or errors; the essence is the block of part
  00 and errors are the block of the common errors (ST-01).
- A list holds its items one per line, and each item is one entry (ST-02).
- A table declares the two axes it crosses, such as person and tense, and every cell sits at one crossing
  (ST-03).
- A table of forms holds the forms; its examples stand below it, each with its translation (ST-04).

### 6.2 Marks

- Each mark in the vocabulary records why it exists: the way the reader sees it, the way the reader hears it, or
  the planned feature that reads it (ST-05).
- Marked text uses the marks of the vocabulary, each wrapping the part of the text it concerns (ST-06): the form
  the topic teaches, a word of the language being learned inside an explanation, a transcription, a variety's
  form, a kanji with its reading.
- An `ipa` mark holds the IPA symbols of one transcription, and the reader sees them between slashes (ST-07).
- A `date`, `weekday`, `time`, `numeral` or `ordinal` mark carries its value in ISO form: 2026-07-03, Monday as
  1, 09:30, 200, 3 (ST-08).

### 6.3 Roles and levels

- Each subtopic role in the schema names the order or the layout it changes (ST-09), and a subtopic carries a
  role where the role changes the order or the layout (ST-10).
- Each subtopic carries exactly one level (ST-11), and its rows, items, paragraphs and errors take that level
  (ST-12). A chosen level shows or hides whole subtopics.
- The index states each topic's planned levels, and the levels of the topic's subtopics equal them (ST-14).

## 7. Each language's norms

### 7.1 English

- Text of the English course uses British spelling; en-GB is the default variety (NO-01).
- IPA in the English course transcribes the British pronunciation; a US value stands in an en-US variant (NO-02).
- Each US form stands beside its British form as a swap: *at the weekend*, *on the weekend* (NO-03).
- English text writes the apostrophe as the straight ' (NO-47).

### 7.2 Spanish

- Spanish forms follow the reference norm of the Plan Curricular del Instituto Cervantes (NO-04).
- Spanish text opens a question with ¿ and an exclamation with ¡ (NO-05) and writes every accent its words need
  (NO-06): *¿Estás bien?*
- The *vosotros* forms and the rules about them carry es-ES (NO-29). A rule that holds in Latin America alone,
  such as *ustedes* as the one plural of *tú*, carries es-419 (NO-30). Voseo appears in a fact block that carries
  es-419 (NO-31).

### 7.3 Ukrainian

- Ukrainian forms follow the examples of the state standard «Українська мова як іноземна. Рівні загального
  володіння А1–С2» (2024) (NO-07).
- Ukrainian text writes the apostrophe as ’: *п’ять* (NO-08).
- In the Ukrainian course, every word of more than one syllable in an example, a table cell or a form an
  explanation discusses carries its stress, an acute accent (U+0301): *Я чита́ю кни́жку* (NO-09). Ukrainian titles
  and explanation prose are written in plain letters, and so are Ukrainian explanations of every other course
  (NO-10).
- A Latin transliteration after the national system of 2010 appears beside the IPA in exactly three A0 topics:
  the alphabet, the sounds and the soft sign (NO-11).
- A form carried over from Russian is a common error whose speakers are Ukrainian (NO-12).
- The dash between a noun subject and its noun predicate stands in Ukrainian examples: *Ма́ма — лі́кар* (NO-13).

### 7.4 French

- French forms follow the norm of France, as the Council of Europe reference level descriptions give them
  (NO-14).
- French text writes the apostrophe as ’: *l’école* (NO-15). It quotes in « », with a no-break space inside each
  guillemet (NO-16), and sets a no-break space (U+00A0) before : ; ? ! and »: *Tu viens ?* (NO-17).
- French IPA follows the pronunciation of France; the vowels and affricates of Québec stand in elements of fr-CA
  (NO-18).
- The meals *petit-déjeuner, déjeuner, dîner* carry fr-FR, and *déjeuner, dîner, souper* carry fr-CA (NO-32).
- The affricates of *tu* and *dis*, [tsy] and [dzi], appear in elements that carry fr-CA (NO-33). The question
  particle *-tu* of speech, *Tu viens-tu ?*, appears in fact blocks that carry fr-CA (NO-49).

### 7.5 Japanese

- Japanese text runs kana and kanji together, each word following the last as Japan writes it (NO-19); it ends a
  sentence with 。 and separates clauses with 、 (NO-20).
- Japanese text is in the polite です/ます style, except where a topic teaches plain forms (NO-21).
- The A0 topics on hiragana, katakana and kana sounds give each kana and each example its romaji, in modified
  Hepburn (*shi*, *tsu*, *Tōkyō*), beside its IPA (NO-22). Every other Japanese topic is written in Japanese
  script (NO-23).
- In the Japanese course, a kanji in an example, a table cell or a form an explanation discusses carries its
  reading in hiragana: 食(た)べます (NO-24). Examples at A0 are written in kana (NO-25); examples at A1 and A2 write
  in kanji the words learners read in kanji at their level (日, 月, 人, 本, 何, 時, 食べる, 行く…) and every other
  word in kana (NO-26).
- A Japanese explanation writes kanji as a Japanese reader reads them, with no furigana or romaji; readings
  belong to the Japanese course's examples (NO-57).
- A Japanese explanation addresses the reader with no word for "you": the sentence is built without あなた
  (NO-58).

### 7.6 German, Italian, Polish, Turkish and Vietnamese

- German text writes quotation marks as „ “ and keeps ß where the spelling has it: *Straße* (NO-52).
- Italian text writes the grave or acute accent on a final stressed vowel: *città*, *perché*, *però* (NO-53).
- Polish text writes quotation marks as „ ” (NO-54).
- Turkish text writes ’ between a proper name and its suffix: *İstanbul’da*, *Ayşe’nin* (NO-55).
- Vietnamese text writes every tone mark and diacritic of each word: *tiếng Việt* (NO-56).

### 7.7 Varieties

- A course with varieties lists them with the default first: en-GB then en-US, es-419 then es-ES, fr-FR then
  fr-CA (NO-27).
- The `variety` of an element is one of the varieties its course lists, and an element without it serves every
  variety (NO-28). A block that holds a form of one variety alone carries that variety's tag (NO-50).
- Where varieties say one thing differently, the text holds a variant of each, side by side (NO-34): /zed/ for
  en-GB and /ziː/ for en-US. A form both varieties share stays plain text, so the two forms of a swap differ
  (NO-51).

### 7.8 Address and shared typography

Each explanation language addresses the reader in its own way:

| Language | Address |
|---|---|
| Ukrainian | ви (NO-35) |
| Spanish | tú (NO-36) |
| Portuguese | Brazilian, você (NO-37) |
| French | vous (NO-38) |
| German | du (NO-39) |
| Italian | tu (NO-40) |
| Polish | ty, with *twój* in lowercase (NO-41) |
| Turkish | siz (NO-42) |
| Indonesian | Anda (NO-43) |
| Vietnamese | bạn (NO-44) |
| Japanese | no word for "you" (NO-58) |

- Every language names a topic with its own word: topic (en), тема (uk), tema (es), tópico (pt), thème (fr), Thema
  (de), argomento (it), temat (pl), konu (tr), topik (id), chủ đề (vi), トピック (ja) (NO-45).
- Italian and Turkish write the apostrophe as ’, as Ukrainian and French do (NO-46).
- An ellipsis is the single character …, set close to the word before it (NO-48).

## 8. Languages and translations

- Every topic of a course has a source file and one file for each explanation language of the course (LA-01).
- Adding a course or an explanation language is an entry in the data and its text; every list of languages in
  the build and the checks is read from that data (LA-02), and the checks name every missing file, id, name and
  string with its path (LA-03).
- Each topic's record names its writer; the content session leads, and each course has one writer working under
  it (LA-04).
- A topic is written whole in its source language first: its structure, its text in the language being learned,
  its explanations, its varieties and its errors with their speakers (LA-09). Each other explanation language
  translates it.
- Each block of an explanation language's file pairs with one block of the source, by the block's id (LA-05), and
  inside a block each translated sentence pairs with a source sentence, by the sentence's id (LA-06).
- A translation that joins or splits sentences where its language needs it records the pairing: which source
  sentences make which translated sentence (LA-07).
- A fingerprint belongs to one source sentence, and a changed source sentence flags exactly that sentence
  (LA-08); a translated sentence carries the current fingerprint of its source sentence (LA-10).
- A translation states the same facts in its own language's words and grammar terms. A language's file also
  holds blocks of its own: its speakers' errors (ER-05) and the facts its readers need where their language
  misleads (ER-08).

## 9. The index

A course is defined through its index before any topic of it is written.

- Each course has one index file, and every course has one (IX-01).
- The index lists the course's sections in order; each section has its own id, free of any order number, and its
  name in all twelve explanation languages (IX-02). Each section lists its topics in the order a reader meets
  them (IX-03).
- A topic's section is named once, in the index; the topic's file and path carry the topic's slug (IX-04).
- Each topic in the index names its concepts from the one registry shared by every course (IX-05) and its place
  in the study path, level by level (IX-06).
- Each `replaces` entry names a topic that exists in today's library (IX-07), and a topic that treats the subject
  of one of today's topics names it in `replaces` (IX-24).
- Each topic in the index states its subject, what it covers and its planned levels before any text of it is
  written (IX-08).
- A course's index lists the sources it was drawn from, each with its name, its licence and what the index took
  from it (IX-09). It draws on at least two international, CEFR-aligned sources for its language (IX-10), and
  takes topics and levels from them while its own sentences are worded independently (IX-11).
- A practical topic carries the mark `practical` in the index (IX-12). Each course's index holds a topic for each
  practical cluster: question words, words of place, of movement and of time, how often, how much, linking words,
  comparing, numbers in daily life, polite words, asking the way, small talk, and full reference tables (IX-13). A
  full reference table holds the whole set, such as every irregular verb in one table (IX-14). A practical topic
  lists the words and forms of its own course's language (IX-15).
- For each explanation language, the search needs of its readers are listed with the query behind each, and each
  real need is a topic written for that public (IX-16).
- Each index entry carries a status of draft, in review or approved (IX-21); while its course's index is a draft,
  every entry in it is a draft (IX-25). A topic receives its text once its course's index is approved (IX-22).
- A section id and a topic id are lowercase letters, digits and hyphens (IX-23). A section id is unique within a
  course, and a topic id within a section (IX-26).

## 10. Review

- An index and a topic each carry one status: draft, in review or approved (RV-01). A status moves from draft to
  in review to approved, one step at a time (RV-02). Drafts and work in review stay off the published site; a
  topic reaches it once it is approved (RV-03).
- Each topic's review record holds each finding, its decision and what the writer changed (RV-04); a topic in
  review or approved has one (RV-16).
- The review record names the writer's model family and the reviewer's, and the two differ (RV-05). Each finding
  cites a rule id of the catalog or the source it rests on (RV-06), and every finding has the writer's answer:
  fixed, or declined with a reason (RV-07).
- The conventions, every index, the samples and each level wave carry the owner's approval with its date
  (RV-08). Within a wave, the owner reads the Ukrainian and the English of every topic the checks flag (RV-09)
  and of one topic in ten of the rest, drawn at random (RV-10).
- Each sentence of a translation says exactly what its source sentence says (RV-11). Each language's own errors
  and norms are checked by two models whose verdicts agree (RV-12).
- A topic carries one flag for each language it is written in: reviewed by a native speaker, yes or no (RV-13).
  The Ukrainian flag is yes on the topics the owner read in Ukrainian, and every other flag is no until native
  contributors join (RV-14). Every language shows on the site in the same form, reviewed or not (RV-15).

## 11. Pictures

Where one picture can show all of a topic's items at once, the topic holds the picture's data: the scene, the
figures in it and where each item places them. Words of place hold a scene grid of a ball and a box, one cell per
word. The picture's labels and alt text come from the items, so they follow the topic's words in every language,
and the design system draws the picture.

## 12. Writing a topic

1. Read the topic's index entry: its subject, what it covers, its planned levels and its sources.
2. Write the topic in its source language: title, definition, essence, subtopics, common errors.
3. Translate it into each other explanation language, sentence by sentence (§8), with each language's norms (§7).
4. A reviewer from another model family checks the draft against this catalog and the sources (§10).

A writer works from the requirements, these conventions, the rule catalog, the course's index and the sources it
names. Today's topics, in `languages/`, stay unread while the new library is written.
