import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizeTsType } from "../../normalizer/normalizer.js";

export const inlineTypeUsage: Collector = {
  id: "inline-type-usage",
  createJSVisitor(context) {
    return {
      TSTypeAnnotation(node) {
        const key = normalizeTsType(node.typeAnnotation, context.code);
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
