import { createHash } from "crypto";
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
  ArrowFunctionExpression,
} from "oxc-parser";
import { visitorKeys } from "oxc-parser";
import {
  isRegExpLiteral,
  isStringLiteral,
  isIdentifierName,
  isIdentifierReference,
} from "../ast-utils/predicates.js";
import { stringifier } from "../ast-stringifier/index.js";

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

function normalizeRegexLiteral(node: RegExpLiteral): string {
  return `${node.regex.pattern}/${node.regex.flags}`;
}

function normalizeStringLiteral(node: StringLiteral): string {
  return `${node.value}`;
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
  return node.quasis.map((q) => q.value.raw).join(KEY_SEP);
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

  return `${membersKey}${KEY_SEP}${node.id.name}${KEY_SEP}${isExported ? "1" : "0"}`;
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
  return `${normalized}${KEY_SEP}${node.id.name}${KEY_SEP}${isExported ? "1" : "0"}`;
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

const IDENTIFIER_TYPES = new Set([
  "Identifier",
  "BindingIdentifier",
  "IdentifierReference",
  "IdentifierName",
]);

const LITERAL_TYPES = new Set([
  "Literal",
  "StringLiteral",
  "NumericLiteral",
  "BooleanLiteral",
  "BigIntLiteral",
  "NullLiteral",
  "RegExpLiteral",
]);

function serializeLiteral(node: Record<string, unknown>): string {
  if (typeof node.regex === "object" && node.regex !== null) {
    const r = node.regex as { pattern: string; flags: string };
    return `LIT:/${r.pattern}/${r.flags}`;
  }
  return `LIT:${JSON.stringify(node.value)}`;
}

function serializeAst(value: unknown, tokens: string[]): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) serializeAst(item, tokens);
    return;
  }
  if (typeof value !== "object") return;

  const node = value as Record<string, unknown>;
  const type = node.type;
  if (typeof type !== "string") return;

  if (IDENTIFIER_TYPES.has(type)) {
    tokens.push("ID");
    return;
  }
  if (LITERAL_TYPES.has(type)) {
    tokens.push(serializeLiteral(node));
    return;
  }
  if (type === "TemplateElement") {
    const val = node.value as { raw?: string } | undefined;
    tokens.push(`TMPL:${val?.raw ?? ""}`);
    return;
  }

  tokens.push(type);

  if (typeof node.operator === "string") tokens.push(node.operator);
  if (typeof node.kind === "string") tokens.push(node.kind);

  for (const key of visitorKeys[type] ?? []) {
    serializeAst(node[key], tokens);
  }
}

function hashAst(node: unknown): string {
  const tokens: string[] = [];
  serializeAst(node, tokens);
  return createHash("sha256")
    .update(tokens.join(KEY_SEP))
    .digest("hex")
    .slice(0, 16);
}

type FunctionNode =
  | ArrowFunctionExpression
  | (Node & {
      type: "FunctionDeclaration" | "FunctionExpression";
      async: boolean;
      params: unknown[];
      body: unknown;
    });

function normalizeFunctionNode(node: FunctionNode): string | null {
  if (!node.body) return null;
  const paramCount = node.params.length;
  const bodyHash = hashAst(node.body);
  return `${node.async ? "1" : "0"}${KEY_SEP}${paramCount}${KEY_SEP}${bodyHash}`;
}

export type NormalizeNodeOptions = { isExported?: boolean };

function normalizeNode(
  node: Node,
  opts: NormalizeNodeOptions = {},
): string | null {
  const { isExported = false } = opts;
  switch (node.type) {
    case "Literal":
      if (isRegExpLiteral(node)) return stringifier.regExpLiteral(node);
      if (isStringLiteral(node)) return stringifier.stringLiteral(node);
      return null;
    case "TemplateLiteral":
      return normalizeTemplateLiteral(node as TemplateLiteral);
    case "ThrowStatement":
      return normalizeThrowStatement(node as ThrowStatement);
    case "ArrayExpression":
      return normalizeArrayExpression(node as ArrayExpression);
    case "TSEnumDeclaration":
      return normalizeTSEnumDeclaration(node as TSEnumDeclaration, isExported);
    case "TSTypeAliasDeclaration":
      return normalizeTSTypeAliasDeclaration(
        node as TSTypeAliasDeclaration,
        isExported,
      );
    case "TSTypeAnnotation":
      return normalizeTSTypeAnnotation(node as TSTypeAnnotation);
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return normalizeFunctionNode(node as FunctionNode);
    default:
      return null;
  }
}

export const normalizer = {
  normalizeNode,
  normalizeTemplateLiteral,
  normalizeThrowStatement,
  normalizeArrayExpression,
  normalizeTSEnumDeclaration,
  normalizeTSTypeAliasDeclaration,
  normalizeTSTypeAnnotation,
  normalizeFunctionNode,
};
