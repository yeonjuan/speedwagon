import type {
  TSInterfaceDeclaration,
  TSSignature,
  TSInterfaceHeritage,
  Expression,
} from "oxc-parser";
import type { Collector } from "./types.js";
import { getPosition, normalizeTsType } from "./ast-utils/index.js";

function normalizePropertyKey(key: Expression): string {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal") return String(key.value);
  return key.type;
}

function normalizeMember(member: TSSignature): string {
  switch (member.type) {
    case "TSPropertySignature": {
      const key = normalizePropertyKey(member.key as Expression);
      const opt = member.optional ? "?" : "";
      const type = member.typeAnnotation
        ? normalizeTsType(member.typeAnnotation.typeAnnotation)
        : "any";
      return `${key}${opt}:${type}`;
    }
    case "TSMethodSignature": {
      const key = normalizePropertyKey(member.key as Expression);
      const opt = member.optional ? "?" : "";
      const params = member.params
        .map((p) =>
          "typeAnnotation" in p && p.typeAnnotation
            ? normalizeTsType(p.typeAnnotation.typeAnnotation)
            : "any",
        )
        .join(",");
      const ret = member.returnType
        ? normalizeTsType(member.returnType.typeAnnotation)
        : "void";
      return `${key}${opt}(${params}):${ret}`;
    }
    case "TSIndexSignature": {
      const params = member.parameters
        .map((p) => normalizeTsType(p.typeAnnotation.typeAnnotation))
        .join(",");
      const ret = normalizeTsType(member.typeAnnotation.typeAnnotation);
      return `[${params}]:${ret}`;
    }
    case "TSCallSignatureDeclaration": {
      const params = member.params
        .map((p) =>
          "typeAnnotation" in p && p.typeAnnotation
            ? normalizeTsType(p.typeAnnotation.typeAnnotation)
            : "any",
        )
        .join(",");
      const ret = member.returnType
        ? normalizeTsType(member.returnType.typeAnnotation)
        : "void";
      return `(${params}):${ret}`;
    }
    case "TSConstructSignatureDeclaration": {
      const params = member.params
        .map((p) =>
          "typeAnnotation" in p && p.typeAnnotation
            ? normalizeTsType(p.typeAnnotation.typeAnnotation)
            : "any",
        )
        .join(",");
      const ret = member.returnType
        ? normalizeTsType(member.returnType.typeAnnotation)
        : "void";
      return `new(${params}):${ret}`;
    }
    default:
      return (member as TSSignature).type;
  }
}

function normalizeHeritage(heritage: TSInterfaceHeritage): string {
  const expr = heritage.expression;
  const name = expr.type === "Identifier" ? expr.name : expr.type;
  const typeArgs = heritage.typeArguments;
  const args =
    typeArgs && typeArgs.params.length > 0
      ? `<${typeArgs.params.map(normalizeTsType).join(",")}>`
      : "";
  return `${name}${args}`;
}

function normalize(node: TSInterfaceDeclaration): string {
  const members = node.body.body.map(normalizeMember).sort().join(";");
  const extendsStr =
    node.extends.length > 0
      ? `extends ${node.extends.map(normalizeHeritage).sort().join(",")}`
      : "";
  return extendsStr ? `${extendsStr}{${members}}` : `{${members}}`;
}

export const interfaceDeclaration: Collector = {
  id: "interface-declaration",
  createJSVisitor(context) {
    return {
      TSInterfaceDeclaration(node) {
        if (node.body.body.length === 0) return;
        const key = normalize(node);
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
