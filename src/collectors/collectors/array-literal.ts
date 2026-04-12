import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizer } from "../ast-normalizer/index.js";

export const arrayLiteral: Collector = {
  id: "array-literal",
  createJSVisitor(context) {
    return {
      VariableDeclaration(node) {
        for (const declarator of node.declarations) {
          const init = declarator.init;
          if (!init || init.type !== "ArrayExpression") continue;
          const key = normalizer.normalizeNode(init);
          if (key === null) continue;
          context.add({
            key,
            location: {
              start: getPosition(context.code, node.start),
              end: getPosition(context.code, node.end),
            },
          });
        }
      },
    };
  },
};
