import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";

export const throwWithString: Collector = {
  id: "throw-with-string",
  createJSVisitor(context) {
    return {
      ThrowStatement(node) {
        const key = nodeNormalizer.throwStatement(node);
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
