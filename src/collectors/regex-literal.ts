import type { Collector } from "./types.js";
import { getPosition, isRegExpLiteral } from "./ast-utils/index.js";
import type { RegExpLiteral } from "oxc-parser";

function normalizeRegExpLiteral(node: RegExpLiteral) {
  return `${node.regex.pattern}/${node.regex.flags}`;
}

function printRegExpLiteral(node: RegExpLiteral) {
  return `/${node.regex.pattern}/${node.regex.flags}`;
}

export const regexLiteral: Collector = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) return;
        const key = normalizeRegExpLiteral(node);
        const displayName = printRegExpLiteral(node);
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
