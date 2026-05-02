import type { Collector } from "./types.js";
import { getPosition, isNumericLiteral } from "./ast-utils/index.js";

export const magicNumber: Collector = {
  id: "magic-number",
  createJSVisitor(context) {
    const objectPropertyValueStarts = new Set<number>();
    return {
      Property(node: any) {
        if (isNumericLiteral(node.value)) {
          objectPropertyValueStarts.add(node.value.start);
        }
      },
      Literal(node) {
        if (!isNumericLiteral(node)) return;
        if (objectPropertyValueStarts.has(node.start)) return;
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
