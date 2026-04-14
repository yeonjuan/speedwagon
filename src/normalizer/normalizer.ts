import type { TSEnumDeclaration, TSType, TSTypeAnnotation } from "oxc-parser";
import { extractCode } from "../utils";

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
