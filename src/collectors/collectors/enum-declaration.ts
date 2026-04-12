import type { Collector } from "../types.js";
import { getPosition, normalizer } from "../ast-utils/index.js";

export const enumDeclaration: Collector = {
  id: "enum-declaration",
  createJSVisitor(context) {
    const exportedStarts = new Set<number>();
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration?.type === "TSEnumDeclaration") {
          exportedStarts.add(node.declaration.start);
        }
      },
      TSEnumDeclaration(node) {
        const isExported = exportedStarts.has(node.start);
        const key = normalizer.normalizeNode(node, { isExported });
        if (key === null) return;
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
