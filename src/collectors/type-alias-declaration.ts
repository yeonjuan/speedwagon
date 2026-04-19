import type { Collector } from "./types.js";
import { getPosition, isKeyword, normalizeTsType } from "./ast-utils/index.js";
import { isTSTypeReference } from "./ast-utils/predicates.js";

export const typeAliasDeclaration: Collector = {
  id: "type-alias-declaration",
  createJSVisitor(context) {
    return {
      TSTypeAliasDeclaration(node) {
        if (isKeyword(node.typeAnnotation)) {
          return;
        }
        if (isTSTypeReference(node.typeAnnotation)) {
          return;
        }
        const key = normalizeTsType(node.typeAnnotation);
        const displayName = node.id.name;
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
