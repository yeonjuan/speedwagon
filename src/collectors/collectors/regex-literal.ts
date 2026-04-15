import type { Collector } from "../types.js";
import { getPosition, isRegExpLiteral } from "../ast-utils/index.js";
import type { RegExpLiteral } from "oxc-parser";
import { normalizeRegExpLiteral } from "../../normalizer/normalizer.js";
import { printRegExpLiteral } from "../../node-printer/index.js";

export const regexLiteral: Collector<{ value: string }> = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) return;
        const key = normalizeRegExpLiteral(node);
        context.add({
          key,
          data: { value: printRegExpLiteral(node) },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
