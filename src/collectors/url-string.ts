import type { Collector } from "./types.js";
import { getPosition, isStringLiteral } from "./ast-utils/index.js";
import type { StringLiteral, TemplateLiteral } from "oxc-parser";

function isUrlString(value: string) {
  return /^https?:\/\//.test(value);
}

function normalizeStringLiteral(node: StringLiteral | TemplateLiteral): string {
  if (isStringLiteral(node)) return node.value;
  return node.quasis[0].value.cooked || "";
}

const MAX_LENGTH = 30;

function truncate(value: string) {
  return value.length > MAX_LENGTH ? value.slice(0, MAX_LENGTH) + "..." : value;
}

function printStringLiteral(node: StringLiteral | TemplateLiteral) {
  if (isStringLiteral(node)) return truncate(node.value);
  return truncate(node.quasis[0]?.value.cooked || "");
}

export const urlString: Collector = {
  id: "url-string",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isStringLiteral(node)) return;
        if (!isUrlString(node.value)) return;
        const key = normalizeStringLiteral(node);
        const displayName = printStringLiteral(node);
        context.add({
          key,
          displayName,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
      TemplateLiteral(node) {
        if (node.expressions.length > 0) return;
        const value = node.quasis[0]?.value.cooked;
        if (!value) return;
        if (!isUrlString(value)) return;
        const key = normalizeStringLiteral(node);
        const displayName = printStringLiteral(node);
        context.add({
          key,
          displayName,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
