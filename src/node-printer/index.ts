import { createHash } from "crypto";
import { visitorKeys } from "oxc-parser";
import type {
  Node,
  ThrowStatement,
  ArrayExpression,
  TemplateLiteral,
  TSEnumDeclaration,
  TSEnumMember,
  TSTypeAliasDeclaration,
  TSTypeAnnotation,
  TSType,
  ArrowFunctionExpression,
  StringLiteral,
  IdentifierName,
  IdentifierReference,
} from "oxc-parser";

export const KEY_SEP = "\x01";

function isStringLiteral(node: Node): node is StringLiteral {
  return (
    node.type === "Literal" && typeof (node as StringLiteral).value === "string"
  );
}

function isIdentifierName(node: Node): node is IdentifierName {
  return node.type === "Identifier";
}

function isIdentifierReference(node: Node): node is IdentifierReference {
  return node.type === "Identifier";
}

export function printType(node: TSType): string {
  switch (node.type) {
    case "TSUnionType":
      return node.types.map(printType).sort().join("|");
    case "TSIntersectionType":
      return node.types.map(printType).sort().join("&");
    case "TSLiteralType": {
      const lit = node.literal;
      if (lit.type === "Literal") return JSON.stringify(lit.value);
      return "?";
    }
    case "TSTypeReference": {
      const name = isIdentifierReference(node.typeName)
        ? node.typeName.name
        : "?";
      return node.typeArguments
        ? `${name}<${node.typeArguments.params.map(printType).join(",")}>`
        : name;
    }
    case "TSTypeLiteral": {
      const members = node.members
        .map((m) => {
          if (m.type === "TSPropertySignature") {
            const key = isIdentifierName(m.key) ? m.key.name : "?";
            const value = m.typeAnnotation
              ? printType(m.typeAnnotation.typeAnnotation)
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
      return printType(node.typeAnnotation);
    case "TSArrayType":
      return `${printType(node.elementType)}[]`;
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

export function printTemplateLiteral(node: TemplateLiteral): string | null {
  if (node.expressions.length === 0) return null;
  const allEmpty =
    node.quasis[0].value.raw === "" &&
    node.quasis[node.quasis.length - 1].value.raw === "" &&
    node.quasis.length === 2;
  if (allEmpty) return null;
  const parts: string[] = [];
  for (let i = 0; i < node.quasis.length; i++) {
    parts.push(node.quasis[i].value.raw);
    if (i < node.expressions.length) parts.push("${...}");
  }
  return "`" + parts.join("") + "`";
}

export function printArrayExpression(node: ArrayExpression): string | null {
  const serialized = node.elements.map((el) => {
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

export function printThrowStatement(
  node: ThrowStatement,
): { key: string; name: string } | null {
  const { argument } = node;
  if (argument.type !== "NewExpression") return null;
  const { callee, arguments: args } = argument;
  if (callee.type !== "Identifier" || args.length === 0) return null;
  const firstArg = args[0];
  if (!isStringLiteral(firstArg)) return null;
  const key = `${callee.name}:${firstArg.value}`;
  const name = `new ${callee.name}("${firstArg.value}")`;
  return { key, name };
}

function extractEnumMemberKey(member: TSEnumMember): string | null {
  if (!member.initializer) return null;
  const init = member.initializer;
  if (init.type !== "Literal") return null;
  const memberName = isIdentifierName(member.id) ? member.id.name : null;
  if (!memberName) return null;
  return `${memberName}:${JSON.stringify(init.value)}`;
}

export function printTSEnumDeclaration(
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

export function printTSTypeAnnotation(node: TSTypeAnnotation): string | null {
  const { typeAnnotation } = node;
  if (
    typeAnnotation.type !== "TSUnionType" &&
    typeAnnotation.type !== "TSIntersectionType"
  ) {
    return null;
  }
  const printed = printType(typeAnnotation);
  return printed.includes("?") ? null : printed;
}

export function printTSTypeAliasDeclaration(
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
  const printed = printType(typeAnnotation);
  if (printed.includes("?")) return null;
  return `${printed}${KEY_SEP}${node.id.name}${KEY_SEP}${isExported ? "1" : "0"}`;
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

export function printFunctionNode(node: FunctionNode): string | null {
  if (!node.body) return null;
  const paramCount = node.params.length;
  const bodyHash = hashAst(node.body);
  return `${node.async ? "1" : "0"}${KEY_SEP}${paramCount}${KEY_SEP}${bodyHash}`;
}

export const nodePrinter = {
  type: printType,
  templateLiteral: printTemplateLiteral,
  arrayExpression: printArrayExpression,
  throwStatement: printThrowStatement,
  tsEnumDeclaration: printTSEnumDeclaration,
  tsTypeAnnotation: printTSTypeAnnotation,
  tsTypeAliasDeclaration: printTSTypeAliasDeclaration,
  functionNode: printFunctionNode,
  stringLiteal: (node: StringLiteral) => node.value,
};
