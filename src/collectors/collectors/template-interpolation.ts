import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import { nodePrinter } from "../../node-printer/index.js";

export const templateInterpolation: Collector<{ value: string }> = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        const value = nodePrinter.templateLiteral(node);
        if (value === null) return;
        const key = nodeNormalizer.templateLiteral(node);
        context.add({
          key,
          data: { value },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
