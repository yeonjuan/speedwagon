import type { Collector } from "./types.js";
import { getPosition, isRegExpLiteral } from "./ast-utils/index.js";

export const regexLiteralCollector: Collector = {
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
            path: context.path,
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
