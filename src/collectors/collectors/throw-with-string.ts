import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodePrinter } from "../../node-printer/index.js";

export const throwWithString: Collector<{ throwing: string }> = {
  id: "throw-with-string",
  createJSVisitor(context) {
    return {
      ThrowStatement(node) {
        const result = nodePrinter.throwStatement(node);
        if (result === null) return;
        context.add({
          key: result.key,
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
