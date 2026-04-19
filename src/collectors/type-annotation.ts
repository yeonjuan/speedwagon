import type { TSType } from "oxc-parser";
import type { Collector } from "./types.js";
import {
  getPosition,
  isKeyword,
  normalizeTsType,
  getDisplayName,
} from "./ast-utils/index.js";
import { isTSTypeReference } from "./ast-utils/predicates.js";

function addType(
  context: Parameters<Collector["createJSVisitor"]>[0],
  tsType: TSType,
) {
  if (isKeyword(tsType)) return;
  if (isTSTypeReference(tsType)) return;
  const key = normalizeTsType(tsType);
  const displayName = getDisplayName(context.code, tsType.start, tsType.end);
  context.add({
    key,
    displayName,
    location: {
      start: getPosition(context.code, tsType.start),
      end: getPosition(context.code, tsType.end),
    },
  });
}

export const typeAnnotation: Collector = {
  id: "type-annotation",
  createJSVisitor(context) {
    return {
      Identifier(node) {
        if (node.typeAnnotation) {
          addType(context, node.typeAnnotation.typeAnnotation);
        }
      },
      RestElement(node) {
        if (node.typeAnnotation) {
          addType(context, node.typeAnnotation.typeAnnotation);
        }
      },
      PropertyDefinition(node) {
        if (node.typeAnnotation) {
          addType(context, node.typeAnnotation.typeAnnotation);
        }
      },
      FunctionDeclaration(node) {
        if (node.returnType) {
          addType(context, node.returnType.typeAnnotation);
        }
      },
      ArrowFunctionExpression(node) {
        if (node.returnType) {
          addType(context, node.returnType.typeAnnotation);
        }
      },
      FunctionExpression(node) {
        if (node.returnType) {
          addType(context, node.returnType.typeAnnotation);
        }
      },
    };
  },
};
