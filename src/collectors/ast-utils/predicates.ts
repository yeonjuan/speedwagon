import type {
  RegExpLiteral,
  StringLiteral,
  Node,
  TSAnyKeyword,
  TSThisType,
  TSNullKeyword,
  TSVoidKeyword,
  TSNeverKeyword,
  TSBigIntKeyword,
  TSNumberKeyword,
  TSObjectKeyword,
  TSStringKeyword,
  TSSymbolKeyword,
  TSBooleanKeyword,
  TSUnknownKeyword,
  TSIntrinsicKeyword,
  TSUndefinedKeyword,
  TSTypeReference,
} from "oxc-parser";

type TSKeyword =
  | TSAnyKeyword
  | TSThisType
  | TSNullKeyword
  | TSVoidKeyword
  | TSNeverKeyword
  | TSBigIntKeyword
  | TSNumberKeyword
  | TSObjectKeyword
  | TSStringKeyword
  | TSSymbolKeyword
  | TSBooleanKeyword
  | TSUnknownKeyword
  | TSIntrinsicKeyword
  | TSUndefinedKeyword;

export function isStringLiteral(node: Node): node is StringLiteral {
  return node.type === "Literal" && typeof node.value === "string";
}

export function isRegExpLiteral(node: Node): node is RegExpLiteral {
  return node.type === "Literal" && "regex" in node;
}

export function isTSTypeReference(node: Node): node is TSTypeReference {
  return node.type === "TSTypeReference";
}

export function isKeyword(node: Node): node is TSKeyword {
  return (
    node.type === "TSAnyKeyword" ||
    node.type === "TSNullKeyword" ||
    node.type === "TSVoidKeyword" ||
    node.type === "TSNeverKeyword" ||
    node.type === "TSBigIntKeyword" ||
    node.type === "TSNumberKeyword" ||
    node.type === "TSObjectKeyword" ||
    node.type === "TSStringKeyword" ||
    node.type === "TSSymbolKeyword" ||
    node.type === "TSBooleanKeyword" ||
    node.type === "TSUnknownKeyword" ||
    node.type === "TSIntrinsicKeyword" ||
    node.type === "TSUndefinedKeyword" ||
    node.type === "TSThisType"
  );
}
