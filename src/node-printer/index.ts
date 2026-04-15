import type { RegExpLiteral } from "oxc-parser";

export function printRegExpLiteral(node: RegExpLiteral) {
  return `${node.regex.pattern}/${node.regex.flags}`;
}
