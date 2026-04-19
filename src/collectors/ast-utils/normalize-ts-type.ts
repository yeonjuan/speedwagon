import type { TSType, TSTypeName, TSTupleElement } from "oxc-parser";

function normalizeTypeName(node: TSTypeName): string {
  if (node.type === "Identifier") return node.name;
  if (node.type === "TSQualifiedName")
    return `${normalizeTypeName(node.left)}.${node.right.name}`;
  return node.type;
}

function normalizeTupleElement(node: TSTupleElement): string {
  if (node.type === "TSOptionalType")
    return `${normalizeTsType(node.typeAnnotation)}?`;
  if (node.type === "TSRestType")
    return `...${normalizeTsType(node.typeAnnotation)}`;
  return normalizeTsType(node);
}

export function normalizeTsType(node: TSType): string {
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
      return node.types.map(normalizeTsType).sort().join("|");
    case "TSIntersectionType":
      return node.types.map(normalizeTsType).sort().join("&");
    case "TSArrayType":
      return `${normalizeTsType(node.elementType)}[]`;
    case "TSTypeOperator":
      return `${node.operator} ${normalizeTsType(node.typeAnnotation)}`;
    case "TSTupleType":
      return `[${node.elementTypes.map(normalizeTupleElement).join(",")}]`;
    case "TSTypeReference": {
      const typeArgs = node.typeArguments;
      const args =
        typeArgs && typeArgs.params.length > 0
          ? `<${typeArgs.params.map(normalizeTsType).join(",")}>`
          : "";
      return `${normalizeTypeName(node.typeName)}${args}`;
    }
    case "TSTypeLiteral": {
      const members = node.members.map((m) => {
        if (m.type === "TSPropertySignature") {
          const key = m.key.type === "Identifier" ? m.key.name : String(m.key);
          const type = m.typeAnnotation
            ? normalizeTsType(m.typeAnnotation.typeAnnotation)
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
            ? normalizeTsType(p.typeAnnotation.typeAnnotation)
            : "any",
        )
        .join(",");
      const ret = normalizeTsType(node.returnType.typeAnnotation);
      return `(${params})=>${ret}`;
    }
    case "TSConditionalType": {
      const check = normalizeTsType(node.checkType);
      const ext = normalizeTsType(node.extendsType);
      const t = normalizeTsType(node.trueType);
      const f = normalizeTsType(node.falseType);
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
      return `(${normalizeTsType(node.typeAnnotation)})`;
    default:
      return node.type;
  }
}
