import type { Collector } from "../types.js";
import { getPosition, isRegExpLiteral } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";

export const regexLiteral: Collector = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) return;
        const key = nodeNormalizer.regExpLiteral(node);
        context.add({
          key,
          name: `${node.regex.pattern}/${node.regex.flags}`,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
