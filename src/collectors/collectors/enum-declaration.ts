import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodePrinter } from "../../node-printer/index.js";

export const enumDeclaration: Collector<{ name: string }> = {
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
        const key = nodePrinter.tsEnumDeclaration(node, isExported);
        if (key === null) return;
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
