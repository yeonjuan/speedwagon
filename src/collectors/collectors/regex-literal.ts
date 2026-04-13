import type { Collector } from "../types.js";
import { getPosition, isRegExpLiteral } from "../ast-utils/index.js";
import type { RegExpLiteral } from "oxc-parser";

export const regexLiteral: Collector<{ value: string }> = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) return;
        const { pattern, flags } = (node as RegExpLiteral).regex;
        const key = `${pattern}/${flags}`;
        context.add({
          key,
          data: { value: key },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
