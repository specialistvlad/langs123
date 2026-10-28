// The fixture's topic, en.letters: an essence, a subtopic of a fact, a list and a why, a subtopic of a fact, a table
// and examples, two errors and a picture (scripts/v1/fixture.ts).
import type { TopicSource } from "../generated/library-v1.ts";

export const SOURCE: TopicSource = {
  id: "en.letters",
  status: "draft",
  nativeReview: false,
  title: { id: "title", text: "The letters" },
  definition: { id: "def", text: "The letters are {term A} and {term Z}, each with a name." },
  essence: [
    { id: "ess.a", to: "names", form: ["A", "a"], ipa: "eɪ" },
    { id: "ess.z", to: "names", form: "Z", ipa: "{variant en-GB zed} {variant en-US ziː}" },
    { id: "ess.do", to: "forms", ex: { id: "ess.do.ex", text: "I {target work}." } },
  ],
  subtopics: [
    {
      id: "names",
      level: "A0",
      title: { id: "names.title", text: "Names" },
      blocks: [
        { id: "names.fact", type: "fact", text: [{ id: "names.fact.1", text: "Each letter has a name, as {term A} has {ipa eɪ}." }] },
        {
          id: "names.list",
          type: "list",
          items: [
            { id: "names.a", form: "A", ipa: "eɪ", ex: { id: "ex.apple", text: "{target a}pple" } },
            { id: "names.z", form: "Z", text: "Its name differs by variety.", ex: { id: "ex.zoo", text: "{target z}oo" } },
          ],
        },
        { id: "names.why", type: "why", text: [{ id: "names.why.1", text: "A name lets a letter be said." }] },
      ],
    },
    {
      id: "forms",
      level: "A1",
      title: { id: "forms.title", text: "Forms" },
      blocks: [
        { id: "forms.fact", type: "fact", text: [{ id: "forms.fact.1", text: "The verb adds {term -s} after {term he}." }] },
        {
          id: "forms.table",
          type: "table",
          axes: { rows: "person", columns: "number" },
          columns: [
            { id: "forms.col.person", key: "person", text: "Person" },
            { id: "forms.col.sg", key: "sg", text: "Singular" },
            { id: "forms.col.pl", key: "pl", text: "Plural" },
          ],
          rows: [
            {
              id: "forms.first",
              features: { person: 1 },
              cells: { person: { id: "forms.first.name", text: "first person" }, sg: ["I {target work}."], pl: "We {target work}." },
            },
            {
              id: "forms.third",
              features: { person: 3 },
              cells: { person: "he", sg: [{ form: "He {target works}.", variety: "en-GB" }], pl: ["They work."] },
            },
          ],
        },
        {
          id: "forms.example",
          type: "example",
          items: [
            { id: "forms.office", text: "I {target work} in an office." },
            { id: "forms.us", text: "He {target works}.", variety: "en-GB" },
          ],
        },
      ],
    },
  ],
  errors: [
    {
      id: "err.a",
      in: "names",
      wrong: "A {ipa a}",
      right: "A {ipa eɪ}",
      rule: { id: "err.a.rule", text: "The name of {term A} is {ipa eɪ}." },
      speakers: { uk: { id: "err.a.uk", text: "Ukrainian reads {term A} as {l1 uk а}." } },
    },
    {
      id: "err.s",
      in: "forms",
      wrong: "She work.",
      right: { id: "err.s.right", text: "She {target works}." },
      rule: { id: "err.s.rule", text: "The verb adds {term -s}." },
      speakers: { ja: { id: "err.s.ja", text: "Japanese verbs keep one form." } },
    },
  ],
  picture: {
    id: "picture",
    kind: "scene-grid",
    figure: "ball",
    ground: "box",
    cells: [
      { line: "ess.a", place: "contained" },
      { line: "ess.z", place: "between", ground: ["box", "box"] },
    ],
  },
};
