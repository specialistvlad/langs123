# Conventions

How a topic of the library is written: what a topic is, the voice of an explanation, and the direction a topic
takes its reader. One set of conventions holds for every course and every explanation language. The rule catalog,
[RULES.md](RULES.md), holds each rule with its id and its check; this text is how a writer applies them. Until the
new library replaces today's, both live side by side: this file describes `library/`, and
`languages/CONVENTIONS.md` describes `languages/`.

## 1. The library

- **A course** is one language being learned with all its topics. The library holds seven: English, French,
  Spanish, Italian, German, Ukrainian and Japanese.
- **An explanation language** is a language a course is explained in. There are twelve: English (`en`),
  Ukrainian (`uk`), Spanish (`es`), Portuguese (`pt`, Brazilian), French (`fr`), German (`de`), Italian (`it`),
  Polish (`pl`), Turkish (`tr`), Indonesian (`id`), Vietnamese (`vi`) and Japanese (`ja`). Every course is
  explained in all twelve.
- **Explanation languages are layers of a course.** A reader reads a topic in one, two or three of their own
  languages at once, the languages they know, in their own order. So every explanation of a topic says the same
  thing, sentence by sentence, in each language (§6).
- **The source language** of a course is the language it is written in first: its own language, and English for
  Japanese. Every other explanation language translates the source.
- **A course is defined through its topics.** Its index comes first: one file holding its sections in order, each
  section's topics in order, and for each topic its subject, what it covers, its levels, its concepts, its place
  in the study path and the topic of today's library it replaces. The index takes its topics and levels from
  CEFR-aligned standards for that language, as facts, never as text (§8). A topic's content is written once its
  index entry is approved.
- **Levels** follow the CEFR scale: A0 (pre-A1), A1, A2, B1, B2, C1, C2. A level sits on a subtopic (§3.4), and a
  topic's levels are the levels of its subtopics.

## 2. One shape for every topic

Every topic reads in this order:

1. **Title.**
2. **Definition:** one sentence under the title saying what the subject is.
3. **00 Essence:** the topic at a glance, in its shortest complete form.
4. **01… Subtopics:** each expands one point of the essence.
5. **Common errors:** the errors the speakers of the reader's languages make.

### 2.1 Title

The title is the subject's name, in the words a reader of that explanation language uses when looking it up:
*The English alphabet*, *Present simple*, *Words of place*. Each explanation language titles the topic in its own
usual term: «Present Simple», 現在形, «Англійський алфавіт».

### 2.2 Definition

The definition is one sentence that says what the subject is and names its key characteristics. It speaks about
the subject itself, for a reader who meets the subject for the first time:

> The English alphabet is the 26 Latin letters English is written with, from A to Z, each with a capital form, a
> small form and a name of its own.

> Words of place are prepositions: short words such as *in*, *on* and *under* that go before a noun and say where
> something is in relation to it.

> Los pronombres personales de sujeto son las palabras que nombran a quien habla, a quien escucha y a las demás
> personas sin decir su nombre: *yo*, *tú*, *él*, *ella*…

### 2.3 00 Essence

The essence shows the subject itself in its clearest, shortest complete form, one item per line:

- the alphabet's essence sets out the alphabet, one letter per line: `A a  /eɪ/`;
- the present simple's essence sets out its forms, one sentence per line: *I work.* *She works.* *I don't work.*
  *Does she work?*;
- the words of place set out each word with its one example: *in: The ball is in the box.*

Each line points to the subtopic that expands it and takes that subtopic's level. Every fact in the essence is
expanded in a subtopic, and the essence holds no fact of its own. The essence holds lines, never a table.

### 2.4 Subtopics

Each subtopic expands one point of the essence: one group of letters, one form, one use, one pair of words. A
subtopic holds, in this order:

