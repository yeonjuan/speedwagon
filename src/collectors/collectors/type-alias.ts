import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { normalizeTSTypeAliasDeclaration } from "../../node-normalizer/index.js";

export const typeAlias: Collector = {
  id: "type-alias",
  createJSVisitor(context) {
    const exportedStarts = new Set<number>();
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration?.type === "TSTypeAliasDeclaration") {
          exportedStarts.add(node.declaration.start);
        }
      },
      TSTypeAliasDeclaration(node) {
        const isExported = exportedStarts.has(node.start);
        const key = normalizeTSTypeAliasDeclaration(node, isExported);
        if (key === null) return;
        context.add({
          key,
          name: node.id.name,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
