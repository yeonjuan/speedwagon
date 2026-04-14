import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";
import { nodePrinter } from "../../node-printer/index.js";

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
        const printed = nodePrinter.tsTypeAliasDeclaration(node, isExported);
        if (printed === null) return;
        const key = nodeNormalizer.tsTypeAliasDeclaration(node);
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
