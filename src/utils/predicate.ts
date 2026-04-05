import type { StringLiteral } from "oxc-parser";
import { TYPE_STRING, AST_TYPES } from "../constants/index.js";

export function isObjectNode(n: any): n is Record<string, any> {
  return !!n && typeof n === "object";
}

export function isStringLiteralNode(n: any): n is StringLiteral {
  return n?.type === AST_TYPES.Literal && typeof n.value === TYPE_STRING;
}
