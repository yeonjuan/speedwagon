import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import { nodePrinter } from "../../node-printer/index.js";
import type { ArrayExpression } from "oxc-parser";

export const arrayLiteral: Collector<{ value: string }> = {
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
          const value = nodePrinter.arrayExpression(init);
          if (value === null) continue;
          const key = nodeNormalizer.arrayExpression(init);
          context.add({
            key,
            data: { value },
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
