import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";

function extractPrimitiveLiteral(node: {
  type: string;
  value?: unknown;
}): string | null {
  if (node.type !== "Literal") return null;
  const { value } = node;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }
  return null;
}

export const arrayLiteral: Collector = {
  id: "array-literal",
  createJSVisitor(context) {
    return {
      VariableDeclaration(node) {
        for (const declarator of node.declarations) {
          const init = declarator.init;
          if (!init || init.type !== "ArrayExpression") continue;

          const { elements } = init;
          if (elements.length < 2) continue;

          const serialized = elements.map((el: unknown) => {
            if (el === null) return null;
            return extractPrimitiveLiteral(
              el as { type: string; value?: unknown },
            );
          });

          if (serialized.some((s) => s === null)) continue;

          const key = `[${serialized.join(",")}]`;
          context.add({
            key,
            location: {
              start: getPosition(context.code, node.start),
              end: getPosition(context.code, node.end),
            },
          });
        }
      },
    };
  },
};
