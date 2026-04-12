import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizeThrowStatement } from "../../node-normalizer/index.js";

export const throwWithString: Collector = {
  id: "throw-with-string",
  createJSVisitor(context) {
    return {
      ThrowStatement(node) {
        const result = normalizeThrowStatement(node);
        if (result === null) return;
        context.add({
          key: result.key,
          name: result.name,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
