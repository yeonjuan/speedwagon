import type { Collector } from "../types.js";
import { getPosition, normalizeType } from "../ast-utils/index.js";

// key format: `${normalizedType}\x00${typeName}\x00${isExported ? "1" : "0"}`
export const typeAlias: Collector = {
  id: "type-alias",
  createJSVisitor(context) {
    let nextIsExported = false;
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration?.type === "TSTypeAliasDeclaration") {
          nextIsExported = true;
        }
      },
      TSTypeAliasDeclaration(node) {
        const isExported = nextIsExported;
        nextIsExported = false;

        const { typeAnnotation } = node;
        if (
          typeAnnotation.type !== "TSUnionType" &&
          typeAnnotation.type !== "TSIntersectionType"
        ) {
          return;
        }

        const normalized = normalizeType(typeAnnotation);
        if (normalized.includes("?")) {
          return;
        }

        context.add({
          key: `${normalized}\x00${node.id.name}\x00${isExported ? "1" : "0"}`,
          location: {
            start: getPosition(context.code, node.start),
            end: getPosition(context.code, node.end),
          },
        });
      },
    };
  },
};
