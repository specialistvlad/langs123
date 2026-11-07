// The lemmas a word may stand for in a source language, for a lookup in a vocabulary list that holds dictionary forms:
// the word itself, the part before an apostrophe, and the word with one of the language's endings taken off and the
// dictionary ending put in its place. Each candidate is tried against the list, so an ending taken off a word that
// never carried it finds nothing. The tables hold the common endings of nouns, adjectives and verbs, each written
// ending>lemma; a form they miss goes to the question with the word as written.
const TABLES: Record<string, string> = {
  en: "ies>y ied>y ier>y iest>y es> s> ed> ed>e d> ing> ing>e er> er>e est> est>e ly> n't> n’t>",
  es: [
    "es> s> as>o a>o os>o mente> o>ar as>ar a>ar amos>ar áis>ar an>ar aba>ar ó>ar ado>ar ada>ar ando>ar",
    "e>er es>er emos>er en>er ía>er ió>er ido>er iendo>er e>ir es>ir imos>ir en>ir ía>ir ió>ir ido>ir iendo>ir",
  ].join(" "),
  fr: [
    "s> x> e> es> ment> e>er es>er ons>er ez>er ent>er é>er ée>er és>er ées>er ais>er ait>er aient>er ant>er",
    "is>ir it>ir issons>ir issez>ir issent>ir i>ir u>re ons>re ez>re ent>re",
  ].join(" "),
  it: [
    "i>o e>a i>e mente> o>are i>are a>are iamo>are ate>are ano>are ato>are ata>are ando>are ava>are",
    "o>ere i>ere e>ere ete>ere ono>ere uto>ere endo>ere eva>ere o>ire i>ire e>ire ite>ire isce>ire iscono>ire ito>ire iva>ire",
  ].join(" "),
  de: "e> en> er> es> em> n> s> e>en st>en t>en et>en te>en ten>en test>en tet>en",
  uk: [
    "а> у> ою> і> и> ів> ам> ами> ах> е> ом> я> ю> єю> ї> ій> ого> ому> им> ими> их> ої>",
    "у>а и>а і>а ою>а ам>а ами>а ах>а ю>я і>я ею>я ям>я ями>я ях>я а>о у>о ом>о і>о",
    "ого>ий ому>ий им>ий ими>ий их>ий а>ий е>ий і>ий ої>ий ій>ий ою>ий",
    "ю>ти єш>ти є>ти ємо>ти єте>ти ють>ти еш>ти емо>ти ете>ти уть>ти иш>ити ить>ити имо>ити ите>ити ять>ити ать>ати",
    "в>ти ла>ти ло>ти ли>ти ться>тися ється>тися",
  ].join(" "),
};

const ENDINGS = new Map(
  Object.entries(TABLES).map(([language, table]) => [
    language,
    table.split(" ").map((pair): [string, string] => {
      const [ending = "", lemma = ""] = pair.split(">");
      return [ending, lemma];
    }),
  ]),
);

// A word's possible lemmas, the word first; a stem keeps two letters at the least.
export function lemmas(word: string, language: string): string[] {
  const out = new Set([word]);
  const apostrophe = word.search(/['’]/u);
  if (apostrophe > 1) out.add(word.slice(0, apostrophe));
  for (const [ending, lemma] of ENDINGS.get(language) ?? []) {
    if (word.endsWith(ending) && word.length >= ending.length + 2) out.add(word.slice(0, word.length - ending.length) + lemma);
  }
  return [...out];
}
