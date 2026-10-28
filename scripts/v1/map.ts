// Gate 4a check 8: every data type of the library has its component on the presentation map, and every component
// shows a type (requirements 9.6, 9.7). The types are the definitions of library/schema/library.schema.json, each
// property that types itself in place, and the marks of the vocabulary. Each names in x-component the component
// that shows it: R1 to R9 and I1, the Variety control, or the build, where it reaches no screen; a property typed by
// a definition takes the definition's.
import { MARKS } from "./marks.ts";

export const COMPONENTS = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "I1", "Variety control", "build"];

interface Node {
  "x-component"?: string | string[];
  $ref?: string;
  items?: Node;
  properties?: Record<string, Node>;
}

export interface Mapped {
  type: string;
  components: string[];
}

const componentsOf = (node: Node): string[] => {
  const c = node["x-component"];
  return c === undefined ? [] : Array.isArray(c) ? c : [c];
};
// A property typed by a definition: a reference to it, or a list of them.
const typedElsewhere = (node: Node): boolean => node.$ref !== undefined || node.items?.$ref !== undefined;

export function mapped(schema: { definitions: Record<string, Node> }): Mapped[] {
  return [
    ...Object.entries(schema.definitions).flatMap(([name, def]) => [
      { type: name, components: componentsOf(def) },
      ...Object.entries(def.properties ?? {})
        .filter(([, prop]) => !typedElsewhere(prop) || prop["x-component"] !== undefined)
        .map(([prop, node]) => ({
          type: `${name}.${prop}`,
          components: componentsOf(node).length > 0 ? componentsOf(node) : componentsOf(def),
        })),
    ]),
    ...Object.keys(MARKS).map((mark) => ({ type: `{${mark}}`, components: ["R8"] })),
  ];
}

// The types with no component of the map, or one the map lacks; and the components no type names.
export function mapProblems(schema: { definitions: Record<string, Node> }): { unmapped: string[]; unknown: string[]; unused: string[] } {
  const all = mapped(schema);
  const named = new Set(all.flatMap((m) => m.components));
  return {
    unmapped: all.filter((m) => m.components.length === 0).map((m) => m.type),
    unknown: all.flatMap((m) => m.components.filter((c) => !COMPONENTS.includes(c)).map((c) => `${m.type}: ${c}`)),
    unused: COMPONENTS.filter((c) => !named.has(c)),
  };
}
