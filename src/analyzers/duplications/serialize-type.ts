import type { TSType } from "oxc-parser";

type AnyNode = Record<string, any>;

function serializeTypeName(name: AnyNode): string {
  if (name.type === "Identifier") return name.name as string;
  if (name.type === "TSQualifiedName")
    return `${serializeTypeName(name.left)}.${name.right.name}`;
  return "this";
}

function serializeLiteral(lit: AnyNode): string {
  if (lit.value === null) return "null";
  if ("bigint" in lit) return `${lit.bigint}n`;
  if (typeof lit.value === "string") return JSON.stringify(lit.value as string);
  return String(lit.value);
}

function serializeParam(param: AnyNode): string {
  let name = "_";
  if (param.type === "Identifier") name = param.name as string;
  else if (
    param.type === "AssignmentPattern" &&
    param.left.type === "Identifier"
  )
    name = param.left.name as string;
  else if (param.type === "RestElement")
    name = `...${serializeParam(param.argument)}`;
  const typeStr = param.typeAnnotation
    ? `:${serializeType(param.typeAnnotation.typeAnnotation)}`
    : "";
  return `${name}${typeStr}`;
}

function serializeSignature(sig: AnyNode): string {
  switch (sig.type) {
    case "TSPropertySignature": {
      const key =
        sig.key.type === "Identifier"
          ? (sig.key.name as string)
          : sig.key.type === "Literal"
            ? JSON.stringify(sig.key.value)
            : "?";
      const opt = sig.optional ? "?" : "";
      const ro = sig.readonly ? "readonly " : "";
      const type = sig.typeAnnotation
        ? `:${serializeType(sig.typeAnnotation.typeAnnotation)}`
        : "";
      return `${ro}${key}${opt}${type}`;
    }
    case "TSIndexSignature": {
      const params = (sig.parameters as AnyNode[])
        .map(
          (p) =>
            `${p.name}:${p.typeAnnotation ? serializeType(p.typeAnnotation.typeAnnotation) : "any"}`,
        )
        .join(",");
      const ret = sig.typeAnnotation
        ? `:${serializeType(sig.typeAnnotation.typeAnnotation)}`
        : "";
      return `[${params}]${ret}`;
    }
    case "TSMethodSignature": {
      const key =
        sig.key.type === "Identifier" ? (sig.key.name as string) : "?";
      const params = (sig.params as AnyNode[]).map(serializeParam).join(",");
      const ret = sig.returnType
        ? `:${serializeType(sig.returnType.typeAnnotation)}`
        : "";
      return `${key}(${params})${ret}`;
    }
    case "TSCallSignatureDeclaration": {
      const params = (sig.params as AnyNode[]).map(serializeParam).join(",");
      const ret = sig.returnType
        ? `:${serializeType(sig.returnType.typeAnnotation)}`
        : "";
      return `(${params})${ret}`;
    }
    case "TSConstructSignatureDeclaration": {
      const params = (sig.params as AnyNode[]).map(serializeParam).join(",");
      const ret = sig.returnType
        ? `:${serializeType(sig.returnType.typeAnnotation)}`
        : "";
      return `new(${params})${ret}`;
    }
    default:
      return (sig.type as string) ?? "?";
  }
}

export function serializeType(type: TSType): string {
  const t = type as AnyNode;
  switch (t.type) {
    case "TSAnyKeyword":
      return "any";
    case "TSBigIntKeyword":
      return "bigint";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSIntrinsicKeyword":
      return "intrinsic";
    case "TSNeverKeyword":
      return "never";
    case "TSNullKeyword":
      return "null";
    case "TSNumberKeyword":
      return "number";
    case "TSObjectKeyword":
      return "object";
    case "TSStringKeyword":
      return "string";
    case "TSSymbolKeyword":
      return "symbol";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSUnknownKeyword":
      return "unknown";
    case "TSVoidKeyword":
      return "void";
    case "TSThisType":
      return "this";
    case "TSLiteralType":
      return serializeLiteral(t.literal);
    case "TSUnionType":
      return (t.types as TSType[]).map(serializeType).sort().join("|");
    case "TSIntersectionType":
      return (t.types as TSType[]).map(serializeType).sort().join("&");
    case "TSTypeReference": {
      const name = serializeTypeName(t.typeName);
      if (!t.typeArguments) return name;
      const args = (t.typeArguments.params as TSType[])
        .map(serializeType)
        .join(",");
      return `${name}<${args}>`;
    }
    case "TSArrayType":
      return `${serializeType(t.elementType)}[]`;
    case "TSTupleType": {
      const els = (t.elementTypes as AnyNode[]).map((el) =>
        el.type === "TSNamedTupleMember"
          ? `${el.label.name}:${serializeType(el.elementType)}`
          : serializeType(el as TSType),
      );
      return `[${els.join(",")}]`;
    }
    case "TSTypeLiteral": {
      const members = (t.members as AnyNode[])
        .map(serializeSignature)
        .sort()
        .join(";");
      return `{${members}}`;
    }
    case "TSFunctionType": {
      const params = (t.params as AnyNode[]).map(serializeParam).join(",");
      const ret = t.returnType
        ? serializeType(t.returnType.typeAnnotation)
        : "void";
      return `(${params})=>${ret}`;
    }
    case "TSConditionalType":
      return `${serializeType(t.checkType)} extends ${serializeType(t.extendsType)}?${serializeType(t.trueType)}:${serializeType(t.falseType)}`;
    case "TSIndexedAccessType":
      return `${serializeType(t.objectType)}[${serializeType(t.indexType)}]`;
    case "TSTypeOperator":
      return `${t.operator} ${serializeType(t.typeAnnotation)}`;
    case "TSParenthesizedType":
      return `(${serializeType(t.typeAnnotation)})`;
    case "TSRestType":
      return `...${serializeType(t.typeAnnotation)}`;
    case "TSOptionalType":
      return `${serializeType(t.typeAnnotation)}?`;
    case "TSInferType":
      return `infer ${t.typeParameter.name.name}`;
    case "TSTemplateLiteralType": {
      const quasis = t.quasis as AnyNode[];
      const types = t.types as TSType[];
      return quasis
        .map(
          (q, i) =>
            (q.value.raw as string) +
            (types[i] ? `\${${serializeType(types[i])}}` : ""),
        )
        .join("");
    }
    case "TSTypeQuery":
      return `typeof ${t.exprName.type === "Identifier" ? t.exprName.name : serializeTypeName(t.exprName)}`;
    case "TSImportType": {
      const arg = t.argument.value as string;
      const qualifier = t.qualifier ? `.${serializeTypeName(t.qualifier)}` : "";
      const typeArgs = t.typeArguments
        ? `<${(t.typeArguments.params as TSType[]).map(serializeType).join(",")}>`
        : "";
      return `import("${arg}")${qualifier}${typeArgs}`;
    }
    case "TSMappedType":
      return `{mapped:${t.typeParameter?.name?.name ?? "?"}}`;
    default:
      return (t.type as string) ?? "?";
  }
}