1. **Its title**, naming its point: *Names that end in /iː/*, *Questions with do and does*, *Next to, between,
   opposite*.
2. **What:** the fact, stated as a rule in a sentence of its own.
3. **Examples:** each on its own line (§4).
4. **Why**, where a reason helps a learner remember the rule: at most one short note (§3.2).

A table appears only for a true grid, where every cell is the meeting of a row and a column: a paradigm of
persons and forms, a set of pronouns by person and number. Every other content is a sentence or a list of one item
per line.

Subtopics follow the order a learner needs: the basic form first, then its variants, then its uses, lowest level
first.

### 2.5 Common errors

The topic ends with the errors that learners make, each written once:

- **the wrong form**, as a learner writes or says it;
- **the right form**, the topic's form marked;
- **the rule**, one sentence stating the right form;
- **its speakers**: every explanation language whose speakers make the error.

An error belongs to its speakers. A reader sees the errors their languages' speakers make, and a reader with
several languages sees the errors of each. A writer names a language among the speakers when that language's
structure leads its speakers to the error: it lacks the form, builds it another way, or names it with a word that
sounds alike. An error made by learners of every first language names all twelve explanation languages but the
course's own.

A wrong form appears in Common errors alone. Everywhere else a topic states the right form.

When an explanation language joins the library, its speakers' errors arrive as blocks in its own language file
(§6.3).

## 3. The voice

### 3.1 Facts

A topic states facts clearly: the rule, the forms, the use. Every sentence states a fact of the language. It is
written in the present tense, in short sentences and plain words, in the reader's language. A grammar term is the
one that language's schools use, and its meaning is given where it first appears.

A fact reads as **what**, then **an example**, then **why** where a reason helps:

> The present simple adds *-s* to the verb after *he*, *she* and *it*.
>
> *She works in a bank.*

### 3.2 Why

A short note says why a rule is so where the reason helps a learner remember it: what a form literally means, how
it was built, the logic behind it. A subtopic holds at most one.

> The letters whose sound can be held, *f*, *l*, *m*, *n*, *s*, take the vowel before them in their names: *ef*,
> *el*, *em*, *en*, *es*. The letters whose sound stops at once take it after: *bee*, *dee*, *tee*.

> *Usted* comes from *vuestra merced*, “your grace”, so it takes the verb of *él* and *ella*.

A why note stays neutral: it states the reason as a fact of the language and its history. The facts carry the
topic, and a topic is complete without its notes.

### 3.3 About the language

A topic speaks of the language. Its sentences describe the subject, its forms and its use; the page's own parts,
the reader's progress and the reader's feelings stay out of the text. Level codes appear on the page from the
data, never in a sentence.

### 3.4 Levels

A level sits on the subtopic: a chosen level shows or hides whole subtopics. A subtopic holds the facts of its own
level, and a fact of a higher level goes to a subtopic of its own: *Timetables and programmes: The train leaves
at six* is an A2 subtopic of the present simple, beside its A1 forms.

## 4. Written for a first-time reader

- **One item per line.** Every item stands on its own line with its own example, written out in full.
- **A group's rule comes first,** as a sentence of its own, ahead of its items:

  > These eight letters have names that end in the sound /iː/.
  >
  > B /biː/
  >
  > C /siː/
  >
  > …

- **Notation sits beside its word.** An IPA transcription, a variety's form or a reading stands next to the one
  word it belongs to: *works* /wɜːks/.
- **Examples are whole.** An example is a sentence or a phrase someone says, in a situation it makes plain, in
  everyday words at or below its subtopic's level, in the language being learned. It carries its translation in
  each of the reader's languages, the words a speaker of that language says in the same situation. Where the
  explanation language is the language being learned, the example stands alone.
- **Words in full.** Abbreviations, symbols and ranges are written out: *for example*, *he, she and it*.
- **Each step builds on the steps before it.** A topic's examples use the grammar and the script that earlier
  steps of its course's study path teach, or that earlier subtopics of the same topic teach. A phrase a learner
  needs before its grammar (*bonjour*, *¿Cómo te llamas?*, はじめまして) stands as a fixed phrase, its meaning given.

## 5. Marks

The text names what each of its pieces is, and the page decides how it looks. A piece carries a mark where the
reader sees or hears it differently, or where a feature reads it:

| Mark | Marks | Example |
|---|---|---|
| target | the form the topic teaches; in an error, the corrected part | She **works** here. |
| term | a word of the language being learned inside an explanation | the letter *E* |
| ipa | a transcription, written without its slashes | /wɜːks/ |
| variant | the form of one variety, beside the form of another | /zed/, US /ziː/ |
| kanji | kanji with their reading, in the Japanese course | 食(た)べます |

Text in the language being learned carries that language for screen readers and speech, wherever it stands.

## 6. Languages and translations

### 6.1 Source first

A topic is written whole in its course's source language first: its structure, its text in the language being
learned, its explanations, its varieties and its errors. Each other explanation language then translates it.

### 6.2 Aligned sentence by sentence

Every translation stays aligned with the source block by block, and inside each block sentence by sentence. A
translation may join two sentences or split one where its language needs it, and records the sentences it joins
or splits. It states the same facts in its own language's words and grammar terms, written as a writer of that
language writes them.

### 6.3 One file per explanation language

A topic's source file holds the structure and the source text. Each explanation language's file holds its
translations, keyed by the ids of the source's blocks and sentences, and blocks of its own:

- its speakers' errors, when they joined after the source was written;
- notes for its readers alone, where their language has a close counterpart or misleads them: for Ukrainian
  readers, «я працюю» says both *I work* and *I am working*, and English chooses between the two.

Every block and every sentence has a stable id. The id stays when the text changes, so a changed sentence
re-flags only its own translations.

### 6.4 Review

A topic and each of its language files move from draft to in review to approved. Each language file carries a
flag: reviewed by a native speaker, yes or no.

## 7. Each language's norms

Each language keeps its own norms, as a course and as an explanation language.

### 7.1 Forms of address

The reader is addressed as each language addresses one reader in a friendly, respectful text:

| Language | Address |
|---|---|
| English | you |
| Ukrainian | ви |
| Spanish | tú |
| Portuguese | você |
| French | vous |
| German | du |
| Italian | tu |
| Polish | ty, with *twój* in lowercase |
| Turkish | siz |
| Indonesian | Anda |
| Vietnamese | bạn |
| Japanese | the polite です/ます style, without a word for “you” |

### 7.2 Writing

- **English** uses British spelling and British IPA. A US form stands beside its British form as an `en-US`
  variant: *at the weekend*, US *on the weekend*.
- **Spanish** opens questions and exclamations with ¿ and ¡ and writes every accent: *¿Estás bien?* *¡Qué
  bien!*
- **Ukrainian** writes the apostrophe as ’: *п’ять*. In the Ukrainian course, every word of more than one
  syllable in an example, a table cell or a form an explanation discusses carries its stress, an acute accent
  (U+0301): *Я чита́ю кни́жку.* Titles and explanation prose stand without stress marks. The dash between a
  subject and its noun predicate is Ukrainian punctuation: *Ма́ма — лі́кар.*
- **French** writes the apostrophe as ’ (*l’école*), quotes in « », and puts a no-break space (U+00A0) before
  : ; ? ! and » and after «: *Tu viens ?*
- **German** capitalises every noun, quotes in „ “ and writes ß after a long vowel or a diphthong: *Straße*,
  *heißen*.
- **Italian** writes the apostrophe as ’ (*l’acqua*), a grave accent on a final stressed vowel (*città*, *è*) and
  an acute on a final stressed closed e (*perché*).
- **Polish** quotes in „ ”.
- **Turkish** writes the apostrophe as ’, before a suffix on a proper name: *İstanbul’da*.
- **Vietnamese** writes every tone mark.
- **Japanese** is written as Japan writes it: kana and kanji without spaces, with 。 and 、. Japanese explanations
  write kanji without readings, for a Japanese reader.
- **Every language** writes an ellipsis as …, the one character, set close.

### 7.3 The Japanese course

- Japanese text is in the polite です/ます style, but where a topic teaches plain forms.
- A kanji in an example, a table cell or a form an explanation discusses carries its reading in hiragana, as
  furigana: 食(た)べます.
- A0 examples are written in kana alone. A1 and A2 examples write in kanji the words learners read in kanji at
  their level (日, 月, 人, 本, 何, 時, 食べる, 行く…), and every other word in kana.
- The A0 topics on hiragana, katakana and the kana sounds give each kana and each example its romaji, in modified
  Hepburn (*shi*, *tsu*, *Tōkyō*), beside its IPA. Every other topic writes no romaji.

### 7.4 The Ukrainian course

- A Latin transliteration, after the national system of 2010, stands beside the IPA in the A0 topics on the
  alphabet, the sounds and the soft sign.
- Forms carried over from Russian (*хворі́ти гри́пом* for *хворі́ти на грип*) are common errors whose speakers are
  all twelve explanation languages, Ukrainian among them.

### 7.5 Varieties

A course with varieties writes the default variety's forms and sets each other variety's form beside it, as a
swap. An element of one variety carries that variety; an element without one serves every variety.

| Course | Varieties, default first |
|---|---|
| English | the UK (`en-GB`), the US (`en-US`) |
| Spanish | Latin America (`es-419`), Spain (`es-ES`) |
| French | France (`fr-FR`), Canada (`fr-CA`, Québec) |

- The *vosotros* forms and the rules about them carry `es-ES`; a rule that holds in Latin America alone, such as
  *ustedes* as the one plural of *tú*, carries `es-419`. *Vos* appears in an `es-419` note.
- The French of Québec follows the Office québécois de la langue française: *déjeuner, dîner, souper* carry
  `fr-CA`, the affricates of *tu* and *dis*, [tsy] and [dzi], and the question particle *-tu* (*Tu viens-tu ?*)
  appear in `fr-CA` notes.

## 8. Standards and practical topics

### 8.1 Standards

Each course's index takes its topics and levels from the CEFR-aligned standards for its language, and each course
follows that language's reference norm for its forms:

| Course | Standards |
|---|---|
| English | the English Profile: the English Grammar Profile and the English Vocabulary Profile |
| Spanish | the Plan Curricular del Instituto Cervantes |
| Ukrainian | «Українська мова як іноземна. Рівні загального володіння А1–С2» (2024) |
| French | the Council of Europe's reference level descriptions: *Niveau A1.1*, *Niveau A1*, *Niveau A2 pour le français* |
| German | Profile deutsch |
| Italian | the Profilo della lingua italiana |
| Japanese | the JF Standard for Japanese-Language Education and 日本語教育の参照枠 (2021), with the can-dos of *Marugoto* and *Irodori* |

The index records each source and its licence, and takes facts from it: the topics and their levels.

### 8.2 Practical topics

A course also holds practical topics: clusters of words and phrases that real life needs and that standard
syllabi scatter. Each course adapts each cluster to its language. For English:

- **Question words:** what, who, where, when, why, how, which, whose, how much, how many.
- **Words of place:** in, on, under, beneath, underneath, behind, in front of, next to, between, opposite, inside,
  outside.
- **Words of movement:** to, into, onto, out of, through, across, along, past, towards, up, down.
- **Words of time:** ago, since, for, until, by, during, already, yet, still, soon.
- **How often:** always, usually, often, sometimes, rarely, never.
- **How much:** some, any, a few, a little, many, much, enough, none, all, every.
- **Linking words:** and, but, because, so, although, however, then, also.
- **Comparing:** bigger, the biggest, as big as, the same as, different from.
- **Numbers in daily life:** prices, phone numbers, dates, times, years, addresses.
- **Polite words:** please, thank you, sorry, excuse me, could you, would you mind.
- **Asking the way:** turn left, go straight on, on the corner, how do I get to.
- **Small talk:** greetings, introductions, the weather, how are you, goodbyes.
- **Full reference tables:** every irregular verb in one table.

A practical topic takes the same shape as every topic: its definition says what the words have in common, its
essence sets out every word with its example, one per line, and its subtopics group the words by meaning and by
level. What the readers of each explanation language search for becomes topics too, titled in the words they
search with.

### 8.3 Pictures

Where one picture can show all of a topic's items at once, the topic holds the picture's data: the scene, the
figures in it and how each item places them. Words of place hold one scene grid of a ball and a box, one cell
per word: the ball in, on, under and behind the box. The picture's labels and its alt text come from the items, so they follow the topic's
words in every language. The data names what the picture shows; the design system draws it.

## 9. Writing a topic

1. Write the topic in its source language: title, definition, essence, subtopics, common errors.
2. Translate it into each other explanation language, sentence by sentence (§6), with each language's norms (§7).
3. A reviewer from another model family checks each draft against these conventions and the sources; the writer
   fixes what it finds, and the topic's review record keeps the discussion and its decisions.
4. The owner approves each level wave.

A writer works from the requirements, these conventions, the rule catalog, the course's index and the standards
it names. Today's library, in `languages/`, stays unread while the new library is written.
