import type { TSTypeAliasDeclaration } from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition, isKeyword, normalizeTsType } from "./ast-utils/index.js";
import { isTSTypeReference } from "./ast-utils/predicates.js";

const MAX_LENGTH = 50;

function print(node: TSTypeAliasDeclaration, code: string) {
  const raw = code
    .slice(node.typeAnnotation.start, node.typeAnnotation.end)
    .replace(/\s+/g, " ")
    .trim();
  return raw.length > MAX_LENGTH ? raw.slice(0, MAX_LENGTH) + "..." : raw;
}

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
        const displayName = print(node, context.code);
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
