import type { TemplateLiteral } from "oxc-parser";
import type { Collector } from "../types.js";
import { getPosition, KEY_SEP } from "../ast-utils/index.js";

function normalize(node: TemplateLiteral): string | null {
  if (node.expressions.length === 0) return null;
  const isSimpleStringConversion =
    node.expressions.length === 1 &&
    node.quasis.every((q) => q.value.raw === "");
  if (isSimpleStringConversion) return null;
  return node.quasis.map((q) => q.value.raw).join(KEY_SEP);
}

export const templateInterpolation: Collector = {
  id: "template-interpolation",
  createJSVisitor(context) {
    return {
      TemplateLiteral(node) {
        const key = normalize(node);
        if (key === null) return;
        const name = `\`${key.split(KEY_SEP).join("${...}")}\``;
        context.add({
          key,
          name,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
