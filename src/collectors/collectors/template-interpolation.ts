import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodePrinter } from "../../node-printer/index.js";

export const templateInterpolation: Collector<{ value: string }> = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        const key = nodePrinter.templateLiteral(node);
        if (key === null) return;
        context.add({
          key,
          data: { value: key },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
