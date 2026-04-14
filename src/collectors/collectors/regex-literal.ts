import type { Collector } from "../types.js";
import { getPosition, isRegExpLiteral } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import type { RegExpLiteral } from "oxc-parser";

export const regexLiteral: Collector<{ value: string }> = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) return;
        const regexNode = node as RegExpLiteral;
        const { pattern, flags } = regexNode.regex;
        const key = nodeNormalizer.regExpLiteral(regexNode);
        context.add({
          key,
          data: { value: `${pattern}/${flags}` },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
