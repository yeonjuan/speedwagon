import type { Collector } from "../types.js";
import { getPosition, normalizeType } from "../ast-utils/index.js";

export const inlineTypeUsage: Collector = {
  id: "inline-type-usage",
  createJSVisitor(context) {
    return {
      TSTypeAnnotation(node) {
        const { typeAnnotation } = node;
        if (
          typeAnnotation.type !== "TSUnionType" &&
          typeAnnotation.type !== "TSIntersectionType"
        ) {
          return;
        }

        const normalized = normalizeType(typeAnnotation);
        if (normalized.includes("?")) {
          return;
        }

        context.add({
          key: normalized,
          location: {
            start: getPosition(context.code, typeAnnotation.start),
            end: getPosition(context.code, typeAnnotation.end),
          },
        });
      },
    };
  },
};
