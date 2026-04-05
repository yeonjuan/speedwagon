import type { StringLiteral } from "oxc-parser";
import { TYPE_LITERAL, TYPE_STRING } from "../constants.js";

export function isObjectNode(n: any): n is Record<string, any> {
  return !!n && typeof n === "object";
}

export function isStringLiteralNode(n: any): n is StringLiteral {
  return n?.type === TYPE_LITERAL && typeof n.value === TYPE_STRING;
}
