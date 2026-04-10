import type { RegExpLiteral, StringLiteral, Node } from "oxc-parser";

export function isStringLiteral(node: Node): node is StringLiteral {
  return node.type === "Literal" && typeof node.value === "string";
}

export function isRegExpLiteral(node: Node): node is RegExpLiteral {
  return node.type === "Literal" && "regex" in node;
}
