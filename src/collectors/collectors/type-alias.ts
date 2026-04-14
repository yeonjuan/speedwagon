import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodePrinter } from "../../node-printer/index.js";
import { normalizeTsType } from "../../normalizer/normalizer.js";

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
        const key = normalizeTsType(node.typeAnnotation, context.code);
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
