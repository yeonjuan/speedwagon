import type {
  RegExpLiteral,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  NullLiteral,
  BigIntLiteral,
  IdentifierReference,
} from "oxc-parser";

function stringLiteral(node: StringLiteral) {
  return `str(${node.value})`;
}

function regExpLiteral(node: RegExpLiteral) {
  return `regex(${node.regex.pattern}/${node.regex.flags})`;
}

function numericLiteral(node: NumericLiteral) {
  return `num(${node.value})`;
}

function booleanLiteal(node: BooleanLiteral) {
  return `boolean(${node.value}`;
}

function nullLiteral(node: NullLiteral) {
  return `null`;
}

function bigintLiteral(node: BigIntLiteral) {
  return `bigint(${node.bigint})`;
}
