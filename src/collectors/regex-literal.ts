import type { Collector } from "./types.js";
import { getPosition, isRegExpLiteral } from "./ast-utils/index.js";

export const regexLiteral: Collector = {
  id: "regex-literal",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isRegExpLiteral(node)) {
          return;
        }
        context.add({
          key: `${node.regex.pattern}/${node.regex.flags}`,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
