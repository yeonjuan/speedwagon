import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";

export const arrayLiteral: Collector = {
  id: "array-literal",
  createJSVisitor(context) {
    return {
      VariableDeclaration(node) {
        for (const declarator of node.declarations) {
          const init = declarator.init;
          if (
            !init ||
            init.type !== "ArrayExpression" ||
            init.elements.length < 2
          )
            continue;
          const key = nodeNormalizer.arrayExpression(init);
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
