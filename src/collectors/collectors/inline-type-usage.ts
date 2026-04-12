import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizer } from "../ast-normalizer/index.js";

export const inlineTypeUsage: Collector = {
  id: "inline-type-usage",
  createJSVisitor(context) {
    return {
      TSTypeAnnotation(node) {
        const key = normalizer.normalizeNode(node);
        if (key === null) return;
        context.add({
          key,
          location: {
            start: getPosition(context.code, node.typeAnnotation.start),
            end: getPosition(context.code, node.typeAnnotation.end),
          },
        });
      },
    };
  },
};
