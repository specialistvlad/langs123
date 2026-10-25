// The words of a text, as reading times and word limits count them: the runs between its spaces, and inside a
// run of Japanese, which writes no spaces between words, the words the platform's segmenter finds
// (Intl.Segmenter), its punctuation left out: 私は食べます。 is about four words. And what follows an example in
// a summary's sentence, Japanese or not.

// Kana and kanji, and the ideographic punctuation and full-width forms around them.
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}、-〿！-｠]/u;
const SEGMENTER = new Intl.Segmenter("ja", { granularity: "word" });

const split = (run: string): string[] =>
  JAPANESE.test(run) ? [...SEGMENTER.segment(run)].filter((w) => w.isWordLike === true).map((w) => w.segment) : [run];

export const words = (text: string): string[] => text.split(/\s+/).filter(Boolean).flatMap(split);

// A space after a sentence, nothing after a Japanese one, 、 after a Japanese phrase, and a comma after any other.
export const afterExample = (example: string): string =>
  /[.!?]$/.test(example) ? " " : /[。！？]$/.test(example) ? "" : JAPANESE.test(example.slice(-1)) ? "、" : ", ";
