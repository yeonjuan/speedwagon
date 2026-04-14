import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import { nodePrinter } from "../../node-printer/index.js";

export const throwWithString: Collector<{ throwing: string }> = {
  id: "throw-with-string",
  createJSVisitor(context) {
    return {
      ThrowStatement(node) {
        const result = nodePrinter.throwStatement(node);
        if (result === null) return;
        const key = nodeNormalizer.throwStatement(node);
        context.add({
          key,
          data: { throwing: result.name },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
