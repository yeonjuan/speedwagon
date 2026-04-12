import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizer } from "../ast-normalizer/index.js";

export const templateInterpolation: Collector = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
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
