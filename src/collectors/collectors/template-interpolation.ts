import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import { normalizeTemplateLiteral } from "../../normalizer/normalizer.js";

export const templateInterpolation: Collector = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        context.add({
          key: normalizeTemplateLiteral(node),
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
