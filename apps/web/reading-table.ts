// How a table of the reading (R5) fits its column: each column asks for its longest line at the reading size with the cell's
// padding, a header counting half its length as it may wrap; the columns stand whole when their widths sum to the column,
// otherwise they split into the fewest groups of the first column and as even a share of the others as fits.
const CHAR = 7.4;
const PADDING = 20;
const FIRST_EXTRA = 10;

// The width a column asks for, from its head's length and its cells' plain lines.
export function columnWidth(head: number, lines: readonly number[], first: boolean): number {
  return Math.ceil(Math.max(Math.ceil(head / 2), ...lines) * CHAR + PADDING + (first ? FIRST_EXTRA : 0));
}

// The column groups that fit the box, each opening with the first column.
export function splitColumns<T>(columns: readonly T[], width: (column: T) => number, box: number): T[][] {
  const [first, ...rest] = columns;
  if (first === undefined) return [];
  const w = columns.map(width);
  const fits = (group: number[]): boolean => group.reduce((sum, i) => sum + (w[i] ?? 0), 0) <= box;
  const idx = rest.map((_, i) => i + 1);
  if (fits([0, ...idx])) return [[...columns]];
  for (let g = 2; g <= rest.length; g++) {
    const size = Math.ceil(rest.length / g);
    const groups = Array.from({ length: g }, (_, k) => [0, ...idx.slice(k * size, (k + 1) * size)]).filter((gr) => gr.length > 1);
    if (groups.every(fits)) return groups.map((gr) => gr.flatMap((i) => columns[i] ?? []));
  }
  return rest.map((c) => [first, c]);
}
