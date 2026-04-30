import type { TemplateLiteral } from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition, getDisplayName } from "./ast-utils/index.js";

function normalize(node: TemplateLiteral): string {
  return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("${}");
}

function isSimpleConversion(node: TemplateLiteral): boolean {
  return node.quasis.every((q) => (q.value.cooked ?? q.value.raw) === "");
}

export const stringInterpolation: Collector = {
  id: "string-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        if (node.expressions.length === 0) return;
        if (isSimpleConversion(node)) return;

        const key = normalize(node);
        const displayName = getDisplayName(
          context.code,
          node.start + 1,
          node.end - 1,
        );
        context.add({
          key,
          displayName,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
