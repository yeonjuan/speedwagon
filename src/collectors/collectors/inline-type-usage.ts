import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodePrinter } from "../../node-printer/index.js";

export const inlineTypeUsage: Collector = {
  id: "inline-type-usage",
  createJSVisitor(context) {
    return {
      TSTypeAnnotation(node) {
        const key = nodePrinter.tsTypeAnnotation(node);
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
