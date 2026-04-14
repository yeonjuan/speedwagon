import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizeTsEnumDeclaration } from "../../normalizer/normalizer.js";

export const enumDeclaration: Collector<{ name: string }> = {
  id: "enum-declaration",
  createJSVisitor(context) {
    return {
      TSEnumDeclaration(node) {
        const key = normalizeTsEnumDeclaration(node, context.code);
        context.add({
          key,
          data: { name: node.id.name },
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
