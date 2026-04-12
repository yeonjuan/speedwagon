import type { TSType } from "oxc-parser";
import { isIdentifierName, isIdentifierReference } from "./predicates.js";

export function normalizeType(node: TSType): string {
  switch (node.type) {
    case "TSUnionType":
      return node.types.map(normalizeType).sort().join("|");
    case "TSIntersectionType":
      return node.types.map(normalizeType).sort().join("&");
    case "TSLiteralType": {
      const lit = node.literal;
      if (lit.type === "Literal") {
        return JSON.stringify(lit.value);
      }
      return "?";
    }
    case "TSTypeReference": {
      const name = isIdentifierReference(node.typeName)
        ? node.typeName.name
        : "?";
      return node.typeArguments
        ? `${name}<${node.typeArguments.params.map(normalizeType).join(",")}>`
        : name;
    }
    case "TSTypeLiteral": {
      const members = node.members
        .map((m) => {
          if (m.type === "TSPropertySignature") {
            const key = isIdentifierName(m.key) ? m.key.name : "?";
            const value = m.typeAnnotation
              ? normalizeType(m.typeAnnotation.typeAnnotation)
              : "?";
            return `${key}:${value}`;
          }
          return "?";
        })
        .sort()
        .join(";");
      return `{${members}}`;
    }
    case "TSParenthesizedType":
      return normalizeType(node.typeAnnotation);
    case "TSArrayType":
      return `${normalizeType(node.elementType)}[]`;
    case "TSStringKeyword":
      return "string";
    case "TSNumberKeyword":
      return "number";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSNullKeyword":
      return "null";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSAnyKeyword":
      return "any";
    case "TSUnknownKeyword":
      return "unknown";
    case "TSNeverKeyword":
      return "never";
    case "TSVoidKeyword":
      return "void";
    default:
      return "?";
  }
}
