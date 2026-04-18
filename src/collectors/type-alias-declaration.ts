import type {
  TSType,
  TSTypeAliasDeclaration,
  TSTypeName,
  TSTupleElement,
} from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition } from "./ast-utils/index.js";

function normalizeTypeName(node: TSTypeName): string {
  if (node.type === "Identifier") return node.name;
  if (node.type === "TSQualifiedName")
    return `${normalizeTypeName(node.left)}.${node.right.name}`;
  return node.type;
}

function normalizeTupleElement(node: TSTupleElement): string {
  if (node.type === "TSOptionalType")
    return `${normalize(node.typeAnnotation)}?`;
  if (node.type === "TSRestType") return `...${normalize(node.typeAnnotation)}`;
  return normalize(node);
}

function normalize(node: TSType): string {
  switch (node.type) {
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
    case "TSObjectKeyword":
      return "object";
    case "TSSymbolKeyword":
      return "symbol";
    case "TSBigIntKeyword":
      return "bigint";
    case "TSIntrinsicKeyword":
      return "intrinsic";
    case "TSUnionType":
      return node.types.map(normalize).sort().join("|");
    case "TSIntersectionType":
      return node.types.map(normalize).sort().join("&");
    case "TSArrayType":
      return `${normalize(node.elementType)}[]`;
    case "TSTypeOperator":
      return `${node.operator} ${normalize(node.typeAnnotation)}`;
    case "TSTupleType":
      return `[${node.elementTypes.map(normalizeTupleElement).join(",")}]`;
    case "TSTypeReference": {
      const typeArgs = node.typeArguments;
      const args =
        typeArgs && typeArgs.params.length > 0
          ? `<${typeArgs.params.map(normalize).join(",")}>`
          : "";
      return `${normalizeTypeName(node.typeName)}${args}`;
    }
    case "TSTypeLiteral": {
      const members = node.members.map((m) => {
        if (m.type === "TSPropertySignature") {
          const key = m.key.type === "Identifier" ? m.key.name : String(m.key);
          const type = m.typeAnnotation
            ? normalize(m.typeAnnotation.typeAnnotation)
            : "any";
          const opt = m.optional ? "?" : "";
          return `${key}${opt}:${type}`;
        }
        return m.type;
      });
      return `{${members.sort().join(";")}}`;
    }
    case "TSFunctionType": {
      const params = node.params
        .map((p) =>
          "typeAnnotation" in p && p.typeAnnotation
            ? normalize(p.typeAnnotation.typeAnnotation)
            : "any",
        )
        .join(",");
      const ret = normalize(node.returnType.typeAnnotation);
      return `(${params})=>${ret}`;
    }
    case "TSConditionalType": {
      const check = normalize(node.checkType);
      const ext = normalize(node.extendsType);
      const t = normalize(node.trueType);
      const f = normalize(node.falseType);
      return `${check} extends ${ext}?${t}:${f}`;
    }
    case "TSTypeQuery":
      return `typeof ${normalizeTypeName(node.exprName as TSTypeName)}`;
    case "TSLiteralType": {
      const lit = node.literal;
      if (lit.type === "TemplateLiteral")
        return lit.quasis.map((q) => q.value.cooked).join("${}");
      if (lit.type === "UnaryExpression")
        return `${lit.operator}${(lit.argument as { value?: unknown }).value}`;
      return String(lit.value);
    }
    case "TSParenthesizedType":
      return `(${normalize(node.typeAnnotation)})`;
    default:
      return node.type;
  }
}

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
        const key = normalize(node.typeAnnotation);
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
