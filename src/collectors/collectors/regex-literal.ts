import type { Collector } from "../types.js";
import {
  getPosition,
  isRegExpLiteral,
  normalizer,
} from "../ast-utils/index.js";

export const regexLiteral: Collector = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) return;
        const key = normalizer.normalizeNode(node);
        if (key === null) return;
        context.add({
          key,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
