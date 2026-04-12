import type { TemplateLiteral } from "oxc-parser";
import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/node-normalizer.js";

export const templateInterpolation: Collector = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        const key = nodeNormalizer.templateLiteral(node);
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
