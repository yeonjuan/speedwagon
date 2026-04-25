import type { Collector } from "./types.js";
import { getPosition, isNumericLiteral } from "./ast-utils/index.js";

export const magicNumber: Collector = {
  id: "magic-number",
  createJSVisitor(context) {
    return {
      Literal(node) {
        if (!isNumericLiteral(node)) return;
        const key = String(node.value);
        const displayName = key;
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
