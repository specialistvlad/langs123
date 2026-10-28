// The words-of-place sample's picture as scene cells, for the pictures' tests: each cell of the export's picture with its
// essence line's form as the caption and the line's example as the label, a mark giving its words and a variant its first form.
import type { LibraryV1 } from "../../scripts/export.ts";
import type { Figure, Ground, Place, SceneCell } from "./pictures.ts";

// The picture as the export carries it: its schema leaves the shape to the pictures.
interface Picture {
  figure: Figure;
  ground: Ground;
  cells: { line: string; place: Place; ground?: Ground | Ground[] }[];
}

function plain(text: string): string {
  let t = text;
  for (let i = 0; i < 4; i++) t = t.replace(/\{variant [A-Za-z-]+ ([^{}]*)\}/g, "$1").replace(/\{[a-z]+ ([^{}]*)\}/g, "$1");
  return t;
}

export function wordsOfPlace(v1: LibraryV1): SceneCell[] {
  const topic = v1.courses.find((c) => c.course === "en")?.topics.find((t) => t.slug === "words-of-place");
  const picture = topic?.picture as Picture | undefined;
  if (topic === undefined || picture === undefined) throw new Error("the samples hold no words-of-place picture");
  return picture.cells.map((c) => {
    const line = topic.essence.find((e) => e.id === c.line);
    const form = [line?.form ?? ""].flat()[0] ?? "";
    return {
      place: c.place,
      caption: plain(form),
      label: plain(line?.ex?.text ?? ""),
      line: c.line,
      ground: c.ground ?? picture.ground,
      figure: picture.figure,
    };
  });
}
