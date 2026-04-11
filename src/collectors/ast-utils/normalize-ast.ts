import type {
  Node,
  RegExpLiteral,
  StringLiteral,
  TemplateLiteral,
  ThrowStatement,
  ArrayExpression,
  TSEnumDeclaration,
  TSEnumMember,
  TSTypeAliasDeclaration,
  TSTypeAnnotation,
  TSType,
} from "oxc-parser";
import {
  isRegExpLiteral,
  isStringLiteral,
  isIdentifierName,
  isIdentifierReference,
} from "./predicates.js";

// A separator that cannot appear in JS/TS source text, used to build
// collision-free composite keys.
export const KEY_SEP = "\x01";

function normalizeType(node: TSType): string {
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

const URL_PATTERN = /^https?:\/\/.+/;

function normalizeRegexLiteral(node: RegExpLiteral): string {
  return `${node.regex.pattern}/${node.regex.flags}`;
}

function normalizeUrlLiteral(node: StringLiteral): string | null {
  return URL_PATTERN.test(node.value) ? node.value : null;
}

function isSimpleStringConversion(node: TemplateLiteral): boolean {
  return (
    node.expressions.length === 1 &&
    node.quasis.every((q) => q.value.raw === "")
  );
}

function normalizeTemplateLiteral(node: TemplateLiteral): string | null {
  if (node.expressions.length === 0 || isSimpleStringConversion(node)) {
    return null;
  }
  return node.quasis.map((q) => q.value.raw).join("\x01");
}

function normalizeThrowStatement(node: ThrowStatement): string | null {
  const { argument } = node;
  if (argument.type !== "NewExpression") return null;
  const { callee, arguments: args } = argument;
  if (callee.type !== "Identifier" || args.length === 0) return null;
  const firstArg = args[0];
  if (!isStringLiteral(firstArg)) return null;
  return `${callee.name}:${firstArg.value}`;
}

function extractEnumMemberKey(member: TSEnumMember): string | null {
  if (!member.initializer) return null;
  const init = member.initializer;
  if (init.type !== "Literal") return null;
  const memberName = isIdentifierName(member.id) ? member.id.name : null;
  if (!memberName) return null;
  return `${memberName}:${JSON.stringify(init.value)}`;
}

function normalizeTSEnumDeclaration(
  node: TSEnumDeclaration,
  isExported: boolean,
): string | null {
  const { members } = node.body;
  if (members.length === 0) return null;

  const hasExplicit = members.some((m) => m.initializer !== null);
  const hasImplicit = members.some((m) => m.initializer === null);

  let membersKey: string;

  if (hasExplicit && !hasImplicit) {
    const memberKeys = members.map(extractEnumMemberKey);
    if (memberKeys.some((k) => k === null)) return null;
    membersKey = `explicit:${(memberKeys as string[]).sort().join(",")}`;
  } else if (hasImplicit && !hasExplicit) {
    const names = members.map((m) =>
      isIdentifierName(m.id) ? m.id.name : null,
    );
    if (names.some((n) => n === null)) return null;
    membersKey = `implicit:${(names as string[]).join(",")}`;
  } else {
    return null;
  }

  return `${membersKey}\x01${node.id.name}\x01${isExported ? "1" : "0"}`;
}

function normalizeTSTypeAliasDeclaration(
  node: TSTypeAliasDeclaration,
  isExported: boolean,
): string | null {
  const { typeAnnotation } = node;
  if (
    typeAnnotation.type !== "TSUnionType" &&
    typeAnnotation.type !== "TSIntersectionType"
  ) {
    return null;
  }
  const normalized = normalizeType(typeAnnotation);
  if (normalized.includes("?")) return null;
  return `${normalized}\x01${node.id.name}\x01${isExported ? "1" : "0"}`;
}

function normalizeTSTypeAnnotation(node: TSTypeAnnotation): string | null {
  const { typeAnnotation } = node;
  if (
    typeAnnotation.type !== "TSUnionType" &&
    typeAnnotation.type !== "TSIntersectionType"
  ) {
    return null;
  }
  const normalized = normalizeType(typeAnnotation);
  return normalized.includes("?") ? null : normalized;
}

function normalizeArrayExpression(node: ArrayExpression): string | null {
  const { elements } = node;
  if (elements.length < 2) return null;

  const serialized = elements.map((el) => {
    if (el === null || el.type !== "Literal") return null;
    const { value } = el as { type: string; value?: unknown };
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return JSON.stringify(value);
    }
    return null;
  });

  if (serialized.some((s) => s === null)) return null;
  return `[${serialized.join(",")}]`;
}

export type NormalizeAstOptions = { isExported?: boolean };

export function normalizeAst(
  node: Node,
  opts: NormalizeAstOptions = {},
): string | null {
  const { isExported = false } = opts;
  switch (node.type) {
    case "Literal":
      if (isRegExpLiteral(node)) return normalizeRegexLiteral(node);
      if (isStringLiteral(node)) return normalizeUrlLiteral(node);
      return null;
    case "TemplateLiteral":
      return normalizeTemplateLiteral(node);
    case "ThrowStatement":
      return normalizeThrowStatement(node);
    case "ArrayExpression":
      return normalizeArrayExpression(node);
    case "TSEnumDeclaration":
      return normalizeTSEnumDeclaration(node, isExported);
    case "TSTypeAliasDeclaration":
      return normalizeTSTypeAliasDeclaration(
        node as TSTypeAliasDeclaration,
        isExported,
      );
    case "TSTypeAnnotation":
      return normalizeTSTypeAnnotation(node);
    default:
      return null;
  }
}
