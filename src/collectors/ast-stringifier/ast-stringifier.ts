import type { RegExpLiteral, StringLiteral } from "oxc-parser";

function stringLiteral(node: StringLiteral): string {
  return `str(${node.value})`;
}

function regExpLiteral(node: RegExpLiteral): string {
  return `regex(${node.regex.pattern}/${node.regex.flags})`;
}

export const normalize = {
  stringLiteral,
  regExpLiteral,
};
