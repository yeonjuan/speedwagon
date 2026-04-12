import type { Collector } from "../types.js";
import { getPosition } from "../ast-utils/index.js";
import { nodeNormalizer } from "../../node-normalizer/index.js";

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
        const key = nodeNormalizer.tsTypeAliasDeclaration(node);
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
