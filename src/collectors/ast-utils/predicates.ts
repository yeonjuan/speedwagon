import type {
  RegExpLiteral,
  StringLiteral,
  IdentifierName,
  IdentifierReference,
  Node,
} from "oxc-parser";

export function isStringLiteral(node: Node): node is StringLiteral {
  return node.type === "Literal" && typeof node.value === "string";
}

export function isRegExpLiteral(node: Node): node is RegExpLiteral {
  return node.type === "Literal" && "regex" in node;
}

export function isIdentifierName(node: Node): node is IdentifierName {
  return node.type === "Identifier";
}

export function isIdentifierReference(node: Node): node is IdentifierReference {
  return node.type === "Identifier";
}
