import type {
  RegExpLiteral,
  TemplateLiteral,
  TSEnumDeclaration,
  TSType,
} from "oxc-parser";
import { extractCode } from "../utils";

export function normalizeRegExpLiteral(node: RegExpLiteral) {
  return `${node.regex.pattern}/${node.regex.flags}`;
}

export function normalizeTsEnumDeclaration(
  node: TSEnumDeclaration,
  code: string,
) {
  return node.body.members
    .map((member) => {
      const key = extractCode(member.id, code);
      const intializer = member.initializer
        ? extractCode(member.initializer, code)
        : null;
      return `[${[key, intializer].filter(Boolean).join()}]`;
    })
    .sort()
    .join();
}

export function normalizeTsType(node: TSType, code: string): string {
  switch (node.type) {
    case "TSUnionType": {
      return `union(${node.types
        .map((type) => normalizeTsType(type, code))
        .sort()
        .join()})`;
    }
    case "TSIntersectionType": {
      return `intersection(${node.types
        .map((type) => normalizeTsType(type, code))
        .sort()
        .join()})`;
    }
    default: {
      return extractCode(node, code);
    }
  }
}

export function normalizeTemplateLiteral(node: TemplateLiteral) {
  const parts: string[] = [];
  for (let i = 0; i < node.quasis.length; i++) {
    parts.push(node.quasis[i].value.raw);
    if (i < node.expressions.length) {
      parts.push("${exp}");
    }
  }
  return `"${parts.join()}"`;
}
