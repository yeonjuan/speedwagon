import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizer } from "../ast-normalizer/index.js";

export const throwWithString: Collector = {
  id: "throw-with-string",
  createJSVisitor(context) {
    return {
      ThrowStatement(node) {
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
