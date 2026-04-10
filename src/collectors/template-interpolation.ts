import type { TemplateLiteral } from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

function isSimpleStringConversion(node: TemplateLiteral): boolean {
  return (
    node.expressions.length === 1 &&
    node.quasis.every((q) => q.value.raw === "")
  );
}

export const templateInterpolation: Collector = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        if (node.expressions.length === 0 || isSimpleStringConversion(node)) {
          return;
        }
        const key = node.quasis.map((q) => q.value.raw).join("\x00");
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
